"""
FastAPI server, the bridge between Nextflow and the Client WebApp.

Flow:
  1. Browser calls POST /run  → we launch Nextflow as a subprocess, return a run_id
  2. Nextflow POSTs to POST /events on every task state change (via -with-weblog)
  3. Browser opens WS /ws/{run_id} → we push every task update live
  4. Browser can also poll GET /runs/{run_id} as a fallback

Start the server:
  uvicorn server:app --port 8000

DO NOT use --reload when a pipeline is running.
--reload watches every file under the current directory. Pipeline tools (like Strelka)
write Python scripts into the work/ folder, which triggers a restart and wipes
in-memory state, turning all subsequent events into orphans.
Use --reload only when actively editing code with no active run.
"""

import asyncio
import json
import logging
import os
import re
import shutil
import signal
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from anthropic import AsyncAnthropic
    _ai = AsyncAnthropic()   # reads ANTHROPIC_API_KEY from environment
except Exception:
    _ai = None


def _ai_ready() -> bool:
    """
    Whether an AI summary can actually be produced.

    The client constructs successfully even with no API key, it only fails when
    a request is made, so checking `_ai is not None` alone would let the UI
    offer a button that returns a 500. Check the key explicitly.
    """
    return _ai is not None and bool(os.environ.get("ANTHROPIC_API_KEY"))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import JSONResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="Petri")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory state (rebuilt from disk on startup)
# ---------------------------------------------------------------------------

# { our_run_id: { task_name: task_state } }
runs: dict[str, dict[str, Any]] = {}

# { our_run_id: [WebSocket, ...] }
clients: dict[str, list[WebSocket]] = {}

# { nextflow_run_id: our_run_id }, persisted to logs/run_map.json
nxf_to_ours: dict[str, str] = {}

# { our_run_id: subprocess.Popen }, lost on restart, recovered via saved PID
processes: dict[str, subprocess.Popen] = {}

_pending_run_id: str | None = None

# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)

RUN_MAP_FILE = LOG_DIR / "run_map.json"

# run_id values come from the URL, and several endpoints use them to build
# filesystem paths. Only ever accept the UUIDs we generate ourselves, plus the
# "orphan_<hex>" form created for events from an unrecognised Nextflow run.
_RUN_ID_RE = re.compile(r"^(orphan_)?[0-9a-fA-F-]{8,36}$")


def _safe_run_dir(run_id: str) -> Path | None:
    """
    Resolve results/<run_id>, or None if run_id is malformed or escapes the
    results directory. Without this a run_id of '../..' would walk the disk.
    """
    if not _RUN_ID_RE.match(run_id):
        return None
    candidate = (RESULTS_DIR / run_id).resolve()
    if not candidate.is_relative_to(RESULTS_DIR.resolve()):
        return None
    return candidate


def _save_run_map() -> None:
    """Persist nxf_run_id → our_run_id mapping so it survives server restarts."""
    RUN_MAP_FILE.write_text(json.dumps(nxf_to_ours, indent=2))


def _save_run_state(our_run_id: str) -> None:
    """Persist latest task states for a run so the polling endpoint works after restart."""
    path = LOG_DIR / f"{our_run_id}_state.json"
    path.write_text(json.dumps(runs[our_run_id], indent=2))


def _save_pid(our_run_id: str, pid: int) -> None:
    """Save the Nextflow process PID so we can stop it even after a server restart."""
    path = LOG_DIR / f"{our_run_id}_pid.txt"
    path.write_text(str(pid))


def _load_pid(our_run_id: str) -> int | None:
    path = LOG_DIR / f"{our_run_id}_pid.txt"
    if path.exists():
        try:
            return int(path.read_text().strip())
        except ValueError:
            return None
    return None


def _log_raw(our_run_id: str, payload: dict) -> None:
    path = LOG_DIR / f"{our_run_id}.jsonl"
    with path.open("a") as f:
        f.write(json.dumps(payload) + "\n")


# ---------------------------------------------------------------------------
# Startup: reload persisted state so in-flight pipelines keep routing correctly
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def _reload_state() -> None:
    global nxf_to_ours

    if RUN_MAP_FILE.exists():
        nxf_to_ours = json.loads(RUN_MAP_FILE.read_text())
        log.info("Loaded run map: %d entries", len(nxf_to_ours))

    for our_run_id in set(nxf_to_ours.values()):
        state_file = LOG_DIR / f"{our_run_id}_state.json"
        if state_file.exists():
            runs[our_run_id] = json.loads(state_file.read_text())
            clients[our_run_id] = []
            log.info("Reloaded run %s: %d tasks", our_run_id[:8], len(runs[our_run_id]))


# ---------------------------------------------------------------------------
# WebSocket broadcast
# ---------------------------------------------------------------------------

async def _broadcast(our_run_id: str, message: dict) -> None:
    dead = []
    for ws in clients.get(our_run_id, []):
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients[our_run_id].remove(ws)


def _short_name(full_name: str) -> str:
    return full_name.rsplit(":", 1)[-1].strip()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/run")
async def start_run():
    """
    Launch Nextflow and return a run_id for the browser to track.
    Waits 3 seconds to catch immediate startup failures before returning.
    """
    global _pending_run_id

    our_run_id = str(uuid.uuid4())
    runs[our_run_id] = {}
    clients[our_run_id] = []
    _pending_run_id = our_run_id

    outdir = Path("results") / our_run_id
    outdir.mkdir(parents=True, exist_ok=True)

    nxf_bin = Path.home() / "nextflow"
    if not nxf_bin.exists():
        _pending_run_id = None
        return JSONResponse(
            {"error": f"Nextflow binary not found at {nxf_bin}. Is it installed?"},
            status_code=500,
        )

    cmd = [
        str(nxf_bin),
        # -c must come BEFORE the `run` subcommand. Placed after it, Nextflow
        # silently ignores it and the lineage store is never created.
        "-c", str(Path("../clew/lineage.config").resolve()),
    ]

    # Petri-managed plugins (see plugins.config for what's enabled and why).
    # Nextflow merges multiple -c files in order, so this composes with the
    # lineage config above. The file is optional: remove it to run bare.
    plugins_config = Path("plugins.config").resolve()
    if plugins_config.exists():
        cmd += ["-c", str(plugins_config)]

    cmd += [
        "run", "nf-core/sarek",
        "-r", "3.8.1",
        "-profile", "test,docker",
        "--outdir", str(outdir),
        "-with-weblog", "http://127.0.0.1:8000/events",
        "-with-trace", str(outdir / "trace.txt"),
        "-with-report", str(outdir / "report.html"),
        "-with-timeline", str(outdir / "timeline.html"),
        "--input", str(Path("../clew/donors.csv").resolve()),
    ]

    env = os.environ.copy()
    env["NXF_SYNTAX_PARSER"] = "v1"

    stdout_log = open(LOG_DIR / f"{our_run_id}_nxf.stdout.log", "w")
    stderr_log_path = LOG_DIR / f"{our_run_id}_nxf.stderr.log"
    stderr_log = open(stderr_log_path, "w")

    proc = subprocess.Popen(cmd, env=env, stdout=stdout_log, stderr=stderr_log)
    processes[our_run_id] = proc
    _save_pid(our_run_id, proc.pid)

    await asyncio.sleep(3)
    if proc.poll() is not None:
        stderr_text = stderr_log_path.read_text()[-500:]
        _pending_run_id = None
        log.error("Nextflow exited immediately (code %s): %s", proc.returncode, stderr_text)
        return JSONResponse(
            {"error": f"Nextflow failed to start (exit {proc.returncode}). Check logs/{our_run_id}_nxf.stderr.log"},
            status_code=500,
        )

    log.info("Launched Nextflow run %s (pid %s)  outdir=%s", our_run_id[:8], proc.pid, outdir)
    asyncio.create_task(_monitor_process(proc, our_run_id))
    return {"run_id": our_run_id}


@app.post("/run/{run_id}/stop")
async def stop_run(run_id: str):
    """
    Stop a running pipeline gracefully.

    Sends SIGTERM to Nextflow. Nextflow catches this, stops any running Docker
    containers it launched, and exits. The whole pipeline, not just our server
    record, shuts down cleanly.

    If the server was restarted since the run started, we fall back to the saved
    PID file to find the process.
    """
    proc = processes.get(run_id)

    if proc is None or proc.poll() is not None:
        # Try to recover from the saved PID (server may have restarted)
        pid = _load_pid(run_id)
        if pid is None:
            return JSONResponse({"error": "Run not found or already finished."}, status_code=404)
        try:
            os.kill(pid, signal.SIGTERM)
            log.info("Sent SIGTERM to recovered pid %s for run %s", pid, run_id[:8])
            return {"ok": True, "message": "Stop signal sent to recovered process."}
        except ProcessLookupError:
            return JSONResponse({"error": "Process already exited."}, status_code=400)
        except PermissionError:
            return JSONResponse({"error": "No permission to stop that process."}, status_code=403)

    log.info("Stopping Nextflow pid %s for run %s", proc.pid, run_id[:8])
    proc.terminate()  # SIGTERM, Nextflow shuts down and stops its Docker containers
    return {"ok": True, "message": "Stop signal sent. Pipeline is shutting down."}


def _archive_runinsights_report(our_run_id: str) -> None:
    """
    nf-runinsights writes its report to the launch directory (this folder)
    and overwrites it on every run, so different runs clobber each other.
    Copy the just-finished run's report into that run's results folder so
    each dashboard run keeps its own snapshot.
    """
    src = Path("runinsights-report.md")
    if not src.exists():
        return
    try:
        shutil.copy2(src, Path("results") / our_run_id / "runinsights-report.md")
        log.info("Archived runinsights report for run %s", our_run_id[:8])
    except OSError as e:
        log.warning("Could not archive runinsights report: %s", e)


async def _monitor_process(proc: subprocess.Popen, our_run_id: str) -> None:
    """
    Watches the Nextflow process and notifies the browser when it exits.
    Nextflow sends a 'completed' weblog event on clean exits, but if it's
    killed or crashes mid-run that event never arrives, this is the fallback.
    """
    while proc.poll() is None:
        await asyncio.sleep(5)

    exit_code = proc.returncode
    # SIGTERM (-15) is a user-requested stop, not a crash
    if exit_code == 0 or exit_code == -signal.SIGTERM:
        log.info("Nextflow run %s finished (exit %s).", our_run_id[:8], exit_code)
        _archive_runinsights_report(our_run_id)
        await _broadcast(our_run_id, {"type": "run_complete", "exit_code": exit_code})
    else:
        log.error("Nextflow run %s failed (exit %s).", our_run_id[:8], exit_code)
        await _broadcast(
            our_run_id,
            {
                "type": "run_failed",
                "exit_code": exit_code,
                "message": f"Nextflow exited with code {exit_code}. See logs for details.",
            },
        )


# ---------------------------------------------------------------------------
# Benchmarks, read the nf-runinsights history store
# ---------------------------------------------------------------------------

# Must match `runinsights.history` in plugins.config. The plugin writes one
# JSON file per run into the history directory; the .jsonl file is the older
# single-file format, still read so pre-existing runs keep counting.
RUNINSIGHTS_DIR = Path.home() / ".nf-runinsights" / "history"
RUNINSIGHTS_LEGACY = Path.home() / ".nf-runinsights" / "history.jsonl"


def _load_insights_history() -> list[dict]:
    entries = []
    if RUNINSIGHTS_LEGACY.exists():
        for line in RUNINSIGHTS_LEGACY.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # one corrupt line must never hide the rest
    if RUNINSIGHTS_DIR.is_dir():
        for f in sorted(RUNINSIGHTS_DIR.glob("*.json")):
            try:
                entries.append(json.loads(f.read_text()))
            except (json.JSONDecodeError, OSError):
                continue
    entries.sort(key=lambda e: e.get("ts") or "")
    return entries


@app.get("/insights/runs")
async def insights_runs():
    """
    Every run the nf-runinsights plugin has recorded, newest first.
    The Benchmark view uses this list to let the user pick runs to compare.
    """
    runs = [
        {
            "run_name": e.get("run_name"),
            "ts": e.get("ts"),
            "pipeline": e.get("pipeline"),
            "processes": len(e.get("processes") or {}),
        }
        for e in _load_insights_history()
    ]
    runs.reverse()  # the file is append-only, so reversed = newest first
    return {"runs": runs}


@app.get("/insights/compare")
async def insights_compare(runs: str):
    """
    Side-by-side benchmark of the named runs. `runs` is comma-separated run
    names in the order chosen; the FIRST one is the baseline that per-run
    deltas are computed against.
    """
    wanted = [r.strip() for r in runs.split(",") if r.strip()]
    if len(wanted) < 2:
        return JSONResponse({"error": "Pick at least two runs to compare."}, status_code=400)

    by_name: dict[str, dict] = {}
    for e in _load_insights_history():
        by_name[e.get("run_name")] = e  # if a name ever repeats, last write wins

    missing = [w for w in wanted if w not in by_name]
    if missing:
        return JSONResponse(
            {"error": f"Run(s) not in history: {', '.join(missing)}"}, status_code=404
        )

    selected = [by_name[w] for w in wanted]
    pipelines = {e.get("pipeline") for e in selected}
    if len(pipelines) > 1:
        return JSONResponse(
            {
                "error": "Runs span different pipelines "
                f"({', '.join(sorted(p or '?' for p in pipelines))}), "
                "compare runs of the same pipeline."
            },
            status_code=400,
        )

    # Union of process names across the selected runs (a process can be
    # missing from a run, e.g. after a pipeline version change).
    names: list[str] = []
    for e in selected:
        for p in e.get("processes") or {}:
            if p not in names:
                names.append(p)

    def cell(e: dict, proc: str) -> dict | None:
        rec = (e.get("processes") or {}).get(proc)
        if not rec:
            return None
        return {
            "median_ms": rec.get("realtime_ms_median"),
            "tasks": rec.get("tasks"),
            "peak_rss": rec.get("peak_rss_max"),
            "failed": rec.get("failed"),
        }

    processes = []
    for proc in names:
        vals = [cell(e, proc) for e in selected]
        base = (vals[0] or {}).get("median_ms")
        deltas = []
        for v in vals:
            if not base or v is None or v.get("median_ms") is None:
                deltas.append(None)
            else:
                deltas.append(round((v["median_ms"] - base) / base * 100, 1))
        processes.append({"name": proc, "values": vals, "delta_pct": deltas})

    # Slowest baseline first, so the rows that dominate runtime are on top
    processes.sort(
        key=lambda p: (p["values"][0] or {}).get("median_ms") or -1, reverse=True
    )

    return {
        "runs": [
            {"run_name": e.get("run_name"), "ts": e.get("ts"), "pipeline": e.get("pipeline")}
            for e in selected
        ],
        "processes": processes,
    }


@app.post("/insights/ask")
async def insights_ask(request: Request):
    """
    Free-form question over the run history, answered by Claude.

    Same division of labour as the plugin's report narration: we hand the
    model the recorded numbers (process names and statistics only) and it
    explains, it is instructed never to invent values. The history is
    small, so we stuff it as context rather than building a tool loop.
    """
    if not _ai_ready():
        return JSONResponse(
            {"error": "ANTHROPIC_API_KEY is not set on the server."}, status_code=503
        )

    body = await request.json()
    question = (body.get("question") or "").strip()
    if not question:
        return JSONResponse({"error": "Ask a question."}, status_code=400)
    pipeline = body.get("pipeline")
    run_names = body.get("runs") or []

    entries = _load_insights_history()
    if pipeline:
        entries = [e for e in entries if e.get("pipeline") == pipeline]
    if run_names:
        entries = [e for e in entries if e.get("run_name") in run_names]
    # keep the payload bounded on long histories; newest runs matter most
    entries = entries[-10:]
    if not entries:
        return JSONResponse({"error": "No matching runs in history."}, status_code=404)

    context = json.dumps(entries, separators=(",", ":"))
    if len(context) > 40_000:
        context = context[:40_000] + '"...truncated"'

    prompt = (
        "You are answering a question about Nextflow pipeline run performance, "
        "using history recorded by the nf-runinsights plugin. Each entry is one "
        "run with per-process metrics: realtime_ms_median/max (task duration), "
        "peak_rss_max (bytes), queue_ms_median (executor queue wait), "
        "cpu_eff_median (fraction of requested CPUs used), read_bytes_total, "
        "retried, failed, container, and requested resources.\n\n"
        "Rules: use ONLY numbers present in the data, never invent or "
        "extrapolate values. Format times and bytes readably. Be specific and "
        "direct; when the data cannot answer the question, say exactly what is "
        "missing. Never declare one run 'better' or 'worse' overall unless its "
        "task durations actually support that, richer recorded metadata is NOT "
        "better performance; if some runs lack fields that newer runs have, say "
        "that plainly and keep it separate from any performance verdict. Low "
        "cpu_eff_median means the process used less CPU than requested (an "
        "over-provisioning signal), not parallelism. Answer in under 200 "
        "words.\n\n"
        f"RUN HISTORY (oldest first):\n{context}\n\n"
        f"QUESTION: {question}"
    )

    try:
        # Haiku, matching the analyze endpoint: history Q&A is summarisation
        # over provided numbers, and per-question cost stays under a cent.
        msg = await _ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = msg.content[0].text
        # Haiku 4.5: $1/M input, $5/M output, same cost-visibility
        # discipline as the analyze endpoint.
        u = msg.usage
        cost_usd = u.input_tokens / 1e6 * 1.0 + u.output_tokens / 1e6 * 5.0
        log.info(
            "insights ask done  in=%d out=%d cost=$%.5f  q=%.60s",
            u.input_tokens, u.output_tokens, cost_usd, question,
        )
        return {"answer": answer, "runs_in_context": len(entries),
                "usage": {"input_tokens": u.input_tokens,
                          "output_tokens": u.output_tokens,
                          "cost_usd": round(cost_usd, 5)}}
    except Exception as e:
        log.error("Anthropic API error: %s", e)
        return JSONResponse({"error": f"Ask failed: {e}"}, status_code=500)


@app.post("/events")
async def receive_event(request: Request):
    """
    Nextflow POSTs here on every task state change.
    We route it to the right run bucket, persist state, and push to browsers.
    """
    global _pending_run_id

    body = await request.body()
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return JSONResponse({"error": "bad json"}, status_code=400)

    nxf_run_id = payload.get("runId", "unknown")
    event = payload.get("event", "unknown")
    trace = payload.get("trace", {})
    full_name = trace.get("name", "")

    # Run-level events (started/completed) have no task name, skip card creation
    # but still do the runId mapping so task events that follow route correctly.
    if not full_name:
        log.info("run-level event '%s' for nxf run %s", event, nxf_run_id[:8])
        if nxf_run_id not in nxf_to_ours and _pending_run_id:
            nxf_to_ours[nxf_run_id] = _pending_run_id
            _save_run_map()
            log.info("Mapped nxf run %s → our run %s", nxf_run_id[:8], _pending_run_id[:8])
            _pending_run_id = None
        return JSONResponse({"ok": True})

    if nxf_run_id not in nxf_to_ours:
        if _pending_run_id:
            nxf_to_ours[nxf_run_id] = _pending_run_id
            _save_run_map()
            log.info("Mapped nxf run %s → our run %s", nxf_run_id[:8], _pending_run_id[:8])
            _pending_run_id = None
        else:
            orphan_id = f"orphan_{nxf_run_id[:8]}"
            if orphan_id not in runs:
                runs[orphan_id] = {}
                clients[orphan_id] = []
            nxf_to_ours[nxf_run_id] = orphan_id
            _save_run_map()
            log.warning("Unknown runId %s → stored as %s", nxf_run_id[:8], orphan_id)

    our_run_id = nxf_to_ours[nxf_run_id]
    _log_raw(our_run_id, payload)

    task_state = {
        "name": full_name,
        "short_name": _short_name(full_name),
        "event": event,
        "status": trace.get("status", ""),
        "exit_code": trace.get("exit"),
        "duration_ms": trace.get("duration"),
        "realtime_ms": trace.get("realtime"),
        "submit_ts": trace.get("submit"),
        "start_ts": trace.get("start"),
        "complete_ts": trace.get("complete"),
        "container": trace.get("container", ""),
        "hash": trace.get("hash", ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    runs[our_run_id][full_name] = task_state
    _save_run_state(our_run_id)

    log.info(
        "run=%s  event=%-25s  status=%-12s  %s",
        our_run_id[:8], event, task_state["status"], task_state["short_name"],
    )

    await _broadcast(our_run_id, {"type": "task_update", "task": task_state})
    return JSONResponse({"ok": True})


# Which MultiQC data keys belong to each pipeline group.
# multiqc_data.json uses keys like "multiqc_fastqc", "multiqc_picard_dups" etc.
_GROUP_KEYS: dict[str, list[str]] = {
    "Quality Check":   ["fastqc"],
    "Trim & Align":    ["trimgalore", "cutadapt", "bowtie2", "bwa", "samtools_flagstat", "samtools_alignment"],
    "Deduplication":   ["picard", "markdup", "gatk_baserecalibrator", "gatk_applybqsr"],
    "Variant Calling": ["strelka", "gatk_haplotypecaller", "mutect"],
    "Genome Prep":     ["samtools_faidx"],
    "Report":          [],   # empty = use all general stats
}

_GROUP_CONTEXT: dict[str, str] = {
    "Quality Check":   "raw sequencing read quality (FastQC results)",
    "Trim & Align":    "adapter trimming and alignment to the reference genome",
    "Deduplication":   "PCR duplicate removal and base quality recalibration",
    "Variant Calling": "somatic or germline variant calling",
    "Genome Prep":     "reference genome indexing",
    "Report":          "the full pipeline run",
}


@app.post("/runs/{run_id}/analyze")
async def analyze_group(run_id: str, request: Request):
    """
    Read MultiQC output for a finished run, extract the section relevant to
    the requested pipeline group, and ask Claude to summarise it in plain English.
    """
    if not _ai_ready():
        return JSONResponse({"error": "ANTHROPIC_API_KEY is not set on the server."}, status_code=503)

    body = await request.json()
    group = body.get("group", "")

    run_dir = _safe_run_dir(run_id)
    if run_dir is None:
        return JSONResponse({"error": "Invalid run id."}, status_code=400)

    # Result cache, the real cost lever. Each (run, group) summary is billed
    # once: re-clicking Analyze, or re-analyzing after a server restart, reads
    # the saved summary instead of paying for another API call. During testing
    # the same groups get analyzed over and over, which is what runs up spend.
    cache_path = run_dir / "ai_analysis.json"
    cache: dict[str, str] = {}
    if cache_path.exists():
        try:
            cache = json.loads(cache_path.read_text())
        except json.JSONDecodeError:
            cache = {}
    if group in cache:
        log.info("AI analysis cache hit  run=%s  group='%s'  (no API call)", run_id[:8], group)
        return {"summary": cache[group], "cached": True}

    multiqc_json = run_dir / _MULTIQC_DATA
    if not multiqc_json.exists():
        return JSONResponse(
            {"error": "MultiQC data not found. The pipeline may still be running or MultiQC hasn't completed yet."},
            status_code=404,
        )

    data = json.loads(multiqc_json.read_text())
    general   = data.get("report_general_stats_data", [])
    saved     = data.get("report_saved_raw_data", {})

    keywords = _GROUP_KEYS.get(group, [])
    if keywords:
        relevant = {k: v for k, v in saved.items() if any(kw in k.lower() for kw in keywords)}
    else:
        relevant = saved   # Report group: include everything

    context = json.dumps({"general_stats": general, "group_data": relevant}, indent=2)
    if len(context) > 5000:
        context = context[:5000] + "\n... (truncated for length)"

    step_desc = _GROUP_CONTEXT.get(group, group)
    prompt = (
        f"You are a bioinformatics assistant helping a researcher understand their nf-core/sarek "
        f"DNA sequencing pipeline results.\n\n"
        f"The pipeline step being reviewed is **{group}**, {step_desc}.\n\n"
        f"Here is the relevant QC data from MultiQC:\n\n{context}\n\n"
        f"Write a 3–5 sentence plain-English summary covering:\n"
        f"1. Whether this step looks successful and within normal ranges\n"
        f"2. Any metrics that stand out (good or bad), with the actual numbers\n"
        f"3. What this means for the downstream analysis\n\n"
        f"Write for a researcher who understands biology but is not a bioinformatics expert. "
        f"Be specific and direct, avoid vague phrases like 'looks good'."
    )

    try:
        msg = await _ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        summary = msg.content[0].text

        # Measure real per-call cost. Haiku 4.5: $1/M input, $5/M output.
        # This is what turns "the API feels expensive" into an exact number.
        u = msg.usage
        cost_usd = u.input_tokens / 1e6 * 1.0 + u.output_tokens / 1e6 * 5.0
        log.info(
            "AI analysis done  run=%s  group='%s'  in=%d out=%d  cost=$%.5f",
            run_id[:8], group, u.input_tokens, u.output_tokens, cost_usd,
        )

        # Persist so this (run, group) is never billed twice (see cache above).
        cache[group] = summary
        cache_path.write_text(json.dumps(cache))

        return {
            "summary": summary,
            "cached": False,
            "usage": {
                "input_tokens": u.input_tokens,
                "output_tokens": u.output_tokens,
                "cost_usd": round(cost_usd, 5),
            },
        }
    except Exception as e:
        log.error("Anthropic API error: %s", e)
        return JSONResponse({"error": f"AI analysis failed: {e}"}, status_code=500)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
# Every one of these is written by the pipeline or the engine, Petri generates
# no report content, it only locates the files and serves them. All three are
# self-contained HTML (assets inlined), so serving the file alone is enough.
#
# Note these are per-RUN, not per-task: Nextflow emits one execution report and
# one timeline for the whole run, and MultiQC aggregates every tool's output
# into a single document.
# The file the analyze endpoint reads. MultiQC writes it when its task finishes,
# which is at the very end of the run, long after the earlier stages complete.
_MULTIQC_DATA = Path("multiqc") / "multiqc_data" / "multiqc_data.json"

_REPORTS: list[dict[str, str]] = [
    {
        "key": "multiqc",
        "label": "MultiQC Report",
        "path": "multiqc/multiqc_report.html",
        "description": "Aggregated quality-control metrics across every tool in the run.",
    },
    {
        "key": "execution",
        "label": "Execution Report",
        "path": "report.html",
        "description": "Nextflow resource usage: CPU, memory, I/O and runtime per process.",
    },
    {
        "key": "timeline",
        "label": "Timeline",
        "path": "timeline.html",
        "description": "Gantt chart of when each task started and finished.",
    },
]


@app.get("/runs/{run_id}/reports")
async def list_reports(run_id: str):
    """
    Report availability for a run.

    Reports appear at different times, Nextflow writes report.html and
    timeline.html when the run ends, while MultiQC's arrives as soon as the
    MultiQC task finishes. The frontend polls this so links appear only once
    the file is actually on disk, rather than rendering links that 404.

    Also reports whether the analyze endpoint has data to work with. A stage's
    tasks can all be DONE while MultiQC has yet to run, so "stage finished" is
    not a safe signal for enabling the Analyze button, this is.
    """
    run_dir = _safe_run_dir(run_id)
    if run_dir is None:
        return JSONResponse({"error": "Invalid run id."}, status_code=400)

    available = [
        {
            "key": r["key"],
            "label": r["label"],
            "description": r["description"],
            "url": f"/results/{run_id}/{r['path']}",
        }
        for r in _REPORTS
        if (run_dir / r["path"]).exists()
    ]
    return {
        "run_id": run_id,
        "reports": available,
        "analyze_available": (run_dir / _MULTIQC_DATA).exists() and _ai_ready(),
    }


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    if run_id not in runs:
        return JSONResponse({"error": "run not found"}, status_code=404)
    return {"run_id": run_id, "tasks": list(runs[run_id].values())}


# ---------------------------------------------------------------------------
# Static files, must be mounted last so it cannot shadow the routes above.
# ---------------------------------------------------------------------------
# Serves results/<run_id>/... at http://localhost:8000/results/<run_id>/...
# Starlette normalises the path and rejects traversal outside the directory.
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")


@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await websocket.accept()

    if run_id not in clients:
        clients[run_id] = []
    clients[run_id].append(websocket)

    snapshot = list(runs.get(run_id, {}).values())
    await websocket.send_json({"type": "snapshot", "tasks": snapshot})

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in clients.get(run_id, []):
            clients[run_id].remove(websocket)

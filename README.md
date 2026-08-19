# Petri

A local web dashboard for Nextflow / nf-core pipeline runs. Launches a pipeline,
streams live per-task status over a WebSocket, and serves the resulting HTML reports.

Nextflow reports progress to the terminal as a continuously rewritten block of text.
Petri consumes the same underlying event stream and renders it as a card per task,
grouped by pipeline stage, with per-task timings and links to the generated reports.

<!-- Add a screenshot or GIF of a live run here. -->

---

## Overview

- **Live task status** — every task appears as a card and transitions through
  `QUEUED → RUNNING → DONE` / `FAILED`, with an elapsed timer while running.
- **Stage grouping** — tasks are grouped into pipeline stages (Genome Prep,
  Quality Check, Trim & Align, Deduplication, Variant Calling, Report).
- **Reports** — MultiQC, Nextflow execution report, and timeline are served over
  HTTP and linked from the dashboard as soon as each file is written.
- **Run control** — start a run, stop a running pipeline (SIGTERM, so Nextflow
  shuts down its Docker containers cleanly).
- **Crash tolerance** — task state is persisted to disk, so the dashboard recovers
  after a server restart. The frontend reconnects automatically.
- **AI stage summaries** — an **Analyze** button on each completed stage explains that
  stage's QC metrics in plain English. Optional; requires an Anthropic API key.
- **Pipeline catalogue** — a second view indexing every active nf-core pipeline,
  grouped by the question each one answers. Read-only, and a static snapshot, so it
  works offline and while a run is in progress.

Petri generates no report content and defines no pipeline logic. It runs existing
nf-core pipelines and presents what they emit.

---

## How it works

```
Frontend (React)  ── POST /run ──────▶  Server (FastAPI)  ── nextflow run ──▶  Nextflow
   browser        ◀── WS task events ──   localhost:8000   ◀── POST /events ──   engine
```

The server launches Nextflow with `-with-weblog http://127.0.0.1:8000/events`. That
flag makes Nextflow POST a JSON message on every task state change. The server
updates an in-memory `{task_name -> state}` map, appends the raw payload to a
JSONL file, and broadcasts the change to connected browsers over a WebSocket.

Weblog delivery is asynchronous and not guaranteed, so every payload is persisted
before processing, a watcher reports a terminal state when no final event arrives,
and `-with-trace` gives a `trace.txt` that is authoritative for final task status.

---

## AI stage summaries

MultiQC reports the right numbers but assumes you know what they should be. A duplication
rate of 18% or a mean coverage of 31× means little without a reference point. When every
task in a stage has finished, an **Analyze** button sends that stage's MultiQC metrics to
the Anthropic API and renders a short plain-English readout below the task cards.

**What leaves the machine:** only MultiQC's aggregated summary statistics — read counts,
GC content, duplication rates, coverage depth, and similar numbers, plus sample names as
MultiQC recorded them. No raw reads, no sequences, and no alignment or variant files are
sent. Sample names may still be identifying depending on how they were assigned, so treat
this the way you would any other third-party API call before pointing it at real data.

**Enabling it** — export a key in the shell that starts the server:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
uvicorn server:app --port 8000
```

Without a key the server starts and runs pipelines normally; the endpoint returns HTTP
503 and the button surfaces that as an error. The `anthropic` package is also optional —
`server.py` degrades gracefully if the import fails.

Summaries read MultiQC's aggregated output, which is written only when the MultiQC task
completes, so stages cannot be analyzed the moment they individually finish.

---

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.10+ | Uses `X \| Y` type syntax and `Path.is_relative_to` |
| Node.js | 18+ | Vite 8 build |
| Nextflow | 23+ | Must be executable at `~/nextflow` — see Configuration |
| Docker | any recent | Must be running; nf-core pipelines execute in containers |

The default pipeline is `nf-core/sarek` with the `test,docker` profile. Nextflow
downloads it on first run. Expect several GB of container images and reference data,
and 10–30 minutes for the first run depending on network speed.

---

## Installation

```bash
git clone https://github.com/QuietFlare/Petri.git
cd Petri

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd petri-frontend
npm install
cd ..
```

---

## Running

Docker must be running first. Then start the two processes in separate terminals.

**Terminal 1 — server:**

```bash
source .venv/bin/activate
uvicorn server:app --port 8000
```

> Do not use `--reload`. It watches every file under the working directory, and
> some pipeline tools write Python scripts into `work/`, which triggers a restart
> mid-run and drops in-memory state. Use `--reload` only when editing code with no
> active run.

**Terminal 2 — frontend:**

```bash
cd petri-frontend
npm run dev
```

Open <http://localhost:5173> and click **Run Pipeline**.

Task cards appear within a minute or two of starting; the delay before the first
card is Nextflow resolving the pipeline and pulling containers. Report links appear
as each report file is written — MultiQC's when the MultiQC task finishes, the
execution report and timeline when the run exits.

### Without running a pipeline

To exercise the UI without a real run, `test_events.py` posts synthetic weblog
events to the server:

```bash
python3 test_events.py
```

---

## Configuration

| Setting | Location | Default |
|---|---|---|
| Pipeline, revision, profile | `server.py`, `start_run()` | `nf-core/sarek`, `3.8.1`, `test,docker` |
| Nextflow binary path | `server.py`, `start_run()` | `~/nextflow` |
| Server URL | `petri-frontend/src/App.jsx` | `http://localhost:8000` |
| Allowed CORS origin | `server.py` | `http://localhost:5173` |
| `ANTHROPIC_API_KEY` | environment | unset (AI summaries disabled) |

These are currently hardcoded.

See [AI stage summaries](#ai-stage-summaries) for `ANTHROPIC_API_KEY` and `.env.example`.

---

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/run` | Launch a pipeline; returns `{ run_id }` |
| `POST` | `/run/{run_id}/stop` | SIGTERM the Nextflow process |
| `POST` | `/events` | Weblog receiver (called by Nextflow, not the browser) |
| `GET` | `/runs/{run_id}` | Current task states; polling fallback for the WebSocket |
| `GET` | `/runs/{run_id}/reports` | Reports currently present on disk for a run |
| `POST` | `/runs/{run_id}/analyze` | AI summary of a stage's MultiQC metrics |
| `WS` | `/ws/{run_id}` | Live task updates; sends a full snapshot on connect |
| `GET` | `/results/{run_id}/...` | Static file access to pipeline output |

Interactive docs are available at <http://localhost:8000/docs> while the server runs.

---

## Project layout

```
server.py              FastAPI server: launches Nextflow, receives events, serves reports
weblog_listener.py     Standalone event printer, no web app — useful for debugging weblog
test_events.py         Posts synthetic events to the server to exercise the UI
requirements.txt       Python dependencies
petri.config           Optional Nextflow config: caps maxForks so QUEUED is visible
scripts/gen_catalog.py Regenerates the pipeline catalogue from nf-co.re/pipelines.json

petri-frontend/
  src/App.jsx          Dashboard: run control, WebSocket, stage sections, report links
  src/TaskCard.jsx     Single task card with status badge and elapsed timer
  src/pipeline.js      Task→stage grouping and event→status derivation
  src/Catalog.jsx      Pipeline catalogue view: search and filter, launches nothing
  src/pipelineCatalog.js  Static nf-core snapshot            (generated, committed)
  src/App.css          Styles

results/<run_id>/      Pipeline output, reports, trace.txt   (generated, gitignored)
logs/                  Raw event JSONL, task state, PIDs      (generated, gitignored)
work/                  Nextflow scratch directory             (generated, gitignored)
```

---

## Limitations

- Single user, single concurrent run. No authentication — bind to localhost only.
- In-memory state with file-backed persistence; there is no database.
- Stage grouping rules are specific to nf-core/sarek. Another pipeline will run
  correctly but most of its tasks will fall into the "Other" group.
- Reports are per run, not per task. Nextflow emits one execution report and one
  timeline for the whole run, and MultiQC aggregates every tool into one document.

---

## Acknowledgements

Petri is a viewer for other people's tools:

- [Nextflow](https://www.nextflow.io/) — workflow engine (Apache 2.0)
- [nf-core](https://nf-co.re/) — curated pipelines, including
  [sarek](https://nf-co.re/sarek) (MIT)
- [MultiQC](https://multiqc.info/) — aggregate QC reporting (GPL-3.0)

---

## License

MIT — see [LICENSE](LICENSE).

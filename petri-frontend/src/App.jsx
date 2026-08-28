/**
 * Petri, main app component.
 *
 * State machine per task (derived from weblog events):
 *   process_submitted  → QUEUED   (waiting for a worker slot)
 *   process_started    → RUNNING  (executing inside Docker)
 *   process_completed  → DONE or FAILED (based on exit code)
 *   error              → FAILED
 *
 * WebSocket reconnect:
 *   When the server restarts (e.g. --reload triggered by Strelka writing .py files),
 *   the WebSocket drops. We auto-reconnect up to MAX_RECONNECT times with increasing
 *   delays. On reconnect the server sends a full snapshot so the UI catches up.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import TaskCard from "./TaskCard";
import Catalog from "./Catalog";
import Benchmark from "./Benchmark";
import { GROUPS, getGroup, getDisplayStatus } from "./pipeline";
import "./App.css";

const SERVER = "http://localhost:8000";
const WS_SERVER = "ws://localhost:8000";
const MAX_RECONNECT = 8;    // give up after 8 attempts (~30 seconds total)
const REPORT_POLL_MS = 8000;
const TOTAL_REPORTS = 3;    // multiqc + execution report + timeline; stop polling at this many

export default function App() {
  const [runId, setRunId] = useState(null);
  const [tasks, setTasks] = useState({});
  // idle | starting | running | reconnecting | done | error
  const [appStatus, setAppStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  // dashboard | catalog | benchmark. Only the body swaps, App stays mounted
  // so the WebSocket and report polling keep running while browsing.
  const [view, setView] = useState("dashboard");

  // { groupName: { status: "loading"|"done"|"error", text, collapsed } }
  const [summaries, setSummaries] = useState({});

  // [{ key, label, description, url }], reports the server has found on disk
  const [reports, setReports] = useState([]);

  // Whether MultiQC's data file exists yet. A stage can be fully DONE long
  // before MultiQC runs, so this, not stage completion, gates Analyze.
  const [analyzeAvailable, setAnalyzeAvailable] = useState(false);

  // Launchable presets from the server's pipelines.json. Distinct from the
  // Catalog view, which lists every nf-core pipeline as read-only reference.
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState("");

  useEffect(() => {
    fetch(`${SERVER}/pipelines`)
      .then((res) => res.json())
      .then((body) => {
        setPipelines(body.pipelines || []);
        setSelectedPipeline(body.default || body.pipelines?.[0]?.key || "");
      })
      .catch(() => setPipelines([])); // server down: Run still works, default preset
  }, []);

  const wsRef = useRef(null);
  const receivedEventsRef = useRef(false);
  // Set to true before we deliberately close the socket (new run, stop, unmount)
  // so onclose knows not to reconnect.
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const applyTask = useCallback((task) => {
    setTasks((prev) => ({ ...prev, [task.name]: task }));
  }, []);

  const connectWs = useCallback(
    (id) => {
      const ws = new WebSocket(`${WS_SERVER}/ws/${id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0; // successful connection resets the counter
        setAppStatus("running");
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "snapshot") {
          // Full catch-up on connect (or reconnect after server restart)
          const map = {};
          for (const t of msg.tasks) map[t.name] = t;
          setTasks(map);
          if (msg.tasks.length > 0) receivedEventsRef.current = true;
        } else if (msg.type === "task_update") {
          receivedEventsRef.current = true;
          applyTask(msg.task);
        } else if (msg.type === "run_complete") {
          // Pipeline finished normally, mark intentional so onclose won't reconnect
          intentionalCloseRef.current = true;
          setAppStatus("done");
        } else if (msg.type === "run_failed") {
          intentionalCloseRef.current = true;
          setAppStatus("error");
          setErrorMsg(msg.message || "Pipeline failed, check server logs.");
        }
      };

      ws.onerror = () => {
        // onerror always fires before onclose; let onclose handle the reconnect logic
      };

      ws.onclose = () => {
        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false;
          return; // deliberate close, new run, stop, or pipeline finished
        }

        // Unexpected close, server likely restarted (e.g. Strelka wrote a .py file
        // into work/ and uvicorn's --reload triggered). Try to reconnect.
        if (reconnectAttemptsRef.current < MAX_RECONNECT) {
          reconnectAttemptsRef.current++;
          // Back off: 2s, 3s, 4s … capped at 5s
          const delay = Math.min(2000 + (reconnectAttemptsRef.current - 1) * 1000, 5000);
          setAppStatus("reconnecting");
          setTimeout(() => connectWs(id), delay);
        } else {
          reconnectAttemptsRef.current = 0;
          setAppStatus("error");
          setErrorMsg(
            "Lost connection to server after several retries. Refresh the page to reconnect."
          );
        }
      };
    },
    [applyTask]
  );

  // Deliberately close on unmount
  useEffect(
    () => () => {
      intentionalCloseRef.current = true;
      wsRef.current?.close();
    },
    []
  );

  /**
   * Poll for available reports.
   *
   * Reports land at different times: MultiQC's appears as soon as the MultiQC
   * task finishes, while Nextflow flushes report.html and timeline.html only
   * when the run exits, sometimes a moment after the process is gone. So we
   * poll during the run and keep polling briefly after it ends, stopping once
   * all three are found.
   */
  useEffect(() => {
    if (!runId) return;
    if (appStatus !== "running" && appStatus !== "done") return;
    if (reports.length === TOTAL_REPORTS) return;

    let cancelled = false;

    const fetchReports = async () => {
      try {
        const res = await fetch(`${SERVER}/runs/${runId}/reports`);
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        setReports(body.reports || []);
        setAnalyzeAvailable(Boolean(body.analyze_available));
      } catch {
        // Server unreachable, the next tick retries.
      }
    };

    fetchReports();
    const timer = setInterval(fetchReports, REPORT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [runId, appStatus, reports.length]);

  const handleRun = async () => {
    setTasks({});
    setErrorMsg(null);
    setReports([]);
    setAnalyzeAvailable(false);
    setSummaries({});
    setAppStatus("starting");
    receivedEventsRef.current = false;
    reconnectAttemptsRef.current = 0;
    intentionalCloseRef.current = true; // close current socket without triggering reconnect
    wsRef.current?.close();

    try {
      const res = await fetch(`${SERVER}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline: selectedPipeline }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const { run_id } = await res.json();
      setRunId(run_id);
      connectWs(run_id);
    } catch (err) {
      setAppStatus("error");
      setErrorMsg(err.message);
    }
  };

  const handleAnalyze = async (group) => {
    setSummaries((prev) => ({
      ...prev,
      [group]: { status: "loading", text: null, collapsed: false },
    }));
    try {
      const res = await fetch(`${SERVER}/runs/${runId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Server returned ${res.status}`);
      setSummaries((prev) => ({
        ...prev,
        [group]: { status: "done", text: body.summary, collapsed: false },
      }));
    } catch (err) {
      setSummaries((prev) => ({
        ...prev,
        [group]: { status: "error", text: err.message, collapsed: false },
      }));
    }
  };

  const toggleSummary = (group) => {
    setSummaries((prev) => ({
      ...prev,
      [group]: { ...prev[group], collapsed: !prev[group].collapsed },
    }));
  };

  const handleStop = async () => {
    if (!runId) return;
    try {
      const res = await fetch(`${SERVER}/run/${runId}/stop`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(body.error || "Failed to stop pipeline.");
      } else {
        intentionalCloseRef.current = true;
        setAppStatus("done");
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg("Could not reach server: " + err.message);
    }
  };

  const taskList = Object.values(tasks);
  const counts = taskList.reduce((acc, t) => {
    const s = getDisplayStatus(t);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Group tasks by pipeline stage, preserving the GROUPS order
  const grouped = {};
  for (const task of taskList) {
    const g = getGroup(task);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(task);
  }
  const activeGroups = GROUPS.filter((g) => grouped[g]?.length > 0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Petri</h1>
        <p className="subtitle">
          {pipelines.find((p) => p.key === selectedPipeline)?.label ||
            "nf-core pipeline dashboard"}
        </p>

        <nav className="view-tabs">
          <button
            className={`view-tab ${view === "dashboard" ? "view-tab--active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`view-tab ${view === "catalog" ? "view-tab--active" : ""}`}
            onClick={() => setView("catalog")}
          >
            Pipelines
          </button>
          <button
            className={`view-tab ${view === "benchmark" ? "view-tab--active" : ""}`}
            onClick={() => setView("benchmark")}
          >
            Benchmark
          </button>
        </nav>

        {/* Run controls belong to the dashboard only, the catalogue is read-only.
            A run in progress keeps going while the catalogue is open. */}
        {view === "dashboard" && (
          <>
            {appStatus === "running" ? (
              <button className="stop-btn" onClick={handleStop}>
                Stop Pipeline
              </button>
            ) : (
              <div className="run-controls">
                {pipelines.length > 1 && (
                  <select
                    className="pipeline-select"
                    value={selectedPipeline}
                    onChange={(e) => setSelectedPipeline(e.target.value)}
                    disabled={appStatus === "starting"}
                    title="Which pipelines.json preset the Run button launches"
                  >
                    {pipelines.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="run-btn"
                  onClick={handleRun}
                  disabled={appStatus === "starting" || appStatus === "reconnecting"}
                >
                  {appStatus === "starting" ? "Starting…" : "Run Pipeline"}
                </button>
              </div>
            )}

            {appStatus === "reconnecting" && (
              <p className="reconnecting-msg">
                Server restarted, reconnecting… (attempt {reconnectAttemptsRef.current}/
                {MAX_RECONNECT})
              </p>
            )}

            {taskList.length > 0 && appStatus !== "reconnecting" && (
              <p className="summary">
                {counts.DONE || 0} done &middot; {counts.RUNNING || 0} running &middot;{" "}
                {counts.QUEUED || 0} queued
                {counts.FAILED ? ` · ${counts.FAILED} failed` : ""}
              </p>
            )}

            {appStatus === "done" && <p className="done-msg">Pipeline finished.</p>}
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
          </>
        )}
      </header>

      {view === "catalog" && <Catalog />}
      {view === "benchmark" && <Benchmark />}

      {view === "dashboard" && reports.length > 0 && (
        <section className="reports">
          <div className="section-header-row">
            <h2 className="section-header">Reports</h2>
          </div>
          <div className="report-grid">
            {reports.map((r) => (
              <a
                key={r.key}
                className="report-link"
                href={`${SERVER}${r.url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="report-label">{r.label}</span>
                <span className="report-desc">{r.description}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <main>
        {view === "dashboard" && activeGroups.map((group) => {
          const groupTasks = grouped[group];
          const allDone = groupTasks.every((t) => {
            const s = getDisplayStatus(t);
            return s === "DONE" || s === "FAILED";
          });
          const summary = summaries[group];

          return (
            <section key={group} className="task-section">
              <div className="section-header-row">
                <h2 className="section-header">{group}</h2>

                {/* Once a summary exists the button stops offering "Analyze" -
                    re-running it on an unchanged run costs an API call to
                    regenerate near-identical text. It becomes a disclosure
                    toggle, and regenerating moves into the panel itself. */}
                {summary?.status === "done" ? (
                  <button className="analyze-btn" onClick={() => toggleSummary(group)}>
                    {summary.collapsed ? "Show summary" : "Hide summary"}
                  </button>
                ) : (
                  allDone && runId && analyzeAvailable && (
                    <button
                      className="analyze-btn"
                      onClick={() => handleAnalyze(group)}
                      disabled={summary?.status === "loading"}
                    >
                      {summary?.status === "loading" ? "Analyzing…" : "Analyze"}
                    </button>
                  )
                )}
              </div>

              <div className="task-grid">
                {groupTasks.map((task) => (
                  <TaskCard key={task.name} task={task} />
                ))}
              </div>

              {summary && !summary.collapsed && (
                <div className={`ai-summary ai-summary--${summary.status}`}>
                  {summary.status === "loading" && <span className="ai-loading">Asking Claude…</span>}
                  {summary.status === "error"   && <p className="ai-error">{summary.text}</p>}
                  {summary.status === "done"    && (
                    <div className="ai-summary-body">
                      <p>{summary.text}</p>
                      <button
                        className="ai-regenerate"
                        onClick={() => handleAnalyze(group)}
                        title="Generate a new summary (sends another API request)"
                      >
                        ↻
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}

/**
 * Benchmark, compare resource metrics across recorded pipeline runs.
 *
 * Data comes from the nf-runinsights plugin: every run launched with it
 * appends a per-process summary to a local history file, and the server
 * exposes that file via /insights/runs and /insights/compare.
 *
 * The user picks runs (click order matters: the FIRST pick is the baseline
 * every delta is measured against), or uses the quick-select buttons.
 * "Last 2" etc. select oldest-first so the newest run is compared *against*
 * the older one, "how does my latest run compare to before?"
 */

import { useState, useEffect, useMemo } from "react";

const SERVER = "http://localhost:8000";

function fmtMs(ms) {
  if (ms == null) return "–";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

function fmtBytes(b) {
  if (b == null) return "–";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = b;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

// "2026-08-17T15:10:09.331+02:00" → "17 Aug 15:10"
function fmtTs(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d)) return ts.slice(0, 16).replace("T", " ");
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Colour a delta only when it is both relatively AND absolutely large.
// Sub-second processes routinely swing ±50% from scheduler jitter alone -
// a 0.2s → 0.4s change is "+100%" and means nothing. Mirrors the plugin's
// own MIN_DELTA_MS=2000 rule so portal and report never disagree.
function deltaClass(pct, diffMs) {
  if (pct == null || Math.abs(pct) < 10) return "";
  if (diffMs == null || Math.abs(diffMs) < 2000) return "";
  return pct > 0 ? "bench-delta--worse" : "bench-delta--better";
}

export default function Benchmark() {
  const [runs, setRuns] = useState(null); // null = loading, [] = none recorded
  const [loadError, setLoadError] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [selected, setSelected] = useState([]); // run names, in click order
  const [result, setResult] = useState(null);
  const [compareError, setCompareError] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Ask-the-history: free-form questions answered server-side by Claude
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [askError, setAskError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SERVER}/insights/runs`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const body = await res.json();
        setRuns(body.runs || []);
        // Default to the pipeline of the most recent run
        if (body.runs?.length) setPipeline(body.runs[0].pipeline);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  const pipelines = useMemo(
    () => [...new Set((runs || []).map((r) => r.pipeline))],
    [runs]
  );
  const visible = useMemo(
    () => (runs || []).filter((r) => r.pipeline === pipeline),
    [runs, pipeline]
  );

  const toggle = (name) => {
    setResult(null);
    setCompareError(null);
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // visible is newest-first; reverse so the oldest of the chosen runs
  // becomes the baseline and the newest is the one being judged.
  const selectLastN = (n) => {
    setResult(null);
    setCompareError(null);
    setSelected(visible.slice(0, n).reverse().map((r) => r.run_name));
  };

  const changePipeline = (p) => {
    setPipeline(p);
    setSelected([]);
    setResult(null);
    setCompareError(null);
    setAnswer(null);
    setAskError(null);
  };

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    try {
      const res = await fetch(`${SERVER}/insights/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          pipeline,
          runs: selected, // empty = whole pipeline history
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Server returned ${res.status}`);
      setAnswer(body.answer);
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAsking(false);
    }
  };

  const compare = async () => {
    setComparing(true);
    setCompareError(null);
    try {
      const res = await fetch(
        `${SERVER}/insights/compare?runs=${encodeURIComponent(selected.join(","))}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Server returned ${res.status}`);
      setResult(body);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setComparing(false);
    }
  };

  if (loadError)
    return <p className="error-msg">Could not load run history: {loadError}</p>;
  if (runs === null) return <p className="bench-loading">Loading run history…</p>;
  if (runs.length === 0)
    return (
      <div className="bench">
        <p className="catalog-blurb">
          No runs recorded yet. Runs launched with the nf-runinsights plugin
          appear here once they finish, run the pipeline from the Dashboard,
          then come back.
        </p>
      </div>
    );

  return (
    <div className="bench">
      <p className="catalog-blurb">
        Pick two or more runs to benchmark against each other. Your first pick
        is the baseline (#1); every delta is measured against it. Quick-selects
        use the oldest chosen run as the baseline, so "Last 2" answers:{" "}
        <em>how does my latest run compare to the one before?</em>
      </p>

      {pipelines.length > 1 && (
        <div className="bench-controls">
          <label className="bench-label">Pipeline</label>
          <select
            className="bench-select"
            value={pipeline ?? ""}
            onChange={(e) => changePipeline(e.target.value)}
          >
            {pipelines.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bench-controls">
        <button className="bench-quick" onClick={() => selectLastN(2)} disabled={visible.length < 2}>
          Last 2
        </button>
        <button className="bench-quick" onClick={() => selectLastN(3)} disabled={visible.length < 3}>
          Last 3
        </button>
        <button className="bench-quick" onClick={() => selectLastN(visible.length)} disabled={visible.length < 2}>
          All {visible.length}
        </button>
        <button className="bench-quick" onClick={() => { setSelected([]); setResult(null); }} disabled={selected.length === 0}>
          Clear
        </button>
        <button
          className="run-btn bench-compare"
          onClick={compare}
          disabled={selected.length < 2 || comparing}
        >
          {comparing ? "Comparing…" : `Compare ${selected.length || ""}`}
        </button>
      </div>

      <div className="bench-runlist">
        {visible.map((r) => {
          const idx = selected.indexOf(r.run_name);
          return (
            <button
              key={r.run_name}
              className={`bench-run ${idx >= 0 ? "bench-run--selected" : ""}`}
              onClick={() => toggle(r.run_name)}
            >
              {idx >= 0 && <span className="bench-run-order">#{idx + 1}</span>}
              <span className="bench-run-name">{r.run_name}</span>
              <span className="bench-run-meta">
                {fmtTs(r.ts)} · {r.processes} processes
              </span>
            </button>
          );
        })}
      </div>

      {compareError && <p className="error-msg">{compareError}</p>}

      {result && (
        <section className="task-section">
          <div className="section-header-row">
            <h2 className="section-header">
              {result.runs[0].pipeline}, {result.runs.length} runs
            </h2>
          </div>
          <div className="bench-table-wrap">
            <table className="bench-table">
              <thead>
                <tr>
                  <th>Process</th>
                  {result.runs.map((r, i) => (
                    <th key={r.run_name}>
                      <span className="bench-run-name">{r.run_name}</span>
                      <span className="bench-run-meta">
                        {i === 0 ? "baseline" : fmtTs(r.ts)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.processes.map((p) => (
                  <tr key={p.name}>
                    <td className="bench-proc" title={p.name}>
                      {p.name.split(":").pop()}
                    </td>
                    {p.values.map((v, i) => (
                      <td key={i}>
                        {v == null ? (
                          <span className="bench-missing">–</span>
                        ) : (
                          <>
                            <span className="bench-time">{fmtMs(v.median_ms)}</span>
                            {i > 0 && p.delta_pct[i] != null && (
                              <span
                                className={`bench-delta ${deltaClass(
                                  p.delta_pct[i],
                                  v.median_ms != null && p.values[0]?.median_ms != null
                                    ? v.median_ms - p.values[0].median_ms
                                    : null
                                )}`}
                              >
                                {p.delta_pct[i] > 0 ? "+" : ""}
                                {p.delta_pct[i]}%
                              </span>
                            )}
                            <span className="bench-rss">{fmtBytes(v.peak_rss)}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="bench-footnote">
            Cell shows the process's median task time and peak memory for that
            run. Deltas are vs the baseline (#1); red is slower, green faster.
            A delta is coloured only when it is both ±10% or more <em>and</em> at
            least 2 seconds of absolute change, sub-second swings are scheduler
            jitter, not signal.
          </p>
        </section>
      )}

      <section className="task-section">
        <div className="section-header-row">
          <h2 className="section-header">Ask</h2>
        </div>
        <p className="bench-footnote">
          Answered by Claude from the recorded metrics of{" "}
          {selected.length >= 1
            ? `the ${selected.length} selected run(s)`
            : `all ${pipeline ?? ""} runs`}{" "}
         , it only reads the numbers above, it can't launch or change anything.
        </p>
        <div className="bench-ask-row">
          <input
            className="bench-ask-input"
            type="text"
            placeholder="e.g. why was the latest run slower? which process should I optimize first?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !asking && ask()}
          />
          <button
            className="run-btn"
            onClick={ask}
            disabled={!question.trim() || asking}
          >
            {asking ? "Asking…" : "Ask"}
          </button>
        </div>
        {askError && <p className="error-msg">{askError}</p>}
        {answer && (
          <div className="ai-summary ai-summary--done">
            <div className="ai-summary-body">
              <p className="bench-answer">{answer}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

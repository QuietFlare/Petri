/**
 * TaskCard — one card per pipeline task.
 *
 * Shows: short task name, status badge, elapsed time.
 * For RUNNING tasks the elapsed timer ticks every second using the server's
 * start_ts (epoch ms) so it stays accurate even if the component re-renders.
 */

import { useState, useEffect } from "react";
import { getDisplayStatus } from "./pipeline";

export default function TaskCard({ task }) {
  const status = getDisplayStatus(task);
  const isRunning = status === "RUNNING" && !!task.start_ts;

  // Current wall-clock time, refreshed once a second while the task runs.
  // Reading the clock here rather than storing a precomputed elapsed value
  // keeps the timer correct for cards that sit QUEUED before they start.
  // 0 means "not sampled yet".
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const sample = () => setNow(Date.now());
    // The leading sample is deferred rather than called inline: updating state
    // synchronously inside an effect body triggers a cascading render.
    const leading = setTimeout(sample, 0);
    const id = setInterval(sample, 1000);
    return () => {
      clearTimeout(leading);
      clearInterval(id);
    };
  }, [isRunning]);

  const elapsed = isRunning && now ? now - task.start_ts : null;

  // realtime_ms = actual execution time; duration_ms = wall clock including queue wait
  // (MultiQC shows 11m on duration because it waits for all other tasks first)
  const finishedMs = task.realtime_ms ?? task.duration_ms;

  // e.g. "GATK4_MARKDUPLICATES (test)" → "GATK4 MARKDUPLICATES (test)"
  const displayName = (task.short_name || task.name).replace(/_/g, " ");

  return (
    // title= shows the full Nextflow module path on hover, e.g.
    // NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:GATK4_MARKDUPLICATES (test)
    <div className={`task-card task-card--${status.toLowerCase()}`} title={task.name}>
      <span className={`badge badge--${status.toLowerCase()}`}>{status}</span>
      <p className="task-name">{displayName}</p>
      <p className="task-time">
        {status === "RUNNING" && elapsed !== null
          ? formatMs(elapsed)
          : status === "DONE" || status === "FAILED"
          ? finishedMs != null
            ? formatMs(finishedMs)
            : ""
          : ""}
      </p>
    </div>
  );
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);

  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

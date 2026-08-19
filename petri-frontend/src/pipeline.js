/**
 * Pipeline domain logic, shared by App and TaskCard.
 *
 * Kept out of App.jsx so the two components don't import from each other,
 * and so this logic can be unit tested without rendering anything.
 */

// ── Grouping ────────────────────────────────────────────────────────────────

// Display order of the pipeline stage sections.
export const GROUPS = [
  "Genome Prep",
  "Quality Check",
  "Trim & Align",
  "Deduplication",
  "Variant Calling",
  "Report",
  "Other",
];

/**
 * Map a task to its pipeline group based on the full module path and short name.
 * The full `task.name` includes the subworkflow path (e.g. PREPARE_GENOME)
 * which is the most reliable signal for grouping.
 *
 * These rules are specific to nf-core/sarek. Supporting a second pipeline means
 * moving them into a per-pipeline registry rather than extending this function.
 */
export function getGroup(task) {
  const full  = (task.name        || "").toUpperCase();
  const short = (task.short_name  || "").toUpperCase();

  if (full.includes("PREPARE_GENOME"))                                   return "Genome Prep";
  if (short.includes("FASTQC"))                                          return "Quality Check";
  if (short.includes("MULTIQC"))                                         return "Report";
  if (
    short.includes("TRIMGALORE") || short.includes("TRIM_GALORE") ||
    short.includes("BWA_MEM")    || short.includes("BOWTIE2")     ||
    short.includes("SAMTOOLS_SORT") || short.includes("SAMTOOLS_INDEX")
  )                                                                      return "Trim & Align";
  if (
    short.includes("MARKDUP") || short.includes("MARKDUPLICATES") ||
    short.includes("BASERECALIBRATOR") || short.includes("APPLYBQSR") ||
    short.includes("BQSR")
  )                                                                      return "Deduplication";
  if (
    short.includes("STRELKA")        || short.includes("HAPLOTYPECALLER") ||
    short.includes("MUTECT")         || short.includes("MANTA")           ||
    short.includes("DEEPVARIANT")    || short.includes("FREEBAYES")
  )                                                                      return "Variant Calling";

  return "Other";
}

// ── Status helper ────────────────────────────────────────────────────────────

/**
 * Derive a simple 4-state status from the raw weblog task object.
 * We check `event` first because `status` isn't always populated on early events.
 */
export function getDisplayStatus(task) {
  const { event, status, exit_code } = task;

  if (event === "process_completed" || status === "COMPLETED") {
    return exit_code === 0 || exit_code === null ? "DONE" : "FAILED";
  }
  if (event === "error" || status === "FAILED") return "FAILED";
  if (event === "process_started" || status === "RUNNING") return "RUNNING";
  return "QUEUED";
}

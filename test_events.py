"""
Sends fake Nextflow weblog events to the server so you can verify
the UI is working without running a real pipeline.

Usage:
  1. Start the server:  uvicorn server:app --reload --port 8000
  2. Open the browser:  http://localhost:5173  → click "Run Pipeline"
  3. Copy the run_id from the server log, paste below, run this script.

Or just run this script — it will call POST /run itself and stream fake events.
"""

import json
import time
import urllib.request

SERVER = "http://127.0.0.1:8000"

# ── Step 1: start a run so we have a valid run_id ──────────────────────────
req = urllib.request.Request(f"{SERVER}/run", method="POST")
with urllib.request.urlopen(req) as r:
    run_id = json.loads(r.read())["run_id"]

print(f"Run started: {run_id}")
print(f"Open http://localhost:5173 and watch the cards appear...\n")

# ── Step 2: fake Nextflow runId (the server maps this to our run_id) ────────
nxf_run_id = "fake-nxf-run-id-0001"

# ── Step 3: tasks to simulate ────────────────────────────────────────────────
TASKS = [
    "NFCORE_SAREK:SAREK:PREPARE_GENOME:BWA_INDEX (genome.fasta)",
    "NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:FASTQC (test)",
    "NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:TRIMGALORE (test)",
    "NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BWA_MEM (test)",
    "NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:SAMTOOLS_SORT (test)",
    "NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:SAMTOOLS_INDEX (test)",
    "NFCORE_SAREK:SAREK:MULTIQC",
]

def post_event(event: str, task_name: str, status: str, task_id: int, extra: dict = {}):
    now_ms = int(time.time() * 1000)
    payload = {
        "runId": nxf_run_id,
        "runName": "test_simulation",
        "event": event,
        "utcTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "trace": {
            "task_id": task_id,
            "name": task_name,
            "status": status,
            "exit": 0 if status == "COMPLETED" else None,
            "submit": now_ms - 2000,
            "start": now_ms - 1000,
            "complete": now_ms if status == "COMPLETED" else None,
            "duration": 1500 if status == "COMPLETED" else None,
            "realtime": 1200 if status == "COMPLETED" else None,
            "hash": f"{task_id:02x}/abcdef",
            "container": "quay.io/biocontainers/samtools:1.21",
            **extra,
        },
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{SERVER}/events",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req)


# Submit all tasks as QUEUED
print("Submitting tasks...")
for i, task in enumerate(TASKS, 1):
    post_event("process_submitted", task, "SUBMITTED", i)
    print(f"  submitted: {task.rsplit(':', 1)[-1].strip()}")
    time.sleep(0.3)

time.sleep(1)

# Start them one by one with a delay
print("\nStarting tasks...")
for i, task in enumerate(TASKS, 1):
    post_event("process_started", task, "RUNNING", i)
    print(f"  running:   {task.rsplit(':', 1)[-1].strip()}")
    time.sleep(1.5)

time.sleep(1)

# Complete them
print("\nCompleting tasks...")
for i, task in enumerate(TASKS, 1):
    post_event("process_completed", task, "COMPLETED", i)
    print(f"  done:      {task.rsplit(':', 1)[-1].strip()}")
    time.sleep(0.5)

print(f"\nDone. Check the browser at http://localhost:5173")
print(f"Or poll: curl http://127.0.0.1:8000/runs/{run_id}")

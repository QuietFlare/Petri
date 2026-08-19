"""
Standalone Nextflow weblog listener.

Nextflow's -with-weblog flag POSTs a JSON message here every time a task
changes state. This script just prints those events so we can confirm the
event stream works before building anything else.

Run this first, then in a second terminal run the Nextflow pipeline.
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read the raw JSON body
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            msg = json.loads(body)

            event = msg.get("event", "?")
            trace = msg.get("trace", {})
            name = trace.get("name", "")
            status = trace.get("status", "")
            task_id = trace.get("task_id", "")

            # Print one readable line per event
            print(f"[{event:25}]  task={task_id:<4} status={status:<12} {name}")

            # Also dump the full payload so nothing is hidden
            print("  raw:", json.dumps(msg, separators=(",", ":")))
            print()

        except Exception as e:
            print("could not parse payload:", e)
            print("  raw bytes:", body[:200])

        # Nextflow only retries if it gets anything other than 200
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        # Silence the default Apache-style access log lines
        pass


HOST = "127.0.0.1"
PORT = 8000

print(f"Listening for Nextflow weblog events on http://{HOST}:{PORT}/events")
print("Start the pipeline in another terminal with:")
print()
print(
    f'  NXF_SYNTAX_PARSER=v1 $HOME/nextflow run nf-core/sarek -r 3.8.1 \\\n'
    f'    -profile test,docker --outdir results_weblog \\\n'
    f'    -with-weblog http://{HOST}:{PORT}/events'
)
print()

HTTPServer((HOST, PORT), Handler).serve_forever()

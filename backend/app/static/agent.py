import argparse
import time
import sys
import urllib.request
import urllib.error
import json
import os
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-id", required=True)
    parser.add_argument("--backend-url", default="http://localhost:8000")
    args = parser.parse_args()

    print(f"[INFO] RCA Agent initialized for App ID: {args.app_id}")
    print(f"[INFO] Connecting to backend at {args.backend_url}...")
    
    # Simulate connection check
    try:
        with urllib.request.urlopen(f"{args.backend_url}/health") as response:
            if response.status == 200:
                print("[SUCCESS] Successfully connected to RCA Backend.")
            else:
                print(f"[ERROR] Backend returned status: {response.status}")
                sys.exit(1)
    except urllib.error.URLError as e:
        print(f"[ERROR] Failed to connect to backend: {e}")
        print("Make sure the backend is reachable at the provided backend URL")
        sys.exit(1)

    # Fetch configured log sources
    try:
        with urllib.request.urlopen(f"{args.backend_url}/applications/{args.app_id}/logs") as resp:
            sources = json.loads(resp.read().decode("utf-8"))
            if not sources:
                print("[WARN] No log sources configured for this application.")
            else:
                print(f"[INFO] Found {len(sources)} log source(s). Starting tail...")
    except Exception as e:
        print(f"[ERROR] Could not fetch log sources: {e}")
        sources = []

    state_dir = Path.home() / ".rca-agent"
    state_dir.mkdir(parents=True, exist_ok=True)
    state_file = state_dir / "offsets.json"

    def load_offsets():
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def save_offsets(offsets):
        try:
            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(offsets, f)
        except Exception:
            pass

    offsets = load_offsets()
    for src in sources:
        p = src.get("path")
        if p and p not in offsets:
            offsets[p] = {"offset": 0, "initial_read_done": False}

    print("[INFO] Agent is now active and monitoring log files.")
    print("[INFO] Press Ctrl+C to stop.")

    def read_new_lines(path):
        try:
            if path not in offsets:
                offsets[path] = {"offset": 0, "initial_read_done": False}
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                f.seek(offsets[path]["offset"])
                data = f.read()
                offsets[path]["offset"] = f.tell()
                return data
        except FileNotFoundError:
            return ""
        except Exception:
            return ""

    try:
        while True:
            try:
                req = urllib.request.Request(
                    url=f"{args.backend_url}/agents/{args.app_id}/heartbeat",
                    method="POST"
                )
                urllib.request.urlopen(req)
            except Exception:
                pass
            for src in sources:
                path = src.get("path")
                if not path:
                    continue
                content = read_new_lines(path)
                if content:
                    payload = json.dumps({"path": path, "content": content}).encode("utf-8")
                    req = urllib.request.Request(
                        url=f"{args.backend_url}/agents/{args.app_id}/ingest",
                        data=payload,
                        headers={"Content-Type": "application/json"},
                        method="POST"
                    )
                    try:
                        with urllib.request.urlopen(req) as resp:
                            pass
                    except Exception as e:
                        print(f"[WARN] Ingestion failed for {path}: {e}")
            save_offsets(offsets)
            time.sleep(3)
    except KeyboardInterrupt:
        print("\n[INFO] Agent stopping...")

if __name__ == "__main__":
    main()

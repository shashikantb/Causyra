#!/bin/bash

APP_ID=""
BACKEND_URL="http://localhost:8000"

# Parse args
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --app-id=*) APP_ID="${1#*=}" ;;
        --backend-url=*) BACKEND_URL="${1#*=}" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$APP_ID" ]; then
    echo "Error: --app-id is required"
    exit 1
fi

echo "----------------------------------------"
echo "      RCA AI Agent Installation"
echo "----------------------------------------"

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed."
    exit 1
fi

echo "[1/3] Downloading Agent Script..."
# Use curl to download the agent script
curl -s "$BACKEND_URL/static/agent.py" -o rca_agent.py

if [ ! -f "rca_agent.py" ]; then
    echo "Error: Failed to download agent script."
    exit 1
fi

echo "[2/3] Verifying Backend Connection..."
curl -s "$BACKEND_URL/health" > /dev/null
if [ $? -ne 0 ]; then
    echo "Warning: Could not connect to backend at $BACKEND_URL"
else
    echo "Backend connection OK."
fi

echo "[3/3] Starting Agent..."
echo ""
echo "Agent started in background."
echo "Logs will be streamed to the dashboard."
echo ""

# Run the python script in background (or foreground for demo purposes if user wants to see output)
# We run it in foreground for this demo so the user sees the output immediately
python3 rca_agent.py --app-id "$APP_ID" --backend-url "$BACKEND_URL"

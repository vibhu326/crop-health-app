#!/usr/bin/env bash
# One command: installs everything, builds the React app and starts the server on http://localhost:8000
set -e; cd "$(dirname "$0")"
[ -d backend/.venv ] || python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -q -r backend/requirements.txt
(cd frontend && npm install --no-audit --no-fund && npm run build)
[ -f backend/models/crop_model.pt ] || echo ">>> No trained model yet: detection will show a notice. See README step 2."
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000

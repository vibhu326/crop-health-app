@echo off
cd /d "%~dp0"
if not exist backend\.venv python -m venv backend\.venv
call backend\.venv\Scripts\activate
pip install -q -r backend\requirements.txt
cd frontend
call npm install --no-audit --no-fund
call npm run build
cd ..
if not exist backend\models\crop_model.pt echo ^>^>^> No trained model yet: detection will show a notice. See README step 2.
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

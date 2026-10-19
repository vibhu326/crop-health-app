   ---
   title: Crop Health Advisor
   sdk: docker
   app_port: 7860
   ---
# Crop Health Advisor: Early Detection and Management of Crop Diseases and Pest Infestations (SIH26131)

**Stack:** React + TypeScript + Tailwind CSS (frontend) · Python + FastAPI + PyTorch + OpenCV (backend) · SQLite · Leaflet / OpenStreetMap.
One server serves both the API and the web app on **http://localhost:8000**.

## Run it (needs Python 3.10+, Node 18+, internet for the first install)
1. **Start:** `./run.sh` (Linux/Mac) or double-click `run.bat` (Windows). It creates a virtual environment, installs everything, builds the React app and starts the server.
2. **Train the detection model once** (the app cannot invent predictions, so detection needs a trained model):
   - Put a leaf dataset in `data/` (see `data/README.txt`; the public PlantVillage dataset works as is).
   - In a second terminal with the venv active: `python training/train.py --data data/PlantVillage --epochs 5`
   - Restart the server. The yellow "model not trained" banner disappears.
3. Open http://localhost:8000. On a phone on the same Wi-Fi use `http://<your-pc-ip>:8000` (the browser's GPS button only works on https or localhost, so type latitude/longitude manually on the phone).
4. Expert page token: `admin123` (set your own with the `ADMIN_TOKEN` environment variable before starting).

Development mode: run the backend with `uvicorn main:app --reload` in `backend/`, then `npm run dev` in `frontend/` (port 5173).

## Features
| Requirement | How it works here |
|---|---|
| Disease detection from leaf images | MobileNetV3 inference in PyTorch; top-3 results |
| Confidence and severity | Softmax confidence (below 60% flags "needs expert"); severity from an OpenCV colour-threshold **heuristic** |
| Pest-trap and sensors | Add readings in the UI or `POST /api/sensors`; alerts for pest-trap count ≥ 20 and humidity ≥ 85 (edit `LIMITS` in `main.py`) |
| Weather risk | Live Open-Meteo data (internet needed) or manual temperature/humidity, scored by a **rule-based heuristic** (not a validated forecast) |
| GPS hotspot map | Leaflet + OpenStreetMap: report dots plus hotspot circles from an ~11 km grid over the last 30 days |
| Hindi and English | One-click toggle, including the advice text |
| Safe treatment and IPM | General IPM steps per disease type, **no pesticide doses**; always defers to extension officers and product labels |
| Expert validation, referral, follow-up, dashboard | Farmer can request referral to an extension officer or lab; experts (token) confirm labels and add follow-ups; re-scanning with "follow-up of report no." logs monitoring; public dashboard with stats and alerts |

## Honest limits
- **Simulated:** only the "demo readings" button creates data, and every such row is labelled SIMULATED in the UI.
- **Not integrated:** real pest-trap hardware, SMS/email notifications, real user accounts (the expert page uses one shared token).
- Accuracy depends entirely on your training data. PlantVillage photos are lab-style, so results on messy field photos will be worse; collect and validate local images to improve it.
- The Hindi advice should be reviewed by an agronomist before real-world use.
- Pesticide recommendations are intentionally not included.

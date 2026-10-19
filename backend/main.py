import io, os, json, sqlite3, time, uuid, random, urllib.request
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import ml
from advice import advice

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.getenv("DB_PATH", os.path.join(BASE, "crop.db")); UP = os.path.join(BASE, "uploads")
DIST = os.path.join(BASE, "..", "frontend", "dist"); TOKEN = os.getenv("ADMIN_TOKEN", "admin123")
os.makedirs(UP, exist_ok=True)
KINDS = {"pest_trap_count", "soil_moisture_pct", "humidity_pct", "temperature_c"}
LIMITS = {"pest_trap_count": 20, "humidity_pct": 85}   # alert thresholds (editable)

app = FastAPI(title="Crop Health Advisor API (SIH26131)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=UP), name="uploads")

def db():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c
with db() as c:
    c.executescript("""
    CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, ts REAL, crop TEXT, lat REAL, lon REAL, label TEXT, confidence REAL,
      severity REAL, risk TEXT, status TEXT, expert_label TEXT, referral TEXT, image TEXT);
    CREATE TABLE IF NOT EXISTS sensors(id INTEGER PRIMARY KEY, ts REAL, device TEXT, kind TEXT, value REAL, lat REAL, lon REAL, simulated INTEGER);
    CREATE TABLE IF NOT EXISTS followups(id INTEGER PRIMARY KEY, report_id INTEGER, ts REAL, note TEXT, severity REAL);""")
ml.load()

def admin(t):
    if t != TOKEN: raise HTTPException(401, "Invalid expert/admin token")

def risk(lat, lon, temp=None, hum=None, rain=None):
    src = "manual"
    if temp is None or hum is None:
        try:
            u = (f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                 "&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&forecast_days=1&timezone=auto")
            j = json.load(urllib.request.urlopen(u, timeout=6))
            temp, hum, rain, src = j["current"]["temperature_2m"], j["current"]["relative_humidity_2m"], j["daily"]["precipitation_sum"][0], "open-meteo"
        except Exception:
            return {"available": False, "reason": "Weather service unreachable. Enter temperature and humidity manually."}
    s = (2 if hum >= 85 else 1 if hum >= 70 else 0) + (2 if 15 <= temp <= 28 else 0) + (1 if (rain or 0) >= 2 else 0)
    return {"available": True, "level": ["low", "low", "moderate", "moderate", "high", "high"][s], "temp": temp, "humidity": hum,
            "rain_mm": rain, "source": src, "method": "Rule-based fungal-favourability heuristic, not a validated forecast model"}

def row(r):
    d = dict(r); d["url"] = f"/uploads/{d['image']}" if d.get("image") else None; return d

@app.get("/api/health")
def health(): return {"model_loaded": ml.loaded(), "classes": len(ml.classes)}

@app.get("/api/classes")
def classes(): return ml.classes

@app.post("/api/detect")
async def detect(file: UploadFile = File(...), lat: Optional[float] = Form(None), lon: Optional[float] = Form(None),
                 crop: str = Form(""), follow_of: Optional[int] = Form(None)):
    if not ml.loaded(): raise HTTPException(503, "No trained model found (backend/models/crop_model.pt). Train it first: see README.")
    try: img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception: raise HTTPException(400, "That file is not a valid image.")
    preds, sev = ml.predict(img), ml.severity(img); top = preds[0]; needs = top["confidence"] < 0.6
    rk = risk(lat, lon) if lat is not None and lon is not None else None
    name = uuid.uuid4().hex + ".jpg"; img.save(os.path.join(UP, name))
    with db() as c:
        rid = c.execute("INSERT INTO reports(ts,crop,lat,lon,label,confidence,severity,risk,status,image) VALUES(?,?,?,?,?,?,?,?,?,?)",
            (time.time(), crop, lat, lon, top["label"], top["confidence"], sev["percent"] if sev else None,
             rk["level"] if rk and rk.get("available") else None, "needs_expert" if needs else "auto", name)).lastrowid
        if follow_of and c.execute("SELECT 1 FROM reports WHERE id=?", (follow_of,)).fetchone():
            c.execute("INSERT INTO followups(report_id,ts,note,severity) VALUES(?,?,?,?)", (follow_of, time.time(),
                f"Re-scan (report #{rid}): {top['label']} {top['confidence']*100:.0f}%", sev["percent"] if sev else None))
    return {"id": rid, "url": f"/uploads/{name}", "predictions": preds, "severity": sev, "needs_expert": needs,
            "advice": advice(top["label"]), "risk": rk}

@app.get("/api/reports")
def reports(status: Optional[str] = None):
    q, a = "SELECT * FROM reports", ()
    if status: q, a = q + " WHERE status=?", (status,)
    return [row(r) for r in db().execute(q + " ORDER BY ts DESC LIMIT 500", a)]

@app.post("/api/reports/{rid}/refer")   # farmer asks for expert/lab referral
def refer(rid: int, target: str = Form(...)):
    if target not in ("extension_officer", "laboratory"): raise HTTPException(400, "Unknown referral target")
    with db() as c: c.execute("UPDATE reports SET referral=?, status=CASE WHEN status='validated' THEN status ELSE 'referred' END WHERE id=?", (target, rid))
    return {"ok": True}

@app.get("/api/admin/check")
def check(x_admin_token: str = Header("")): admin(x_admin_token); return {"ok": True}

@app.post("/api/reports/{rid}/validate")
def validate(rid: int, expert_label: str = Form(...), x_admin_token: str = Header("")):
    admin(x_admin_token)
    with db() as c: c.execute("UPDATE reports SET expert_label=?, status='validated' WHERE id=?", (expert_label, rid))
    return {"ok": True}

@app.post("/api/reports/{rid}/followup")
def add_followup(rid: int, note: str = Form(...), severity: Optional[float] = Form(None), x_admin_token: str = Header("")):
    admin(x_admin_token)
    with db() as c: c.execute("INSERT INTO followups(report_id,ts,note,severity) VALUES(?,?,?,?)", (rid, time.time(), note, severity))
    return {"ok": True}

@app.get("/api/reports/{rid}/followups")
def followups(rid: int): return [dict(r) for r in db().execute("SELECT * FROM followups WHERE report_id=? ORDER BY ts", (rid,))]

@app.post("/api/sensors")
def add_sensor(device: str = Form(...), kind: str = Form(...), value: float = Form(...), lat: Optional[float] = Form(None), lon: Optional[float] = Form(None)):
    if kind not in KINDS: raise HTTPException(400, "Unknown sensor kind")
    with db() as c: c.execute("INSERT INTO sensors VALUES(NULL,?,?,?,?,?,?,0)", (time.time(), device.strip()[:40], kind, value, lat, lon))
    return {"ok": True}

@app.post("/api/sensors/simulate")   # DEMO ONLY: flagged simulated=1 and labelled in the UI
def simulate():
    with db() as c:
        for d, k, lo, hi in [("demo-trap-1", "pest_trap_count", 0, 40), ("demo-soil-1", "soil_moisture_pct", 15, 60), ("demo-air-1", "humidity_pct", 40, 95), ("demo-air-1", "temperature_c", 15, 38)]:
            c.execute("INSERT INTO sensors VALUES(NULL,?,?,?,?,28.61,77.21,1)", (time.time(), d, k, round(random.uniform(lo, hi), 1)))
    return {"ok": True}

@app.get("/api/sensors")
def sensors(): return [dict(r) for r in db().execute("SELECT * FROM sensors ORDER BY ts DESC LIMIT 100")]

@app.get("/api/risk")
def risk_ep(lat: float, lon: float, temp: Optional[float] = None, hum: Optional[float] = None): return risk(lat, lon, temp, hum)

def hotspot_cells():
    cells = {}
    for r in db().execute("SELECT lat,lon,label FROM reports WHERE lat IS NOT NULL AND lower(label) NOT LIKE '%healthy%' AND ts>?", (time.time() - 30 * 86400,)):
        c = cells.setdefault((round(r["lat"], 1), round(r["lon"], 1)), {"count": 0, "labels": {}})
        c["count"] += 1; c["labels"][r["label"]] = c["labels"].get(r["label"], 0) + 1
    return [{"lat": k[0], "lon": k[1], "count": v["count"], "top": max(v["labels"], key=v["labels"].get),
             "level": "high" if v["count"] >= 5 else "moderate" if v["count"] >= 2 else "low"} for k, v in cells.items()]

@app.get("/api/hotspots")
def hotspots(): return hotspot_cells()

@app.get("/api/alerts")
def alerts():
    out, c = [], db()
    for r in c.execute("""SELECT s.* FROM sensors s JOIN (SELECT device,kind,MAX(ts) m FROM sensors GROUP BY device,kind) l
                          ON s.device=l.device AND s.kind=l.kind AND s.ts=l.m"""):
        if r["kind"] in LIMITS and r["value"] >= LIMITS[r["kind"]]:
            out.append({"type": "pest_trap" if r["kind"] == "pest_trap_count" else "humidity", "detail": f"{r['device']}: {r['value']} (limit {LIMITS[r['kind']]})", "severity": "high", "simulated": bool(r["simulated"])})
    n = c.execute("SELECT COUNT(*) FROM reports WHERE status IN ('needs_expert','referred')").fetchone()[0]
    if n: out.append({"type": "queue", "detail": str(n), "severity": "moderate", "simulated": False})
    for h in hotspot_cells():
        if h["level"] != "low": out.append({"type": "hotspot", "detail": f"{h['top']} ({h['count']})", "severity": h["level"], "simulated": False})
    return out

@app.get("/api/stats")
def stats():
    c = db(); one = lambda s: c.execute(s).fetchone()[0]
    return {"total": one("SELECT COUNT(*) FROM reports"), "awaiting": one("SELECT COUNT(*) FROM reports WHERE status IN ('needs_expert','referred')"),
            "validated": one("SELECT COUNT(*) FROM reports WHERE status='validated'"),
            "by_disease": [{"label": r["label"], "n": r["n"]} for r in c.execute("SELECT label, COUNT(*) n FROM reports GROUP BY label ORDER BY n DESC LIMIT 6")]}

if os.path.isdir(DIST):   # serve the built React app from the same server (must be mounted last)
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
else:
    @app.get("/")
    def home(): return {"message": "Frontend not built yet. Run run.sh / run.bat, or `cd frontend && npm install && npm run build`."}

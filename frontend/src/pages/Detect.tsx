import { useContext, useEffect, useState } from "react";
import { LangCtx } from "../i18n"; import { api, fd, pretty } from "../api"; import { Card, Badge, btn, btn2, inp, bar, Err } from "../ui";
const CROPS = ["Tomato", "Potato", "Maize", "Rice", "Wheat", "Cotton", "Apple", "Grape", "Pepper", "Soybean"];

function Weather({ lat, lon }: { lat: string; lon: string }) {
  const { t } = useContext(LangCtx); const [temp, setTemp] = useState(""); const [hum, setHum] = useState(""); const [r, setR] = useState<any>(null); const [err, setErr] = useState("");
  const go = async () => { setErr(""); if (!lat || !lon) return setErr(t("need_loc"));
    try { setR(await api(`/api/risk?lat=${lat}&lon=${lon}` + (temp && hum ? `&temp=${temp}&hum=${hum}` : ""))); } catch (e: any) { setErr(e.message); } };
  return <Card title={t("weather_check")}>
    <div className="grid grid-cols-2 gap-2"><input className={inp} type="number" placeholder={t("temp")} value={temp} onChange={e => setTemp(e.target.value)} />
      <input className={inp} type="number" placeholder={t("hum")} value={hum} onChange={e => setHum(e.target.value)} /></div>
    <button className={btn + " mt-3"} onClick={go}>{t("check")}</button><div className="mt-3 space-y-2"><Err msg={err} />
      {r && (r.available ? <p>{t("risk")}: <Badge kind={r.level}>{t(r.level)}</Badge> <span className="text-sm text-stone-500">{r.temp}°C · {r.humidity}% · {r.source}</span></p> : <Err msg={r.reason} />)}
      {r?.method && <p className="text-xs text-stone-500">{r.method}</p>}</div></Card>;
}

export default function Detect() {
  const { t, lang } = useContext(LangCtx);
  const [file, setFile] = useState<File | null>(null); const [prev, setPrev] = useState(""); const [crop, setCrop] = useState(""); const [lat, setLat] = useState(""); const [lon, setLon] = useState(""); const [fo, setFo] = useState("");
  const [res, setRes] = useState<any>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [ref, setRef] = useState("");
  useEffect(() => { if (!file) return setPrev(""); const u = URL.createObjectURL(file); setPrev(u); return () => URL.revokeObjectURL(u); }, [file]);
  const gps = () => navigator.geolocation.getCurrentPosition(p => { setLat(p.coords.latitude.toFixed(5)); setLon(p.coords.longitude.toFixed(5)); }, e => setErr(e.message));
  const run = async () => { setBusy(true); setErr(""); setRes(null); setRef("");
    try { setRes(await api("/api/detect", { method: "POST", body: fd({ file, crop, lat, lon, follow_of: fo }) })); } catch (e: any) { setErr(e.message); } setBusy(false); };
  const refer = async (target: string) => { try { await api(`/api/reports/${res.id}/refer`, { method: "POST", body: fd({ target }) }); setRef(target); } catch (e: any) { setErr(e.message); } };
  const top = res?.predictions?.[0];
  return <div className="grid gap-4 md:grid-cols-2">
    <div className="space-y-4">
      <Card title={t("upload")}>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-center hover:bg-emerald-100">
          {prev ? <img src={prev} alt="leaf" className="max-h-64 rounded-lg object-contain" /> : <span className="py-8 text-4xl">📷</span>}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <span className="mt-2 text-sm text-emerald-800">{file ? file.name : t("upload")}</span></label>
        <input className={inp + " mt-3"} list="crops" placeholder={t("crop")} value={crop} onChange={e => setCrop(e.target.value)} /><datalist id="crops">{CROPS.map(c => <option key={c} value={c} />)}</datalist>
        <input className={inp + " mt-3"} type="number" placeholder={t("follow_of")} value={fo} onChange={e => setFo(e.target.value)} />
      </Card>
      <Card title={t("location")}>
        <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder={t("lat")} value={lat} onChange={e => setLat(e.target.value)} /><input className={inp} placeholder={t("lon")} value={lon} onChange={e => setLon(e.target.value)} /></div>
        <div className="mt-3 flex flex-wrap gap-2"><button className={btn2} onClick={gps}>📍 {t("use_gps")}</button>
          <button className={btn + " flex-1"} disabled={!file || busy} onClick={run}>{busy ? t("analysing") : "🔍 " + t("analyse")}</button></div>
      </Card><Weather lat={lat} lon={lon} />
    </div>
    <div className="space-y-4"><Err msg={err} />
      {res && top && <Card title={`${t("result")} · ${t("report_no")} ${res.id}`}>
        <div className="space-y-4">
          <div><p className="text-2xl font-bold text-emerald-900">{pretty(top.label)}</p>
            <div className="mt-2 flex items-center justify-between text-sm"><span>{t("conf")}</span><b>{(top.confidence * 100).toFixed(1)}%</b></div>
            <div className="h-3 rounded-full bg-stone-200"><div className="h-3 rounded-full bg-emerald-600" style={{ width: top.confidence * 100 + "%" }} /></div></div>
          {res.needs_expert && <p className="rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">⚠️ {t("low_conf")}</p>}
          <div className="space-y-1 text-sm text-stone-600">{res.predictions.slice(1).map((p: any) => <div key={p.label} className="flex justify-between"><span>{pretty(p.label)}</span><span>{(p.confidence * 100).toFixed(1)}%</span></div>)}</div>
          {res.severity && <div><div className="flex items-center justify-between text-sm"><span>{t("sev")}</span><span><b>{res.severity.percent}%</b> <Badge kind={res.severity.band}>{t(res.severity.band)}</Badge></span></div>
            <div className="mt-1 h-3 rounded-full bg-stone-200"><div className={`h-3 rounded-full ${bar[res.severity.band]}`} style={{ width: Math.min(100, res.severity.percent) + "%" }} /></div>
            <p className="mt-1 text-xs text-stone-500">{t("sev_note")}</p></div>}
          {res.risk && <p className="text-sm">{t("risk")}: {res.risk.available ? <Badge kind={res.risk.level}>{t(res.risk.level)}</Badge> : <span className="text-stone-500">{res.risk.reason}</span>}</p>}
          <div><h3 className="mb-1 font-semibold">{t("advice")}</h3><ul className="list-disc space-y-1 pl-5 text-sm">{res.advice.steps[lang].map((s: string) => <li key={s}>{s}</li>)}</ul>
            <p className="mt-2 text-xs text-stone-500">{res.advice.note[lang]}</p></div>
          <div className="flex flex-wrap gap-2">{ref ? <Badge kind="referred">✓ {t("referred")}</Badge> : <>
            <button className={btn2} onClick={() => refer("extension_officer")}>{t("refer_ext")}</button><button className={btn2} onClick={() => refer("laboratory")}>{t("refer_lab")}</button></>}</div>
        </div></Card>}
    </div></div>;
}

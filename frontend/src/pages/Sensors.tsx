import { useContext, useEffect, useState } from "react";
import { LangCtx } from "../i18n"; import { api, fd, ago } from "../api"; import { Card, Badge, btn, btn2, inp, Err } from "../ui";
const KINDS = ["pest_trap_count", "soil_moisture_pct", "humidity_pct", "temperature_c"];
export default function Sensors() {
  const { t } = useContext(LangCtx); const [rows, setRows] = useState<any[]>([]); const [device, setDevice] = useState(""); const [kind, setKind] = useState(KINDS[0]); const [value, setValue] = useState("");
  const [lat, setLat] = useState(""); const [lon, setLon] = useState(""); const [err, setErr] = useState("");
  const load = () => api("/api/sensors").then(setRows).catch(e => setErr(e.message)); useEffect(() => { load(); }, []);
  const add = async () => { setErr(""); try { await api("/api/sensors", { method: "POST", body: fd({ device, kind, value, lat, lon }) }); setValue(""); load(); } catch (e: any) { setErr(e.message); } };
  return <div className="grid gap-4 md:grid-cols-2">
    <Card title={t("sensors_title")}><div className="space-y-3"><Err msg={err} />
      <input className={inp} placeholder={t("device")} value={device} onChange={e => setDevice(e.target.value)} />
      <select className={inp} value={kind} onChange={e => setKind(e.target.value)}>{KINDS.map(k => <option key={k} value={k}>{t("k_" + k)}</option>)}</select>
      <input className={inp} type="number" placeholder={t("value")} value={value} onChange={e => setValue(e.target.value)} />
      <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder={t("lat")} value={lat} onChange={e => setLat(e.target.value)} /><input className={inp} placeholder={t("lon")} value={lon} onChange={e => setLon(e.target.value)} /></div>
      <div className="flex flex-wrap gap-2"><button className={btn} disabled={!device || value === ""} onClick={add}>{t("add")}</button>
        <button className={btn2} onClick={() => api("/api/sensors/simulate", { method: "POST" }).then(load)}>{t("demo")}</button></div></div></Card>
    <Card title={t("nav_sensors")}><ul className="max-h-[60vh] divide-y overflow-auto">{rows.length ? rows.map(r => <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
      <span><b>{r.device}</b> · {t("k_" + r.kind)}<br /><span className="text-xs text-stone-500">{ago(r.ts)}</span></span>
      <span className="flex items-center gap-2"><b className="text-lg">{r.value}</b>{r.simulated ? <Badge kind="sim">{t("simulated")}</Badge> : null}</span></li>) : <li className="py-4 text-stone-500">{t("no_data")}</li>}</ul></Card></div>;
}

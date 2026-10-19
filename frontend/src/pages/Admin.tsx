import { useContext, useEffect, useState } from "react";
import { LangCtx } from "../i18n"; import { api, fd, pretty, ago } from "../api"; import { Card, Badge, btn, btn2, inp, Err } from "../ui";
function Item({ r, tok, reload, cls }: any) {
  const { t } = useContext(LangCtx); const [label, setLabel] = useState(r.expert_label || r.label); const [note, setNote] = useState(""); const [sev, setSev] = useState(""); const [fu, setFu] = useState<any[]>([]); const [err, setErr] = useState("");
  const h = { "X-Admin-Token": tok }; const loadFu = () => api(`/api/reports/${r.id}/followups`).then(setFu).catch(() => {}); useEffect(() => { loadFu(); }, []);
  const post = async (u: string, d: any) => { setErr(""); try { await api(u, { method: "POST", headers: h, body: fd(d) }); reload(); loadFu(); setNote(""); } catch (e: any) { setErr(e.message); } };
  return <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200"><div className="flex gap-3">
    {r.url && <img src={r.url} alt="" className="h-24 w-24 rounded-xl object-cover" />}
    <div className="min-w-0 flex-1"><p className="font-semibold">#{r.id} · {pretty(r.label)}</p><p className="text-xs text-stone-500">{ago(r.ts)} · {(r.confidence * 100).toFixed(0)}% · {r.crop || "–"}{r.lat != null ? ` · ${r.lat.toFixed(3)}, ${r.lon.toFixed(3)}` : ""}</p>
      <div className="mt-1 flex flex-wrap gap-1"><Badge kind={r.status}>{r.status.replace("_", " ")}</Badge>{r.referral && <Badge kind="referred">{r.referral.replace("_", " ")}</Badge>}{r.risk && <Badge kind={r.risk}>{t("risk")}: {t(r.risk)}</Badge>}</div></div></div>
    <Err msg={err} /><div className="flex gap-2"><input className={inp} list="cls" value={label} onChange={e => setLabel(e.target.value)} /><datalist id="cls">{cls.map((c: string) => <option key={c} value={c} />)}</datalist>
      <button className={btn} onClick={() => post(`/api/reports/${r.id}/validate`, { expert_label: label })}>{t("confirm")}</button></div>
    <div className="grid grid-cols-[1fr_5rem_auto] gap-2"><input className={inp} placeholder={t("note")} value={note} onChange={e => setNote(e.target.value)} />
      <input className={inp} type="number" placeholder={t("sev_pct")} value={sev} onChange={e => setSev(e.target.value)} /><button className={btn2} disabled={!note} onClick={() => post(`/api/reports/${r.id}/followup`, { note, severity: sev })}>{t("add_follow")}</button></div>
    {fu.length > 0 && <div><p className="text-sm font-semibold">{t("followups")}</p><ul className="mt-1 space-y-1 text-sm text-stone-600">{fu.map(f => <li key={f.id}>• {ago(f.ts)}: {f.note}{f.severity != null ? ` (${f.severity}%)` : ""}</li>)}</ul></div>}</div>;
}
export default function Admin() {
  const { t } = useContext(LangCtx); const [tok, setTok] = useState(sessionStorage.getItem("tok") || ""); const [ok, setOk] = useState(false); const [err, setErr] = useState("");
  const [rs, setRs] = useState<any[]>([]); const [f, setF] = useState("pending"); const [cls, setCls] = useState<string[]>([]);
  const load = () => api("/api/reports").then(setRs).catch(e => setErr(e.message));
  const login = async () => { setErr(""); try { await api("/api/admin/check", { headers: { "X-Admin-Token": tok } }); sessionStorage.setItem("tok", tok); setOk(true); load(); api("/api/classes").then(setCls); } catch (e: any) { setErr(e.message); } };
  useEffect(() => { if (tok) login(); }, []);
  if (!ok) return <Card title={t("nav_admin")} className="mx-auto max-w-md"><div className="space-y-3"><Err msg={err} /><input className={inp} type="password" placeholder={t("token")} value={tok} onChange={e => setTok(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
    <button className={btn} onClick={login}>{t("login")}</button></div></Card>;
  const list = rs.filter(r => f === "all" ? true : f === "pending" ? ["needs_expert", "referred"].includes(r.status) : r.status === f);
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2">{[["pending", t("pending")], ["validated", t("validated")], ["all", t("all")]].map(([k, l]) =>
      <button key={k} onClick={() => setF(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${f === k ? "bg-emerald-700 text-white" : "bg-white ring-1 ring-stone-300"}`}>{l}</button>)}
    <button className={btn2 + " ml-auto !py-1.5"} onClick={() => { sessionStorage.removeItem("tok"); setOk(false); setTok(""); }}>{t("logout")}</button></div>
    <div className="grid gap-4 md:grid-cols-2">{list.length ? list.map(r => <Item key={r.id + r.status + (r.expert_label || "")} r={r} tok={tok} reload={load} cls={cls} />) : <p className="text-stone-500">{t("no_data")}</p>}</div></div>;
}

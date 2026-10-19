import { useContext, useEffect, useState } from "react";
import { LangCtx } from "../i18n"; import { api, pretty, ago } from "../api"; import { Card, Badge } from "../ui";
export default function Dashboard() {
  const { t } = useContext(LangCtx); const [s, setS] = useState<any>(null); const [al, setAl] = useState<any[]>([]); const [rs, setRs] = useState<any[]>([]);
  useEffect(() => { api("/api/stats").then(setS).catch(() => {}); api("/api/alerts").then(setAl).catch(() => {}); api("/api/reports").then(r => setRs(r.slice(0, 8))).catch(() => {}); }, []);
  const stat = (label: string, v: any, c: string) => <div className={`rounded-2xl p-4 ${c}`}><p className="text-3xl font-bold">{v ?? "–"}</p><p className="text-sm">{label}</p></div>;
  const max = Math.max(1, ...(s?.by_disease || []).map((d: any) => d.n));
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stat(t("total"), s?.total, "bg-emerald-100 text-emerald-900")}{stat(t("awaiting"), s?.awaiting, "bg-amber-100 text-amber-900")}
      {stat(t("validated"), s?.validated, "bg-sky-100 text-sky-900")}{stat(t("alerts"), al.length, "bg-red-100 text-red-900")}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t("top")}>{s?.by_disease?.length ? <div className="space-y-2">{s.by_disease.map((d: any) => <div key={d.label}><div className="flex justify-between text-sm"><span>{pretty(d.label)}</span><b>{d.n}</b></div>
        <div className="h-2.5 rounded-full bg-stone-200"><div className="h-2.5 rounded-full bg-emerald-600" style={{ width: (d.n / max) * 100 + "%" }} /></div></div>)}</div> : <p className="text-stone-500">{t("no_data")}</p>}</Card>
      <Card title={t("alerts")}>{al.length ? <ul className="space-y-2">{al.map((a, i) => <li key={i} className="flex items-start justify-between gap-2 rounded-xl bg-stone-50 p-2 text-sm">
        <span><b>{t("a_" + a.type)}</b><br /><span className="text-stone-600">{a.detail}</span></span><span className="flex flex-col items-end gap-1"><Badge kind={a.severity}>{t(a.severity)}</Badge>{a.simulated && <Badge kind="sim">{t("simulated")}</Badge>}</span></li>)}</ul> : <p className="text-stone-500">{t("no_data")}</p>}</Card></div>
    <Card title={t("recent")}>{rs.length ? <ul className="divide-y">{rs.map(r => <li key={r.id} className="flex items-center gap-3 py-2">
      {r.url && <img src={r.url} alt="" className="h-12 w-12 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><p className="truncate font-medium">{pretty(r.expert_label || r.label)}</p>
        <p className="text-xs text-stone-500">#{r.id} · {ago(r.ts)} · {(r.confidence * 100).toFixed(0)}%</p></div><Badge kind={r.status}>{r.status.replace("_", " ")}</Badge></li>)}</ul> : <p className="text-stone-500">{t("no_data")}</p>}</Card>
  </div>;
}

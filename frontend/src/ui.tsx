import { ReactNode } from "react";
export const btn = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
export const btn2 = "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50";
export const inp = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";
export const Card = ({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 ${className}`}>{title && <h2 className="mb-3 text-lg font-semibold text-stone-900">{title}</h2>}{children}</section>);
const tone: Record<string, string> = { low: "bg-emerald-100 text-emerald-800", minimal: "bg-emerald-100 text-emerald-800", auto: "bg-stone-100 text-stone-700", moderate: "bg-amber-100 text-amber-800",
  needs_expert: "bg-amber-100 text-amber-800", referred: "bg-sky-100 text-sky-800", high: "bg-red-100 text-red-800", validated: "bg-emerald-100 text-emerald-800", sim: "bg-fuchsia-100 text-fuchsia-800" };
export const Badge = ({ kind, children }: { kind: string; children: ReactNode }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[kind] || tone.auto}`}>{children}</span>;
export const bar: Record<string, string> = { minimal: "bg-emerald-500", low: "bg-emerald-500", moderate: "bg-amber-500", high: "bg-red-500" };
export const Err = ({ msg }: { msg: string }) => msg ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{msg}</p> : null;

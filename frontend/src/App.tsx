import { useEffect, useState } from "react";
import { LangCtx, D } from "./i18n"; import { api } from "./api";
import Detect from "./pages/Detect"; import Dashboard from "./pages/Dashboard"; import MapPage from "./pages/MapPage"; import Sensors from "./pages/Sensors"; import Admin from "./pages/Admin";

const TABS = [["detect", "🌿"], ["dash", "📊"], ["map", "🗺️"], ["sensors", "📡"], ["admin", "🧑‍🔬"]] as const;
export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en"); const [tab, setTab] = useState("detect"); const [ready, setReady] = useState(true);
  const t = (k: string) => D[lang][k] ?? D.en[k] ?? k;
  useEffect(() => { api("/api/health").then(h => setReady(h.model_loaded)).catch(() => setReady(false)); }, []);
  useEffect(() => { localStorage.setItem("lang", lang); document.documentElement.lang = lang; }, [lang]);
  const page: Record<string, JSX.Element> = { detect: <Detect />, dash: <Dashboard />, map: <MapPage />, sensors: <Sensors />, admin: <Admin /> };
  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div className="min-h-screen pb-24 md:pb-8">
        <header className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
            <div><h1 className="text-xl font-bold md:text-2xl">🌾 {t("app")}</h1><p className="text-sm text-emerald-100">{t("tag")}</p></div>
            <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold hover:bg-white/30">{lang === "en" ? "हिन्दी" : "English"}</button>
          </div>
          <nav className="mx-auto hidden max-w-5xl gap-1 px-4 md:flex">{TABS.map(([k, i]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-t-xl px-4 py-2 text-sm font-medium ${tab === k ? "bg-stone-100 text-emerald-800" : "text-emerald-50 hover:bg-white/10"}`}>{i} {t("nav_" + k)}</button>))}</nav>
        </header>
        <main className="mx-auto max-w-5xl space-y-4 p-4">
          {!ready && <p className="rounded-xl bg-amber-100 p-3 text-amber-900 ring-1 ring-amber-300">⚠️ {t("no_model")}</p>}
          {page[tab]}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-[1000] flex border-t bg-white md:hidden">{TABS.map(([k, i]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-1 flex-col items-center py-2 text-xs ${tab === k ? "font-bold text-emerald-700" : "text-stone-500"}`}><span className="text-xl">{i}</span>{t("nav_" + k)}</button>))}</nav>
      </div>
    </LangCtx.Provider>);
}

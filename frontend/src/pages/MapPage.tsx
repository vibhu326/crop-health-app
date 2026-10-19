import { useContext, useEffect, useRef } from "react";
import L from "leaflet"; import "leaflet/dist/leaflet.css";
import { LangCtx } from "../i18n"; import { api, pretty } from "../api"; import { Card } from "../ui";
const colour: Record<string, string> = { low: "#059669", moderate: "#d97706", high: "#dc2626" };
export default function MapPage() {
  const { t } = useContext(LangCtx); const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const map = L.map(el.current!).setView([22.8, 79], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
    const hot = L.layerGroup().addTo(map), dots = L.layerGroup().addTo(map); L.control.layers({}, { "Hotspots": hot, "Reports": dots }).addTo(map);
    const pts: L.LatLngTuple[] = [];
    api("/api/hotspots").then((hs: any[]) => hs.forEach(h => { pts.push([h.lat, h.lon]);
      L.circle([h.lat, h.lon], { radius: 5500 + h.count * 1200, color: colour[h.level], fillOpacity: 0.25 }).addTo(hot).bindPopup(`<b>${pretty(h.top)}</b><br>${h.count} reports · ${h.level}`); })).catch(() => {});
    api("/api/reports").then((rs: any[]) => rs.filter(r => r.lat != null).forEach(r => {
      L.circleMarker([r.lat, r.lon], { radius: 7, color: r.status === "validated" ? "#047857" : "#1d4ed8", fillOpacity: 0.8 }).addTo(dots)
        .bindPopup(`<b>${pretty(r.expert_label || r.label)}</b><br>${(r.confidence * 100).toFixed(0)}% · ${r.status}${r.url ? `<br><img src="${r.url}" width="140"/>` : ""}`); pts.push([r.lat, r.lon]); })
      ).then(() => { if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 11 }); }).catch(() => {});
    setTimeout(() => map.invalidateSize(), 200); return () => { map.remove(); };
  }, []);
  return <Card><div ref={el} className="h-[65vh] rounded-xl" /><p className="mt-2 text-xs text-stone-500">{t("legend")}</p></Card>;
}

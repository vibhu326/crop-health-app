export async function api(url: string, opts: RequestInit = {}): Promise<any> {
  const r = await fetch(url, opts); let j: any = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : r.statusText || "Request failed"); return j;
}
export function fd(d: Record<string, any>) { const f = new FormData(); for (const [k, v] of Object.entries(d)) if (v !== undefined && v !== null && v !== "") f.append(k, v as any); return f; }
export const pretty = (s: string) => (s || "").replace(/___/g, " – ").replace(/_/g, " ");
export const ago = (ts: number) => new Date(ts * 1000).toLocaleString();

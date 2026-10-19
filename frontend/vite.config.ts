import { defineConfig } from "vite"; import react from "@vitejs/plugin-react";
// Dev mode: `npm run dev` proxies API calls to the FastAPI server on :8000
export default defineConfig({ plugins: [react()], server: { host: true, proxy: { "/api": "http://localhost:8000", "/uploads": "http://localhost:8000" } } });

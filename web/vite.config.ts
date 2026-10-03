import { fileURLToPath, URL } from "node:url";
import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:8000";

// SSE (/api/chat): bez kompresji i bez buforowania, żeby ramki płynęły na bieżąco.
const sseProxy: ProxyOptions = {
  target: apiTarget,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => {
      proxyReq.removeHeader("accept-encoding");
    });
    proxy.on("proxyRes", (proxyRes) => {
      proxyRes.headers["cache-control"] = "no-cache, no-transform";
      proxyRes.headers["x-accel-buffering"] = "no";
    });
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: {
      "/api/chat": sseProxy,
      "/api": { target: apiTarget, changeOrigin: true },
      "/healthz": { target: apiTarget, changeOrigin: true },
    },
  },
});

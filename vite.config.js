import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  server: {
    open: true,
    port: 5173,
    host: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 1200,
  },
});

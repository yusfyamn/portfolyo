import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/nrmlss": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
        ws: true,
      },
      "/polite-chaos": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
        ws: true,
      },
      "/terrene": {
        target: "http://127.0.0.1:3004",
        changeOrigin: true,
        ws: true,
      },
      "/isochrome": {
        target: "http://127.0.0.1:3005",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        reactHome: fileURLToPath(new URL("./react-home.html", import.meta.url)),
      },
    },
  },
});

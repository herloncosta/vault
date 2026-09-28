import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleMock } from "./mock-data";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://192.168.88.253:3000",
    },
    allowedHosts: ["host.docker.internal"],
    configureServer: (app: any) => {
      const useMock = mode === "development";
      app.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith("/api") && useMock) {
          if (handleMock(req, res)) return;
        }
        next();
      });
    },
  },
}));

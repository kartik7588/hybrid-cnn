import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Send /api requests to the Python prediction server (python ml/api.py)
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
});

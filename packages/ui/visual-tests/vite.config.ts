import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    warmup: {
      clientFiles: ["./src/Main.tsx"],
    },
  },
});

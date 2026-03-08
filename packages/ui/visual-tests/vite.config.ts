import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: new URL(".", import.meta.url).pathname,
  server: {
    warmup: {
      clientFiles: ["./src/Main.tsx"],
    },
  },
});

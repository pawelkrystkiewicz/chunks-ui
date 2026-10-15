import type { NextConfig } from "next";

// A static export: check-no-motion.ts reads out/index.html instead of starting a server
export default { output: "export" } satisfies NextConfig;

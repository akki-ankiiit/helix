import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { existsSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
// Vite treats # as a URL fragment. A preserved symlink keeps this workspace
// usable without moving user files when its directory contains a # character.
const cwd = process.cwd();
let root = cwd;
if (cwd.includes("#")) {
  const parent = join(tmpdir(), "opencode");
  mkdirSync(parent, { recursive: true });
  root = join(
    parent,
    `helix-vite-${createHash("sha256").update(cwd).digest("hex").slice(0, 10)}`,
  );
  if (!existsSync(root)) symlinkSync(cwd, root, "dir");
}
export default defineConfig({
  root,
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  test: { include: ["tests/unit/**/*.test.ts"] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          spreadsheet: ["xlsx"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});

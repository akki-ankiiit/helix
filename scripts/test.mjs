import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
// vite-node currently mishandles # in physical paths. Stage only test inputs
// outside that path; the actual project source remains the source of truth.
const cwd = process.cwd();
if (!cwd.includes("#")) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run"],
    { stdio: "inherit" },
  );
  process.exit(result.status ?? 1);
}
const parent = join(tmpdir(), "opencode");
mkdirSync(parent, { recursive: true });
const root = mkdtempSync(join(parent, "helix-tests-"));
try {
  cpSync(join(cwd, "src"), join(root, "src"), { recursive: true });
  cpSync(join(cwd, "tests/unit"), join(root, "tests/unit"), {
    recursive: true,
  });
  symlinkSync(join(cwd, "node_modules"), join(root, "node_modules"), "dir");
  writeFileSync(join(root, "package.json"), '{"type":"module"}');
  writeFileSync(
    join(root, "vitest.config.ts"),
    "import { defineConfig } from 'vitest/config'; export default defineConfig({resolve:{preserveSymlinks:true},test:{include:['tests/unit/**/*.test.ts']}});",
  );
  const result = spawnSync(
    process.execPath,
    [
      "--preserve-symlinks",
      "--preserve-symlinks-main",
      join(root, "node_modules/vitest/vitest.mjs"),
      "run",
    ],
    { cwd: root, stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(root, { recursive: true, force: true });
}

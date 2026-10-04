import { existsSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
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
const child = spawn(
  process.execPath,
  [
    "--preserve-symlinks",
    "--preserve-symlinks-main",
    join(root, "node_modules/vite/bin/vite.js"),
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", cwd: root },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));

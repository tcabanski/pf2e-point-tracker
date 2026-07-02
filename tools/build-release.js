import { rm, cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const dist = join(root, "dist");
const moduleZip = join(root, "module.zip");
const releaseFiles = ["assets", "docs", "packs", "scripts", "module.json", "readme.md"];

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  const missing = [];
  for (const file of releaseFiles) {
    if (!existsSync(join(root, file))) missing.push(file);
  }
  if (missing.length > 0) throw new Error(`Missing release files: ${missing.join(", ")}`);

  await rm(dist, { recursive: true, force: true });
  await rm(moduleZip, { force: true });
  await mkdir(dist, { recursive: true });

  for (const file of releaseFiles) {
    await cp(join(root, file), join(dist, file), { recursive: true });
  }

  const entries = await readdir(dist);
  await run("zip", ["-rq", moduleZip, ...entries], { cwd: dist });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

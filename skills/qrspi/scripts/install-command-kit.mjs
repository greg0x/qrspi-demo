#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const skillDir = resolve(dirname(scriptPath), "..");
const targetRoot = resolve(process.argv[2] ?? process.cwd());

const sourceRoot = join(skillDir, "assets", "claude");
const sources = [
  ["commands", join(sourceRoot, "commands"), join(targetRoot, ".claude", "commands")],
  ["agents", join(sourceRoot, "agents"), join(targetRoot, ".claude", "agents")],
];

function copyMarkdownFiles(label, fromDir, toDir) {
  if (!existsSync(fromDir) || !statSync(fromDir).isDirectory()) {
    throw new Error(`Missing bundled ${label} directory: ${fromDir}`);
  }

  mkdirSync(toDir, { recursive: true });

  let count = 0;
  for (const name of readdirSync(fromDir)) {
    if (!name.endsWith(".md")) continue;
    copyFileSync(join(fromDir, name), join(toDir, name));
    count += 1;
  }

  console.log(`Installed ${count} ${label} into ${toDir}`);
}

for (const [label, fromDir, toDir] of sources) {
  copyMarkdownFiles(label, fromDir, toDir);
}

console.log(`QRSPI command kit installed in ${targetRoot}`);

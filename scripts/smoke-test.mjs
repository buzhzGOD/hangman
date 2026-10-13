import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const pass = (message) => console.log(`PASS: ${message}`);

for (const required of ["index.html", "sw.js", "manifest.webmanifest"]) {
  if (!fs.existsSync(path.join(root, required))) fail(`Missing required file: ${required}`);
}
if (process.exitCode) process.exit();

const html = read("index.html");
const scriptBlocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
  .filter((match) => !/\bsrc\s*=/.test(match[1]))
  .map((match) => match[2])
  .filter((body) => body.trim());

if (scriptBlocks.length === 0) fail("No inline JavaScript blocks found in index.html");
else {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hangman-check-"));
  try {
    scriptBlocks.forEach((body, index) => {
      const tempFile = path.join(tempDir, `inline-${index + 1}.js`);
      fs.writeFileSync(tempFile, body);
      const result = spawnSync(process.execPath, ["--check", tempFile], { encoding: "utf8" });
      if (result.status !== 0) {
        fail(`JavaScript syntax error in inline script ${index + 1}:\n${result.stderr || result.stdout}`);
      }
    });
    if (!process.exitCode) pass(`JavaScript syntax: ${scriptBlocks.length} inline script(s)`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

let manifest;
try {
  manifest = JSON.parse(read("manifest.webmanifest"));
  pass("manifest.webmanifest is valid JSON");
} catch (error) {
  fail(`manifest.webmanifest is invalid JSON: ${error.message}`);
}

function checkLocalResource(reference, source) {
  if (typeof reference !== "string" || !reference.trim()) {
    fail(`Empty resource reference in ${source}`);
    return;
  }
  if (/^(?:[a-z]+:)?\/\//i.test(reference) || reference.startsWith("data:") || reference.startsWith("#")) return;
  const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const resolved = path.resolve(root, clean.startsWith("./") ? clean.slice(2) : clean);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    fail(`Resource escapes repository root in ${source}: ${reference}`);
    return;
  }
  if (!fs.existsSync(resolved)) fail(`Missing resource in ${source}: ${reference}`);
}

if (manifest && Array.isArray(manifest.icons)) {
  for (const icon of manifest.icons) checkLocalResource(icon.src, "manifest.webmanifest");
  pass("Manifest icon paths checked");
} else if (manifest) {
  fail("manifest.webmanifest must define an icons array");
}

const sw = read("sw.js");
const precache = sw.match(/const\s+F\s*=\s*\[([\s\S]*?)\]\s*;/);
if (!precache) {
  fail("Could not find the service-worker precache list (const F = [...])");
} else {
  try {
    const entries = JSON.parse(`[${precache[1]}]`);
    for (const entry of entries) checkLocalResource(entry, "sw.js precache list");
    pass(`Service-worker precache paths checked: ${entries.length}`);
  } catch (error) {
    fail(`Could not parse service-worker precache list: ${error.message}`);
  }
}

if (process.exitCode) {
  console.error("Smoke tests failed.");
  process.exit(1);
}
console.log("All smoke tests passed.");

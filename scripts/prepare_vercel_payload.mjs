import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const output = process.argv[2];
if (!output) throw new Error("Provide output path");

const excludedDirs = new Set(["node_modules", "dist", "coverage", "tmp"]);
const excluded = [
  /(^|\/)scripts\//,
  /(^|\/)\.github\//,
  /^client\/public\/__manus__\//,
  /^client\/src\/pages\/ComponentShowcase\.tsx$/,
  /^drizzle\/meta\//,
  /\.test\.[cm]?[jt]sx?$/,
  /(^|\/)(README|todo)\.md$/i,
  /^README_EXPORT\.md$/,
  /^VERCEL_EXTERNAL_VERIFICATION\.md$/,
];
const binaryExt = /\.(avif|gif|ico|jpe?g|mp4|png|webp|woff2?)$/i;

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collect(absolute));
      continue;
    }
    if (!entry.isFile()) continue;
    const file = relative(root, absolute).replaceAll("\\", "/");
    if (excluded.some((pattern) => pattern.test(file))) continue;
    const buffer = await readFile(absolute);
    const binary = binaryExt.test(file) || buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
    files.push({ file, data: binary ? buffer.toString("base64") : buffer.toString("utf8"), ...(binary ? { encoding: "base64" } : {}) });
  }
  return files;
}

const files = await collect(root);
const payload = {
  name: "zomool-al-khaili-reserve",
  target: "production",
  teamId: "team_bKgreO6A2snnSVzUpYwiqmoW",
  projectSettings: { framework: "vite", buildCommand: "pnpm build", installCommand: "pnpm install --frozen-lockfile", outputDirectory: "dist/public" },
  files,
};
await writeFile(output, JSON.stringify(payload));
console.log(JSON.stringify({ output, files: files.length, bytes: (await stat(output)).size, hasStorageRoute: files.some(({ file }) => file === "api/storage/[...path].mjs") }));

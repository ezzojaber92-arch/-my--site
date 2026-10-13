import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const projectRoot = process.cwd();
const outputFile = process.argv[2];

if (!outputFile) {
  throw new Error("Provide an output JSON file path.");
}

const excludedDirectories = new Set([".git", ".manus-logs", "coverage", "dist", "node_modules", "tmp"]);
const excludedFiles = new Set([".env", ".env.local", ".env.production", ".env.test"]);
const sourceOnlyExclusions = [
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

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const collected = [];

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && (excludedFiles.has(entry.name) || entry.name.startsWith(".env."))) continue;

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      collected.push(...(await collectFiles(absolutePath)));
      continue;
    }
    if (!entry.isFile()) continue;

    const relativePath = relative(projectRoot, absolutePath).replaceAll("\\", "/");
    if (sourceOnlyExclusions.some((pattern) => pattern.test(relativePath))) continue;
    const fileStats = await stat(absolutePath);
    const buffer = await readFile(absolutePath);
    const isBinary = buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0) || /\.(avif|gif|ico|jpe?g|mp4|png|webp)$/i.test(relativePath);

    collected.push({
      file: relativePath,
      data: isBinary ? buffer.toString("base64") : buffer.toString("utf8"),
      ...(isBinary ? { encoding: "base64" } : {}),
      size: fileStats.size,
    });
  }

  return collected;
}

const files = await collectFiles(projectRoot);
const payload = {
  name: "zomool-al-khaili-reserve-vercel-production-controls",
  target: "production",
  teamId: "team_bKgreO6A2snnSVzUpYwiqmoW",
  projectSettings: {
    framework: "vite",
    buildCommand: "pnpm build",
    installCommand: "pnpm install --frozen-lockfile",
    outputDirectory: "dist/public",
  },
  files: files.map(({ size: _size, ...file }) => file),
};

await writeFile(outputFile, `${JSON.stringify(payload)}\n`);
console.log(`Prepared ${files.length} deployment files without environment files.`);

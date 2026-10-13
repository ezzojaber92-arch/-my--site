import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const owner = "ezzojaber92-arch";
const repository = "-my--site";
const branch = "main";
const projectRoot = path.resolve(import.meta.dirname, "..");
const dryRun = process.env.PUBLISH_DRY_RUN === "1";

const allowedDirectories = new Set(["api", "client", "drizzle", "patches", "scripts", "server", "shared"]);
const allowedFiles = new Set([
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  "components.json",
  "package.json",
  "pnpm-lock.yaml",
  "template.json",
  "tsconfig.json",
  "tsconfig.node.json",
  "vercel.json",
  "vite.config.ts",
  "vitest.config.ts",
  "VERCEL_DEPLOYMENT.md",
  "VERCEL_DATABASE_NOTES.md",
  "MIGRATION_CHECKLIST.md",
  "README_EXPORT.md",
  "UPDATE_CAMEL_RECORDS.md",
]);

async function collectFiles(directory, relative = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git" || entry.name === ".env" || entry.name === ".manus-logs") continue;
    const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const nextFullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!relative && !allowedDirectories.has(entry.name)) continue;
      files.push(...await collectFiles(nextFullPath, nextRelative));
    } else if ((relative && allowedDirectories.has(relative.split("/")[0])) || (!relative && allowedFiles.has(entry.name))) {
      files.push({ fullPath: nextFullPath, repositoryPath: nextRelative });
    }
  }
  return files;
}

async function github(endpoint, init = {}) {
  const method = init.method || "GET";
  const args = ["api", endpoint, "-X", method, "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2022-11-28"];
  const body = init.body ? JSON.parse(init.body) : undefined;
  if (body) args.push("--input", "-");
  const result = spawnSync("gh", args, { encoding: "utf8", input: body ? JSON.stringify(body) : undefined });
  if (result.status !== 0) throw new Error("GitHub request was rejected by the authorized account.");
  const cleanOutput = result.stdout.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "").trim();
  const jsonStart = [cleanOutput.indexOf("{"), cleanOutput.indexOf("[")].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  return jsonStart === undefined ? null : JSON.parse(cleanOutput.slice(jsonStart));
}

const files = await collectFiles(projectRoot);
if (dryRun) {
  console.log(JSON.stringify({ repository: `${owner}/${repository}`, branch, fileCount: files.length, files: files.map((file) => file.repositoryPath) }, null, 2));
  process.exit(0);
}

const reference = await github(`/repos/${owner}/${repository}/git/ref/heads/${branch}`);
const commit = await github(`/repos/${owner}/${repository}/git/commits/${reference.object.sha}`);
const blobs = [];
for (const file of files) {
  const content = await fs.readFile(file.fullPath);
  const blob = await github(`/repos/${owner}/${repository}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
  });
  blobs.push({ path: file.repositoryPath, mode: "100644", type: "blob", sha: blob.sha });
}

const tree = await github(`/repos/${owner}/${repository}/git/trees`, {
  method: "POST",
  body: JSON.stringify({ base_tree: commit.tree.sha, tree: blobs }),
});
const newCommit = await github(`/repos/${owner}/${repository}/git/commits`, {
  method: "POST",
  body: JSON.stringify({
    message: "Prepare reserve site for Vercel and TiDB migration",
    tree: tree.sha,
    parents: [reference.object.sha],
  }),
});
await github(`/repos/${owner}/${repository}/git/refs/heads/${branch}`, {
  method: "PATCH",
  body: JSON.stringify({ sha: newCommit.sha, force: false }),
});
console.log(JSON.stringify({ repository: `${owner}/${repository}`, branch, commit: newCommit.sha, fileCount: files.length }, null, 2));

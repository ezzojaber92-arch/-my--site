import fs from "node:fs";
const payload = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const files = Array.isArray(payload.files) ? payload.files : Object.entries(payload.files ?? {}).map(([file, data]) => ({ file, data }));
console.log({ topLevel: Object.keys(payload), fileCount: files.length, sampleFields: files.slice(0, 3).map((entry) => Object.keys(entry ?? {})) });
console.log(files.filter((entry) => String(entry?.file ?? "").includes("media/") || String(entry?.file ?? "").includes("IMG_7677")).slice(0, 30).map((entry) => entry.file).join("\n"));

import mysql from "mysql2/promise";

const targetUrl = process.env.TIDB_MIGRATION_URL;
const targetDatabase = process.env.TIDB_TARGET_DATABASE || "zomool_reserve";
const legacyOrigin = "https://zomoolreserv-9qm89e3w.manus.space";
const replacements = {
  "/manus-storage/rahi-weld-alsareea_68f66fcf.png": "/manus-storage/IMG_7677_a10100ed_8a848c21.png",
  "/manus-storage/alhathar-alsagheer_c8c1ed8e.png": "/manus-storage/alhathar-alsagheer_c8c1ed8e_d4fed9e6.png",
  "/manus-storage/alwasmi-alsagheer_04572c54.png": "/manus-storage/alwasmi-alsagheer_04572c54_94bc1581.png",
  "/manus-storage/enad_b3b0ae58.png": "/manus-storage/enad_b3b0ae58_996cf3af.png",
  "/manus-storage/ghazi-weld-wafra_02cb9f56.png": "/manus-storage/ghazi-weld-wafra_02cb9f56_ca096308.png",
  "/manus-storage/mardhi_138a6354.png": "/manus-storage/mardhi_138a6354_d2537b39.png",
  "/manus-storage/reserve-video-2026-thumbnail_1931bf11.jpg": "/manus-storage/reserve-video-2026-thumbnail_1931bf11_b97b1100.jpg",
  "/manus-storage/reserve/1/content/IMG_7642_ab2dba4c.jpeg": "/manus-storage/IMG_7642_ab2dba4c_592c9089.jpeg",
  "/manus-storage/reserve/1/content/IMG_7657_ef9094a9.jpeg": "/manus-storage/IMG_7657_ef9094a9_a6537c87.jpeg",
  "/manus-storage/reserve/270001/camels/IMG_7677_a10100ed.png": "/manus-storage/IMG_7677_a10100ed_8a848c21.png",
  "/manus-storage/reserve/270001/content/IMG_7675_43657a15.jpeg": "/manus-storage/IMG_7675_43657a15_0420cbe8.jpeg",
  "/manus-storage/reserve/270001/content/v29044g50000d5ciac7og65i2dad18v0_e18747fd.mp4": "/manus-storage/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4",
};
const targets = [
  ["camel_records", "image_url"],
  ["camel_photos", "image_url"],
  ["content_items", "media_url"],
  ["content_items", "thumbnail_url"],
];

if (!targetUrl) throw new Error("TIDB_MIGRATION_URL is required to rewrite migrated media.");
if (!/^[A-Za-z0-9_]+$/.test(targetDatabase)) throw new Error("TIDB_TARGET_DATABASE must contain letters, digits, or underscores only.");

const parsed = new URL(targetUrl);
const connection = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || "4000"),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: targetDatabase,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

try {
  let updatedRows = 0;
  for (const [table, column] of targets) {
    for (const [sourcePath, migratedPath] of Object.entries(replacements)) {
      const bundledPath = `/media/${migratedPath.split("/").at(-1)}`;
      const priorMigratedUrl = `${legacyOrigin}${migratedPath}`;
      const [result] = await connection.execute(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE \`${column}\` IN (?, ?)`, [bundledPath, sourcePath, priorMigratedUrl]);
      updatedRows += Number(result.affectedRows || 0);
    }
  }
  console.log(JSON.stringify({ targetDatabase, updatedRows, mappings: Object.keys(replacements).length }, null, 2));
} finally {
  await connection.end();
}

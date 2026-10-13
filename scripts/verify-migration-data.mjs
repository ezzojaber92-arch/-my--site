import mysql from "mysql2/promise";

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = process.env.TIDB_MIGRATION_URL;
const targetDatabase = process.env.TIDB_TARGET_DATABASE || "zomool_reserve_v2";
const tables = [
  "users",
  "admin_email_access",
  "reserve_settings",
  "camel_records",
  "content_items",
  "camel_photos",
  "camel_production_links",
  "content_likes",
  "content_comments",
];

if (!sourceUrl || !targetUrl) throw new Error("Both source and TiDB migration connections are required.");
if (!/^[A-Za-z0-9_]+$/.test(targetDatabase)) throw new Error("TIDB_TARGET_DATABASE must contain letters, digits, or underscores only.");

function tiDbOptions(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || "4000"),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: targetDatabase,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}

const [source, target] = await Promise.all([
  mysql.createConnection(sourceUrl),
  mysql.createConnection(tiDbOptions(targetUrl)),
]);

try {
  const counts = [];
  for (const table of tables) {
    const [[sourceRow]] = await source.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    const [[targetRow]] = await target.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    const expected = Number(sourceRow.count);
    const actual = Number(targetRow.count);
    counts.push({ table, source: expected, target: actual, matches: expected === actual });
  }

  console.log(JSON.stringify({ targetDatabase, counts }, null, 2));
  if (counts.some((row) => !row.matches)) throw new Error("TiDB migration verification found mismatched table counts.");
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}

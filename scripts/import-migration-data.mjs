import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sourceFile = process.env.MIGRATION_EXPORT_PATH || "/home/ubuntu/Downloads/zomool-al-khaili-reserve-data.sql";
const targetUrl = process.env.TIDB_MIGRATION_URL;
const targetDatabase = process.env.TIDB_TARGET_DATABASE || "zomool_reserve";
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

if (!targetUrl) throw new Error("TIDB_MIGRATION_URL is required to import the migration data.");
if (!/^[A-Za-z0-9_]+$/.test(targetDatabase)) throw new Error("TIDB_TARGET_DATABASE must contain letters, digits, or underscores only.");

const parsed = new URL(targetUrl);
const connection = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || "4000"),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  multipleStatements: true,
});

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDatabase}\``);
  await connection.query(`USE \`${targetDatabase}\``);

  const [existingRows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN (?)",
    [targetDatabase, tables],
  );
  if (Array.isArray(existingRows) && existingRows.length > 0) {
    throw new Error("Target database already contains application tables; import stopped to protect existing data.");
  }

  const sql = await fs.readFile(sourceFile, "utf8");
  await connection.query(sql);

  const [countRows] = await connection.query(
    "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = ? AND table_name IN (?) ORDER BY table_name",
    [targetDatabase, tables],
  );
  console.log(JSON.stringify({ targetDatabase, importedTables: countRows }, null, 2));
} finally {
  await connection.end();
}

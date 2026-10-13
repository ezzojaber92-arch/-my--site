import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const outputPath = process.env.MIGRATION_EXPORT_PATH || "/home/ubuntu/Downloads/zomool-al-khaili-reserve-data.sql";

if (!sourceUrl) {
  throw new Error("SOURCE_DATABASE_URL or DATABASE_URL is required to export the migration data.");
}

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

const connection = await mysql.createConnection(sourceUrl);

function adaptCreateStatementForTiDb(table, createStatement) {
  if (table !== "camel_production_links") return createStatement;
  return createStatement.replace(/`url` varchar\(\d+\) NOT NULL/, "`url` varchar(512) NOT NULL");
}

try {
  const statements = [
    "-- محمية زمول عيسى بن سعيد الخييلي: نسخة بيانات ترحيل TiDB.",
    "-- لا يحتوي هذا الملف على كلمات مرور أو مفاتيح بيئة أو ملفات وسائط.",
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "",
  ];

  for (const table of tables) {
    const [createRows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    const createStatement = createRows[0]?.["Create Table"];

    if (typeof createStatement !== "string") {
      throw new Error(`Could not read the schema for table ${table}.`);
    }

    statements.push(`-- ${table}`, adaptCreateStatementForTiDb(table, createStatement) + ";");

    const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id ASC`);
    if (Array.isArray(rows) && rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map((column) => `\`${column}\``).join(", ");
      const valuesSql = rows
        .map((row) => `(${columns.map((column) => mysql.escape(column === "password_hash" ? null : row[column])).join(", ")})`)
        .join(",\n");
      statements.push(`INSERT INTO \`${table}\` (${columnSql}) VALUES\n${valuesSql};`);
    }
    statements.push("");
  }

  statements.push("SET FOREIGN_KEY_CHECKS = 1;", "");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, statements.join("\n"), "utf8");
  console.log(`Migration data export created at ${outputPath}`);
} finally {
  await connection.end();
}

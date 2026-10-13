import mysql from "mysql2/promise";
import { describe, expect, it } from "vitest";
import { getTiDbConnectionOptionsFromUrl } from "../server/_core/databaseUrl";

describe("TiDB migration connection", () => {
  const verifyConnection = process.env.VERIFY_MIGRATION_DATABASE === "1" ? it : it.skip;

  verifyConnection("accepts a lightweight query through the secure migration connection", async () => {
    const url = process.env.TIDB_MIGRATION_URL ?? process.env.MIGRATION_DATABASE_URL;
    expect(url, "TIDB_MIGRATION_URL must be configured").toBeTruthy();

    const connection = await mysql.createConnection(getTiDbConnectionOptionsFromUrl(url!));
    try {
      const [rows] = await connection.query<{ ok: number }[]>("SELECT 1 AS ok");
      expect(rows[0]?.ok).toBe(1);
    } finally {
      await connection.end();
    }
  }, 15_000);
});

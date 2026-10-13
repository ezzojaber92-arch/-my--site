import { describe, expect, it } from "vitest";
import { getTiDbConnectionOptions, getTiDbConnectionOptionsFromUrl, hasTiDbPasswordPlaceholder, resolveDatabaseUrl } from "./_core/databaseUrl";

describe("resolveDatabaseUrl", () => {
  it("prioritizes an explicit DATABASE_URL", () => {
    expect(resolveDatabaseUrl({
      DATABASE_URL: "mysql://existing-url/database",
      TIDB_HOST: "ignored.example.com",
      TIDB_USER: "ignored",
      TIDB_PASSWORD: "ignored",
      TIDB_DATABASE: "ignored",
    })).toBe("mysql://existing-url/database");
  });

  it("builds a TLS TiDB URL from the Vercel integration variables", () => {
    expect(resolveDatabaseUrl({
      TIDB_HOST: "gateway.example.tidbcloud.com",
      TIDB_PORT: "4000",
      TIDB_USER: "prefix.root",
      TIDB_PASSWORD: "pass with spaces&symbols",
      TIDB_DATABASE: "sys",
    })).toBe("mysql://prefix.root:pass%20with%20spaces%26symbols@gateway.example.tidbcloud.com:4000/sys?sslaccept=strict");
  });

  it("returns an empty string when the TiDB variables are incomplete", () => {
    expect(resolveDatabaseUrl({ TIDB_HOST: "gateway.example.tidbcloud.com" })).toBe("");
  });

  it("enables verified TLS when Vercel supplies separated TiDB variables", () => {
    expect(getTiDbConnectionOptions({
      TIDB_HOST: "gateway.example.tidbcloud.com",
      TIDB_USER: "prefix.root",
      TIDB_PASSWORD: "password",
      TIDB_DATABASE: "sys",
    })).toMatchObject({
      host: "gateway.example.tidbcloud.com",
      port: 4000,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  });

  it("uses the non-secret target database override with a direct TiDB URL", () => {
    expect(getTiDbConnectionOptions({
      DATABASE_URL: "mysql://prefix.root:secret@gateway.example.tidbcloud.com:4000/sys?sslaccept=strict",
      TIDB_TARGET_DATABASE: "zomool_reserve_v2",
    })).toMatchObject({
      database: "zomool_reserve_v2",
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  });

  it("accepts TIDB_DB_NAME when the integration uses the alternate name", () => {
    expect(getTiDbConnectionOptions({
      TIDB_HOST: "gateway.example.tidbcloud.com",
      TIDB_USER: "prefix.root",
      TIDB_PASSWORD: "password",
      TIDB_DB_NAME: "sys",
    })).toMatchObject({ database: "sys" });
  });

  it("converts a migration URL into verified TLS connection options", () => {
    expect(getTiDbConnectionOptionsFromUrl("mysql://prefix.root:secret@gateway.example.tidbcloud.com:4000/sys?sslaccept=strict")).toMatchObject({
      host: "gateway.example.tidbcloud.com",
      port: 4000,
      user: "prefix.root",
      database: "sys",
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  });

  it("detects a password template without exposing the connection value", () => {
    expect(hasTiDbPasswordPlaceholder("mysql://prefix.root:%3CPASSWORD%3E@gateway.example.tidbcloud.com:4000/sys")).toBe(true);
    expect(hasTiDbPasswordPlaceholder("mysql://prefix.root:real-secret@gateway.example.tidbcloud.com:4000/sys")).toBe(false);
  });
});

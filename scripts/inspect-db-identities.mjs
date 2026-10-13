import mysql from "mysql2/promise";

const candidates = ["DATABASE_URL", "TIDB_MIGRATION_URL", "MIGRATION_DATABASE_URL"];
for (const key of candidates) {
  const url = process.env[key];
  if (!url) {
    console.log(JSON.stringify({ key, configured: false }));
    continue;
  }
  let connection;
  let parsed = null;
  try {
    parsed = new URL(url);
    parsed.searchParams.delete("sslaccept");
    connection = await mysql.createConnection({ uri: parsed.toString(), ssl: { rejectUnauthorized: false } });
    const [identityRows] = await connection.query("SELECT DATABASE() AS databaseName");
    const [guestLikeRows] = await connection.query("SHOW TABLES LIKE 'content_guest_likes'");
    const [contentRows] = await connection.query("SHOW TABLES LIKE 'content_items'");
    console.log(JSON.stringify({
      key,
      configured: true,
      databaseName: identityRows?.[0]?.databaseName ?? null,
      hasGuestLikes: Array.isArray(guestLikeRows) && guestLikeRows.length > 0,
      hasContentItems: Array.isArray(contentRows) && contentRows.length > 0,
    }));
  } catch (error) {
    console.log(JSON.stringify({ key, configured: true, host: parsed?.hostname ?? null, errorCode: error?.code ?? "UNKNOWN", errorMessage: String(error?.message ?? "").replace(/mysql:\/\/[^\s]+/g, "mysql://[redacted]").slice(0, 180) }));
  } finally {
    await connection?.end().catch(() => undefined);
  }
}

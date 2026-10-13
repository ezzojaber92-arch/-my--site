type Environment = Record<string, string | undefined>;

export type TiDbConnectionOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: {
    minVersion: "TLSv1.2";
    rejectUnauthorized: true;
  };
};

/**
 * يقبل DATABASE_URL القياسي، أو المتغيرات المنفصلة التي ينشئها تكامل TiDB مع Vercel.
 * لا يسجل هذه القيم حتى لا تظهر بيانات الاتصال في السجلات.
 */
export function resolveDatabaseUrl(env: Environment = process.env): string {
  const directUrl = env.DATABASE_URL?.trim();
  if (directUrl) return directUrl;

  const host = env.TIDB_HOST?.trim();
  const user = env.TIDB_USER?.trim();
  const password = env.TIDB_PASSWORD;
  const database = env.TIDB_DATABASE?.trim() || env.TIDB_DB_NAME?.trim();
  const port = env.TIDB_PORT?.trim() || "4000";

  if (!host || !user || !password || !database) return "";

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?sslaccept=strict`;
}

export function getTiDbConnectionOptions(env: Environment = process.env): TiDbConnectionOptions | null {
  const directUrl = env.DATABASE_URL?.trim();
  const targetDatabase = env.TIDB_TARGET_DATABASE?.trim();

  if (directUrl) {
    try {
      const connection = getTiDbConnectionOptionsFromUrl(directUrl);
      return targetDatabase ? { ...connection, database: targetDatabase } : connection;
    } catch {
      return null;
    }
  }

  const host = env.TIDB_HOST?.trim();
  const user = env.TIDB_USER?.trim();
  const password = env.TIDB_PASSWORD;
  const database = targetDatabase || env.TIDB_DATABASE?.trim() || env.TIDB_DB_NAME?.trim();
  const port = Number(env.TIDB_PORT?.trim() || "4000");

  if (!host || !user || !password || !database || !Number.isInteger(port)) return null;

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}

export function getTiDbConnectionOptionsFromUrl(connectionUrl: string): TiDbConnectionOptions {
  const parsed = new URL(connectionUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const port = Number(parsed.port || "4000");

  if (parsed.protocol !== "mysql:" || !parsed.hostname || !parsed.username || !parsed.password || !database || !Number.isInteger(port)) {
    throw new Error("Invalid TiDB migration connection URL.");
  }

  return {
    host: parsed.hostname,
    port,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}

/** يميز قوالب كلمة المرور الشائعة من دون إعادة أي جزء من سلسلة الاتصال. */
export function hasTiDbPasswordPlaceholder(connectionUrl: string): boolean {
  try {
    const password = decodeURIComponent(new URL(connectionUrl).password);
    return /<[^>]+>|\{[^}]+\}|^password$/i.test(password);
  } catch {
    return false;
  }
}

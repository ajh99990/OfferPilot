import { Pool, type PoolConfig } from "pg";

declare global {
  var __offerpilotPgPool: Pool | undefined;
}

function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      max: 10,
    };
  }

  return {
    host: process.env.PGHOST?.trim() || "localhost",
    port: Number(process.env.PGPORT?.trim() || "5432"),
    database: process.env.PGDATABASE?.trim() || "postgres",
    user: process.env.PGUSER?.trim() || "postgres",
    password: process.env.PGPASSWORD?.trim() || "postgres",
    max: 10,
  };
}

export function getDbPool(): Pool {
  if (!global.__offerpilotPgPool) {
    global.__offerpilotPgPool = new Pool(getPoolConfig());
  }

  return global.__offerpilotPgPool;
}

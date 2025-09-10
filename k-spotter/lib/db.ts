import { Pool } from "pg"

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // 예: postgresql://user:pass@localhost:5432/kspot
  max: 5,
  idleTimeoutMillis: 30_000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

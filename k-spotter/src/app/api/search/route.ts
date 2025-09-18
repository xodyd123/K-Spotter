import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    console.log("sp" ,sp) ;
    const q = (sp.get("title") ?? "").trim();     // '아이' 또는 '아이유'
    const limit = Math.min(Math.max(Number(sp.get("limit") ?? 20), 1), 500);
    if (!q) return NextResponse.json([]);
  
    const sql = `
      WITH base AS (
        SELECT
          substring(title from '^[^\\s,·\\-\\(\\)\\[\\]]+') AS token,
          media_type AS category
        FROM public.spots
        WHERE title ILIKE $1 || '%'
      )
      SELECT token AS name, COUNT(*) AS total, MIN(category) AS category
      FROM base
      GROUP BY token
      HAVING COUNT(DISTINCT category) = 1
      ORDER BY total DESC
      LIMIT $2;
    `;
    const { rows } = await pool.query(sql, [q, limit]);
    
    return NextResponse.json(rows);
  }
  

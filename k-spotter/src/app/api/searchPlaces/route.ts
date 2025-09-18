import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const name = sp.get("name"); 


  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const sql = `
    SELECT
      spot_id       AS id,
      lat, lng,
      title, address,
      media_type    AS category,
      place_type    AS "placeType",
      place_detail  AS "placeDetail",
      open_hours    AS "openHours",
      place_name    AS "placeName",
      phone,
      closed_day    AS "closedDay"
    FROM public.spots
    WHERE title ILIKE $1 || '%'
    ORDER BY updated_at DESC NULLS LAST, spot_id DESC
  `;

  try {
    const { rows } = await pool.query({ text: sql, values: [name], name: "spots_by_title_eq" }); 
    return NextResponse.json(rows);

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

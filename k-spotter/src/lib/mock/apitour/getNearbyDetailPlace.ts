export async function NearbyDetailPlace(
  id: string | number,
  ctype: string | number
) {
  const res = await fetch(
    `/api/nearbyDetailPlace?contentTypeId=${ctype}&placeId=${id}`
  );

  if (!res.ok) throw new Error("detail fetch failed");
  // 예: { openHours, closedDay, phone }
  return res.json();
}

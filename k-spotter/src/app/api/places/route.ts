import { mockPlaces } from "@/lib/mock/mockData";
import { NextResponse } from "next/server";

export function GET(){

    return NextResponse.json(mockPlaces);
}
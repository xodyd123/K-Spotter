import { mockPlaces } from "@/lib/mock/mockData";

import { NextRequest ,NextResponse } from "next/server";

export async function GET(req: NextRequest){ 

    const cat = req.nextUrl.searchParams.getAll("category") ;
  

    if(cat.length === 0){
        return NextResponse.json(mockPlaces) ; 
    }



    return NextResponse.json(mockPlaces.filter(item => cat.includes(item.category)));
   
}
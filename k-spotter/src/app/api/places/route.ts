import { mockPlaces } from "@/lib/mock/mockData";
import { NextResponse } from "next/server";

export async function POST(request : Request){

    const data = await request.json() ; 

    const {category} = data ; 
    
    
    const result = mockPlaces.filter(item => {
       
        return category[item.category]}) 

    
    return NextResponse.json(result);
}
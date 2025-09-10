import { buildURL } from "@/app/service/buildUrl";
import { NextRequest, NextResponse} from "next/server";


const ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/searchKeyword2";

export async function GET(req: NextRequest) {  


    const keyword = encodeURIComponent(req.nextUrl.searchParams.get("keyword") ?? "");
    
    const url =  buildURL({contentTypeId: "12",
        areaCode: "1",
        numOfRows: "20",
        pageNo: "1",
        arrange: "C",
        keyword 
    } ,  ENDPOINT)

 
    const r = await fetch(url, { cache: "no-store" }); 
    const raw = await r.json(); 
    const result = raw.response?.body?.items?.item;
    const items = Array.isArray(result) ? result : result ? [result] : [];
    return NextResponse.json(items) ;  



}
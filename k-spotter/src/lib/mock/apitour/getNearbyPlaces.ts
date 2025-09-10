type NearbyParams = {
    lat: number;
    lng: number;
    id : string 
    radius?: number;              // default 800
    cats?: Array<"food"|"cafe"|"attraction">;
    englishOnly?: boolean;
    sort?: "reco"|"distance";
    contentTypeId? : number[] ;
  };

export async function getNearbyPlaces({
    
    lat, lng, radius = 2000, cats = ["food","cafe","attraction"],
    englishOnly = false, sort = "reco", contentTypeId = [12], id 
  }: NearbyParams) {
    const qs = new URLSearchParams();
    qs.append("lat" ,String(lat))  ; 
    qs.append("lng" ,String(lng))  ; 
    qs.append("radius" ,String(radius))  ; 
    qs.append("englishOnly"  ,englishOnly ? "1" : "0")  ; 
    contentTypeId.forEach(item => qs.append("contentTypeId" , String(item))) ; 
    console.log(qs.toString());
    const res = await fetch(`/api/nearby?${qs.toString()}`); 

    const json =  res.json();
  

  
    if (!res.ok) throw new Error(`nearby ${res.status}`);

    return json; // Nearby[]
  }



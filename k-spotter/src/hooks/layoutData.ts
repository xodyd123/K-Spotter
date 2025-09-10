"use client"

import { useRef, useState } from "react";
import { Home , NearbyPlace, DetailPlace} from "../../type/type";

export const useLayoutDetail = () => {

    const [index , setIndex] = useState<"0" | "1" | "2">("0") ; 

    const homeRef = useRef<null | Home>(null) ; 

    const nearbyPlaceRef = useRef<null | NearbyPlace>(null) ; 

    const detailRef = useRef<null | DetailPlace> (null) ;

    return {index , setIndex , homeRef , nearbyPlaceRef , detailRef} ;  

} 
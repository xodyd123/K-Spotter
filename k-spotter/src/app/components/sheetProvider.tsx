"use client"

import { createContext,  useContext, useMemo } from "react";

type SheetTsx = {close : () => void };
const Ctx = createContext<SheetTsx|null>(null) ;

export const useSheet = () => {
    const v = useContext(Ctx) ;

    if(!v) throw new Error("에러 발생") ; 
    return v ; 
}


export const  SheetProvider = ({children , onclose} : {children: React.ReactNode ; 
    onclose : () => void}
)  => {
        const value = useMemo(() => ({close : onclose}) , [onclose]) 
        return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}


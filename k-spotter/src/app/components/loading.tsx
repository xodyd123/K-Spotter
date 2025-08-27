import { Suspense } from "react";

export default function LoadingPage(){


    return(
        <Suspense fallback=<LoadingPage/> >

        </Suspense>
    )
}
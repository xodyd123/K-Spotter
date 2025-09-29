export async function GetKeywordSearch({keyword} : {keyword : string}){

   const sp =  new URLSearchParams();; 

   sp.append("keyword" , keyword) ;  

   
   const result =  await fetch(`/api/keyword?${sp}`) ; 
   
   const r = await result.json();   

   return r ; 
}
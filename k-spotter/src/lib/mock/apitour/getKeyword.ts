export async function GetKeywordSearch({keyword} : {keyword : string}){

   const sp =  new URLSearchParams();; 

   sp.append("keyword" , keyword) ; 

   const result =  await fetch(`/api/keyword?${sp}`) ; 

   return result.json() ; 

}
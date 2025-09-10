export async function SearchImage({title} : {title :string}){

    const r = await fetch(
        `/api/images?keyword=${encodeURIComponent(title)}`,
      );

      const result = r.json(); 

      return result ; 
       
}
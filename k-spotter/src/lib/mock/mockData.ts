import { category, Place } from "../../../type/type";

export const mockPlaces: Place[] = [
    {
        id: "101",
        lat: 37.5512,
        lng: 126.9882,
        title: "남산서울타워",
        imageUrl: "/images/namsan.jpg",
        category: category.DRAMA,
      },
      {
        id: "102",
        lat: 37.5826,
        lng: 126.9830,
        title: "북촌한옥마을",
        imageUrl: "/images/bukchon.jpg",
        category: category.DRAMA,
      },
      {
        id: "103",
        lat: 37.5796,
        lng: 126.9770,
        title: "경복궁",
        imageUrl: "/images/gyeongbokgung.jpg",
        category: category.MOVIE,
      },
      {
        id: "104",
        lat: 37.5110,
        lng: 127.0592,
        title: "별마당도서관",
        imageUrl: "/images/starfield_library.jpg",
        category: category.MUSIC,
      },
      {
        id: "105",
        lat: 37.5349,
        lng: 126.9947,
        title: "이태원 경리단길",
        imageUrl: "/images/itaewon.jpg",
        category: category.MUSIC,
      },
  ];
  
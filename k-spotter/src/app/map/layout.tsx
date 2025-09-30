import KakaoSDK from "../components/kakaoSdk";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KakaoSDK />
      {children}
    </>
  );
}

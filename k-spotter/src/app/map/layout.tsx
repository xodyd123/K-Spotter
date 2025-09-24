import KakaoSDK from "../components/kakaoSdk";
import Providers from "../provider";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KakaoSDK />

      <Providers>{children}</Providers>
    </>
  );
}

// app/layout.tsx

import KakaoSDK from "./components/kakaoSdk";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <KakaoSDK/>
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

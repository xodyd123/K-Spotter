// app/layout.tsx

import KakaoSDK from "../components/kakaoSdk";
import "../globals.css"; 
import Providers from "../provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <KakaoSDK/>
      </head>
      <body style={{ margin: 0 }}>
       <Providers>
       {children}
       </Providers> 
      
      </body>
    </html>
  );
}
// src/types/kakao.d.ts
export {};

declare global {
  // 런타임 전역 접근(옵셔널)
  interface Window {
    kakao?: typeof kakao;
  }

  // ✅ 타입 전역 네임스페이스 선언
  namespace kakao {
    namespace maps {
      function load(cb: () => void): void;

      class LatLng {
        constructor(lat: number, lng: number);
      }

      class Map {
        constructor(
          container: HTMLElement,
          opts: { center: LatLng; level?: number }
        );
        setCenter(latlng: LatLng): void;
        setLevel(level: number): void;
        panTo(latlng: LatLng): void;
      }

      class Marker {
        constructor(opts: { position: LatLng; map?: Map; title?: string });
        setMap(map: Map | null): void;
        getPosition(): LatLng;
      }

      class InfoWindow {
        constructor(opts: { content: string | HTMLElement; position?: LatLng; removable?: boolean });
        open(map: Map, marker?: Marker): void;
        close(): void;
      }

      const event: {
        addListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
        removeListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
      };
    }
  }
}

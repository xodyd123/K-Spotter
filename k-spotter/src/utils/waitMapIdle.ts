
export function waitMapIdle(map: any, timeout = 800): Promise<void> {
    return new Promise<void>((resolve) => {
      // SSR/지도 미초기화 안전 처리
      if (!map || !(window as any).kakao?.maps) return resolve();
  
      const { kakao } = window as any;
      let done = false;
  
      const finish = () => {
        if (done) return;
        done = true;
        kakao.maps.event.removeListener(map, 'idle', onIdle);
        clearTimeout(tid);
        resolve();
      };
  
      const onIdle = () => finish();
      const tid = window.setTimeout(finish, timeout); // 폴백(타임아웃)
      kakao.maps.event.addListener(map, 'idle', onIdle);
    });
  }
  
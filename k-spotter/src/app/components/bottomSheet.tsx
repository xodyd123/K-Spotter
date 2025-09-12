'use client';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  Children,
} from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NearbyPlace, Place, PlaceM } from '../../../type/type';
import MarkerDetail from './markerDetail';

export type SheetState = 'closed' | 'peek' | 'half' | 'full';

// ref로 노출할 핸들
export type SheetHandle = {
  open: (to?: SheetState) => Promise<void>;
  close: (to?: SheetState) => Promise<void>;
  getHeight: () => number;
};

// children 허용
type BottomSheetProps = React.PropsWithChildren<{
  selected: PlaceM | null 
  sheet: SheetState;
  setSheet: Dispatch<SetStateAction<SheetState>>;
  yOverride?: string | null; // 외부 보정(px 문자열) - 선택
  onSelectNearby  : (n: NearbyPlace) => Promise<void>
}>;

const BottomSheet = forwardRef<SheetHandle, BottomSheetProps>(function BottomSheet(
  { selected, sheet, setSheet, yOverride, onSelectNearby }: BottomSheetProps,
  ref
) {
  

  // 시트가 닫혀있지 않으면 오버레이/시트 표시
  const isOpen = sheet !== 'closed';

  // ---------------- SSR 안전한 스냅 (CSS 단위) ----------------
  const SHEET_DVH = 100; // 전체 시트 높이
  const HALF_DVH = 55;   // half 노출 높이
  const PEEK_PX = 80;    // peek 노출 높이

  const snapToYCss = (open: boolean, s: SheetState): string => {
    if (!open || s === 'closed') return '100%';
    if (s === 'peek') return `calc(${SHEET_DVH}dvh - ${PEEK_PX}px)`;
    if (s === 'half') return `calc(${SHEET_DVH}dvh - ${HALF_DVH}dvh)`;
    return '0px'; // full
  };

  // ---------------- 마운트 후 px 기반 드래그 ----------------
  const [mounted, setMounted] = useState(false);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    setMounted(true);
    const upd = () => setVh(window.innerHeight);
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  // px 앵커 계산 (마운트 후에만 의미 있음)
  const anchors = useMemo(() => {
    const SHEET_PX = Math.round((vh * SHEET_DVH) / 100);
    const HALF_PX = Math.round((vh * HALF_DVH) / 100);
    return {
      SHEET_PX,
      full: 0,
      half: SHEET_PX - HALF_PX,
      peek: SHEET_PX - PEEK_PX,
      closed: SHEET_PX,
    };
  }, [vh]);

  const anchorFor = useCallback(
    (s: SheetState) => (mounted ? anchors[s] : 0),
    [anchors, mounted]
  );

  const yOverridePx = useMemo(() => {
    if (!mounted || !yOverride) return null;
    return yOverride.endsWith('px') ? parseFloat(yOverride) : null;
  }, [mounted, yOverride]);

  // 드래그 미리보기
  const [dragY, setDragY] = useState<number | null>(null);
  const startY = useRef<number | null>(null);
  const startBaseY = useRef<number>(0);

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const currentBaseY = useMemo(() => {
    if (!mounted) return 0; // 마운트 전에는 사용하지 않음
    if (dragY != null) return dragY;
    if (yOverridePx != null) return yOverridePx;
    return anchorFor(sheet);
  }, [mounted, dragY, yOverridePx, sheet, anchorFor]);

  // 포인터: 마운트 후에만 활성화 (SSR와 첫 렌더 일치 보장)
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!mounted) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      startY.current = e.clientY;
      startBaseY.current = currentBaseY;
    },
    [mounted, currentBaseY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!mounted || startY.current == null) return;
      const dy = startY.current - e.clientY; // 위로 양수
      const next = clamp(startBaseY.current - dy, 0, anchors.SHEET_PX);
      setDragY(next);
    },
    [mounted, anchors.SHEET_PX]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!mounted) return;
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (startY.current == null) {
        setDragY(null);
        return;
      }

      const finalY = dragY ?? currentBaseY;
      const candidates: Array<{ s: SheetState; y: number }> = [
        { s: 'full', y: anchors.full },
        { s: 'half', y: anchors.half },
        { s: 'peek', y: anchors.peek },
        { s: 'closed', y: anchors.closed },
      ];
      let best = candidates[0];
      for (const c of candidates) {
        if (Math.abs(c.y - finalY) < Math.abs(best.y - finalY)) best = c;
      }
      setSheet(best.s);

      startY.current = null;
      setDragY(null);
    },
    [mounted, anchors.full, anchors.half, anchors.peek, anchors.closed, dragY, currentBaseY, setSheet]
  );

  const onPointerCancel = useCallback(() => {
    startY.current = null;
    setDragY(null);
  }, []);

  // ---------------- ref 명령형 API (transitionend까지 대기) ----------------
  const rootRef = useRef<HTMLDivElement>(null);

  const waitTransitionEnd = (timeout = 400) =>
    new Promise<void>((resolve) => {
      const el = rootRef.current;
      if (!el) return resolve();
      const tid = setTimeout(resolve, timeout); // 폴백
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== el) return;
        if (e.propertyName && e.propertyName !== 'transform') return;
        clearTimeout(tid);
        resolve();
      };
      el.addEventListener('transitionend', onEnd, { once: true });
    });

  const change = useCallback(async (to: SheetState) => {

    // 다음 프레임에 상태 반영 → transition 확실히 시작
    await new Promise<void>((r) =>
      requestAnimationFrame(() => {
        setSheet(to);
        r();
      })
    );
    await waitTransitionEnd();
   
  } , [setSheet]);

  useImperativeHandle(
    ref,
    () => ({
      open: (to = 'half') => change(to),
      close: (to = 'closed') => change(to),
      getHeight: () => rootRef.current?.offsetHeight ?? 0,
    }),
    [change]
  );

  // ---------------- 렌더: SSR/클라이언트 일치 보장 ----------------
  const cssY = snapToYCss(isOpen, sheet); // 마운트 전: CSS 단위 문자열
  const pxY = mounted ? (dragY ?? yOverridePx ?? anchorFor(sheet)) : 0; // 마운트 후: px 숫자

  const styleTransform = mounted
    ? `translateX(-50%) translateY(${pxY}px)`
    : `translateX(-50%) translateY(${cssY})`;

  return (
    <>
      {/* 오버레이는 시트가 닫혀있지 않을 때만 표시 */}
      <div
        className={[
          'fixed inset-0 z-30 bg-black/40 transition-opacity pointer-events-none',
          isOpen ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden
      />

      <div
        ref={rootRef}
        role="dialog"
        aria-modal
        className="fixed left-1/2 bottom-0 z-40 w-[min(100%,720px)]
                   rounded-t-2xl bg-white shadow-xl overflow-hidden
                   transition-transform duration-200 ease-out will-change-transform
                   pointer-events-auto"
        style={{
          height: `${SHEET_DVH}dvh`,
          transform: styleTransform,
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          touchAction: 'pan-y',
        }}
      >
        {/* Grip */}
        <div
          className="flex items-center justify-center py-2 [touch-action:none] cursor-grab active:cursor-grabbing select-none"
          onPointerDown={mounted && isOpen ? onPointerDown : undefined}
          onPointerMove={mounted && isOpen ? onPointerMove : undefined}
          onPointerUp={mounted && isOpen ? onPointerUp : undefined}
          onPointerCancel={mounted && isOpen ? onPointerCancel : undefined}
          aria-label="위로 스와이프하여 펼치기"
          {...(mounted ? { 'aria-valuenow': Math.round(pxY) } : {})}
        >
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* 스크롤 컨테이너: 점프 방지 */}
        <div className="h-[calc(100%-40px)] overflow-y-auto [overflow-anchor:none]">
          {/* 선택된 장소가 있으면 상세, 없으면 children(예: Nearby 리스트) */}
          {selected && <MarkerDetail item={selected} onSelectNearby ={onSelectNearby} />}
        </div>
      </div>
    </>
  );
});

BottomSheet.displayName = 'BottomSheet';
export default BottomSheet;

"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { SheetView } from "../../type/type";


export type SheetState = "closed" | "peek" | "half" | "full";

type Options = {
  sheet: SheetState; // ✅ 제어형 상태 (원래 컴포넌트와 동일)
  setSheet: Dispatch<SetStateAction<SheetState>>;
  yOverride?: string | null; // 외부 보정(px 문자열)
  snap?: { SHEET_DVH?: number; HALF_DVH?: number; PEEK_PX?: number }; // 스냅 커스터마이즈(선택);
 // bottomView : SheetView
};

// ref로 노출할 핸들
export type SheetHandle = {
  open: (to?: SheetState) => Promise<void>;
  close: (to?: SheetState) => Promise<void>;
  getHeight: () => number;
};

export function useBottomSheet({ sheet, setSheet, yOverride, snap  }: Options) {
  // ---------------- SSR 안전한 스냅 (CSS 단위) ----------------
  const SHEET_DVH = 100; // 전체 시트 높이
  const HALF_DVH = 55; // half 노출 높이
  const PEEK_PX = 80; // peek 노출 높이
  // 시트가 닫혀있지 않으면 오버레이/시트 표시
  const isOpen = sheet !== "closed";

  // SSR 안전: 첫 렌더에선 CSS d**vh 기반 문자열, 마운트 후 px로 계산
  const [mounted, setMounted] = useState(false);
  const [vh, setVh] = useState(0);


  useEffect(() => {
    setMounted(true);
    const upd = () => setVh(window.innerHeight);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const snapToYCss = (open: boolean, s: SheetState): string => {
    if (!open || s === "closed") return "100%";
    if (s === "peek") return `calc(${SHEET_DVH}dvh - ${PEEK_PX}px)`;
    if (s === "half") return `calc(${SHEET_DVH}dvh - ${HALF_DVH}dvh)`;
    return "0px"; // full
  };

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
    return yOverride.endsWith("px") ? parseFloat(yOverride) : null;
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
      if (el.hasPointerCapture?.(e.pointerId))
        el.releasePointerCapture(e.pointerId);
      if (startY.current == null) {
        setDragY(null);
        return;
      }

      const finalY = dragY ?? currentBaseY;
      const candidates: Array<{ s: SheetState; y: number }> = [
        { s: "full", y: anchors.full },
        { s: "half", y: anchors.half },
        { s: "peek", y: anchors.peek },
        { s: "closed", y: anchors.closed },
      ];
      let best = candidates[0];
      for (const c of candidates) {
        if (Math.abs(c.y - finalY) < Math.abs(best.y - finalY)) best = c;
      }
      setSheet(best.s);

      startY.current = null;
      setDragY(null);
    },
    [
      mounted,
      anchors.full,
      anchors.half,
      anchors.peek,
      anchors.closed,
      dragY,
      currentBaseY,
      setSheet,
    ]
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
        if (e.propertyName && e.propertyName !== "transform") return;
        clearTimeout(tid);
        resolve();
      };
      el.addEventListener("transitionend", onEnd, { once: true });
    });

  const change = useCallback(
    async (to: SheetState) => {
      // 다음 프레임에 상태 반영 → transition 확실히 시작
      await new Promise<void>((r) =>
        requestAnimationFrame(() => {
          //openDetail(item)
        //   if(to === "half" && bottomView.kind === "summaryPlaces")
        //      openDetail(bottomView.item) ;
        //  else {
        //     closeAll()
        //  } 
          setSheet(to);
          r();
        })
      );
     
     await waitTransitionEnd();

    },
    [setSheet]
  );

  const open  = useCallback((to: SheetState = 'half')   => change(to), [change]);
  const close = useCallback((to: SheetState = 'closed') => change(to), [change]);
  const getHeight = useCallback(() => rootRef.current?.offsetHeight ?? 0, []);



  // ---------------- 렌더: SSR/클라이언트 일치 보장 ----------------
  const cssY = snapToYCss(isOpen, sheet); // 마운트 전: CSS 단위 문자열
  const pxY = mounted ? dragY ?? yOverridePx ?? anchorFor(sheet) : 0; // 마운트 후: px 숫자

  const containerStyle = useMemo(() => ({
    height: `${SHEET_DVH}dvh`,
    transform: mounted
      ? `translateX(-50%) translateY(${pxY}px)`
      : `translateX(-50%) translateY(${cssY})`,
    paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
    touchAction: 'pan-y' as const,
  }), [SHEET_DVH, mounted, pxY, cssY]);

  const gripHandlers = mounted && isOpen
  ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
  : {};

  return {
    // 상태
    sheet, setSheet, isOpen,
    // refs & 스타일
    rootRef, containerStyle,
    // 입력 핸들러 (Grip에 바인딩)
    gripHandlers,
    // 유틸
    pxY, anchors,
    // 명령형 API
    open, close, getHeight,
  };
}
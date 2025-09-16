"use client";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  Children,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NearbyPlace, Place, PlaceM } from "../../../type/type";
import MarkerDetail from "./markerDetail";
import { useBottomSheet } from "@/hooks/useBottomSheet";

export type SheetState = "closed" | "peek" | "half" | "full";

// ref로 노출할 핸들
export type SheetHandle = {
  open: (to?: SheetState) => Promise<void>;
  close: (to?: SheetState) => Promise<void>;
  getHeight: () => number;
};

// children 허용
type BottomSheetProps = React.PropsWithChildren<{
  selected: PlaceM | null;
  sheet: SheetState;
  setSheet: Dispatch<SetStateAction<SheetState>>;
  yOverride?: string | null; // 외부 보정(px 문자열) - 선택
  onSelectNearby: (n: NearbyPlace) => Promise<void>;
}>;

const BottomSheet = forwardRef<SheetHandle, BottomSheetProps>(
  function BottomSheet(
    { selected, sheet, setSheet, yOverride, onSelectNearby }: BottomSheetProps,
    ref
  ) {
    const {
      isOpen,
      rootRef,
      containerStyle,
      gripHandlers,
      pxY,
      open,
      close,
      getHeight,
    } = useBottomSheet({ sheet, setSheet, yOverride });

    useImperativeHandle(
      ref,
      () => ({
        open , close , getHeight
      }),
      [open , close , getHeight]
    );
    return (
      <>
        {/* Overlay */}
        <div
          className={[
            'fixed inset-0 z-30 bg-black/40 transition-opacity pointer-events-none',
            isOpen ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-hidden
        />
  
        {/* Sheet */}
        <div
          ref={rootRef}
          role="dialog"
          aria-modal
          className="fixed left-1/2 bottom-0 z-40 w-[min(100%,720px)]
                     rounded-t-2xl bg-white shadow-xl overflow-hidden
                     transition-transform duration-200 ease-out will-change-transform
                     pointer-events-auto"
          style={containerStyle}
          {...({ 'aria-valuenow': Math.round(pxY) } as any)}
        >
          {/* Grip */}
          <div
            className="flex items-center justify-center py-2 [touch-action:none] cursor-grab active:cursor-grabbing select-none"
            {...gripHandlers}
            aria-label="위로 스와이프하여 펼치기"
          >
            <div className="h-1.5 w-10 rounded-full bg-gray-300" />
          </div>
  
          {/* Content */}
          <div className="h-[calc(100%-40px)] overflow-y-auto [overflow-anchor:none]">
            {selected && (
              <MarkerDetail item={selected} onSelectNearby={onSelectNearby} sheet={sheet} setSheet={setSheet} />
            )}
          </div>
        </div>
      </>
    );
  });

BottomSheet.displayName = "BottomSheet";
export default BottomSheet;

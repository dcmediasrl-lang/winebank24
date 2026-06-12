"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Check, X, CropIcon } from "lucide-react";

interface Props {
  file: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

const VIEWPORT = 288; // square size in px

export function ImageCropper({ file, onCrop, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState("");
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNat({ w, h });
      const s = VIEWPORT / Math.min(w, h);
      setMinScale(s);
      setScale(s);
      setOffset(clamp(-(w * s - VIEWPORT) / 2, -(h * s - VIEWPORT) / 2, s, w, h));
      setImageSrc(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function clamp(x: number, y: number, s: number, w = nat.w, h = nat.h) {
    return {
      x: Math.min(0, Math.max(VIEWPORT - w * s, x)),
      y: Math.min(0, Math.max(VIEWPORT - h * s, y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset(clamp(
      drag.current.ox + e.clientX - drag.current.sx,
      drag.current.oy + e.clientY - drag.current.sy,
      scale,
    ));
  }

  function onPointerUp() { setDragging(false); }

  function applyScale(next: number) {
    const s = Math.max(minScale, Math.min(minScale * 4, next));
    // keep image center fixed
    const cx = (-offset.x + VIEWPORT / 2) / scale;
    const cy = (-offset.y + VIEWPORT / 2) / scale;
    setScale(s);
    setOffset(clamp(VIEWPORT / 2 - cx * s, VIEWPORT / 2 - cy * s, s));
  }

  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const OUT = 800;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropSide = VIEWPORT / scale;
    ctx.drawImage(img, cropX, cropY, cropSide, cropSide, 0, 0, OUT, OUT);
    canvas.toBlob(blob => {
      if (!blob) return;
      const name = file.name.replace(/\.[^.]+$/, "") + "_1x1.jpg";
      onCrop(new File([blob], name, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  const gridLine = `rgba(255,255,255,0.18) 1px, transparent 1px`;

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a0f0f] rounded-2xl border border-white/15 shadow-2xl p-5 w-full max-w-xs space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <CropIcon className="w-4 h-4 text-amber-400" />
          <div>
            <p className="font-semibold text-white text-sm">Ritaglia foto 1:1</p>
            <p className="text-xs text-white/40">Trascina per posizionare · scorri per zoomare</p>
          </div>
        </div>

        {/* Viewport */}
        <div
          className="relative mx-auto overflow-hidden rounded-xl bg-black"
          style={{
            width: VIEWPORT,
            height: VIEWPORT,
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={e => { e.preventDefault(); applyScale(scale * (e.deltaY < 0 ? 1.08 : 0.93)); }}
        >
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="crop preview"
              src={imageSrc}
              style={{
                position: "absolute",
                width: nat.w * scale,
                height: nat.h * scale,
                left: offset.x,
                top: offset.y,
                userSelect: "none",
                pointerEvents: "none",
                display: "block",
              }}
            />
          )}
          {/* Rule-of-thirds grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${gridLine}), linear-gradient(90deg, ${gridLine})`,
              backgroundSize: `${VIEWPORT / 3}px ${VIEWPORT / 3}px`,
            }}
          />
          {/* Amber border */}
          <div className="absolute inset-0 border-2 border-amber-400/70 rounded-xl pointer-events-none" />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => applyScale(scale / 1.15)} className="text-white/50 hover:text-white transition-colors shrink-0">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={0.001}
            value={scale}
            onChange={e => applyScale(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500 h-1.5"
          />
          <button type="button" onClick={() => applyScale(scale * 1.15)} className="text-white/50 hover:text-white transition-colors shrink-0">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel}
            className="flex-1 text-white/60 hover:text-white border border-white/15">
            <X className="w-4 h-4 mr-1.5" />
            Annulla
          </Button>
          <Button type="button" onClick={confirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
            <Check className="w-4 h-4 mr-1.5" />
            Conferma
          </Button>
        </div>
      </div>
    </div>
  );
}

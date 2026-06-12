"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageCropper } from "./image-cropper";

const MAX_FILES = 4;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/heic";

export interface UploadedImage {
  url: string;
  previewUrl: string;
  file?: File;
  uploading?: boolean;
  error?: string;
}

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

export function BottleImageUploader({ images, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  // Called when user picks files — push them into the crop queue
  function enqueueFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const remaining = MAX_FILES - images.length - cropQueue.length;
    if (remaining <= 0) {
      toast.error(`Puoi caricare al massimo ${MAX_FILES} immagini`);
      return;
    }
    const toAdd = arr.slice(0, remaining);
    setCropQueue(prev => [...prev, ...toAdd]);
  }

  // Crop confirmed — upload the cropped file, advance the queue
  function handleCropDone(croppedFile: File) {
    setCropQueue(prev => prev.slice(1));

    const newImage: UploadedImage = {
      url: "",
      previewUrl: URL.createObjectURL(croppedFile),
      file: croppedFile,
      uploading: false,
    };
    const updated = [...images, newImage];
    onChange(updated);
    uploadOne(updated, updated.length - 1);
  }

  // Crop cancelled — skip this file, advance the queue
  function handleCropCancel() {
    setCropQueue(prev => prev.slice(1));
  }

  async function uploadOne(current: UploadedImage[], index: number) {
    const img = current[index];
    if (!img?.file || img.url) return;

    let state = current.map((m, i) => i === index ? { ...m, uploading: true } : m);
    onChange([...state]);

    try {
      const fd = new FormData();
      fd.append("files", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore upload");

      state = state.map((m, i) =>
        i === index ? { ...m, url: data.urls[0], uploading: false, file: undefined } : m
      );
      onChange([...state]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore";
      state = state.map((m, i) =>
        i === index ? { ...m, uploading: false, error: msg } : m
      );
      onChange([...state]);
      toast.error(msg);
    }
  }

  function remove(index: number) {
    const img = images[index];
    if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  function moveToFront(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    enqueueFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, cropQueue]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const canAddMore = images.length + cropQueue.length < MAX_FILES && !disabled;

  return (
    <>
      {/* Crop modal — shown for the first file in the queue */}
      {cropQueue.length > 0 && (
        <ImageCropper
          file={cropQueue[0]}
          onCrop={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}

      <div className="space-y-3">
        {/* Preview grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div
                key={img.previewUrl}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 aspect-square bg-[#231515] group",
                  i === 0 ? "border-amber-400" : "border-white/10"
                )}
              >
                {img.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.previewUrl}
                    alt={`foto ${i + 1}`}
                    className={cn(
                      "w-full h-full object-cover transition-opacity",
                      img.uploading ? "opacity-40" : "opacity-100"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white/20" />
                  </div>
                )}

                {img.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {img.error && !img.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-950/80">
                    <span className="text-red-400 text-xs text-center px-1">Errore</span>
                  </div>
                )}

                {i === 0 && (
                  <div className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Cover
                  </div>
                )}

                {!img.uploading && !disabled && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {i !== 0 && (
                      <button type="button" onClick={() => moveToFront(i)}
                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-amber-100"
                        title="Imposta come cover">
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    )}
                    <button type="button" onClick={() => remove(i)}
                      className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-red-100"
                      title="Rimuovi">
                      <X className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Placeholder slots */}
            {Array.from({ length: MAX_FILES - images.length }).map((_, i) => (
              <div key={`ph-${i}`}
                className="aspect-square rounded-lg border-2 border-dashed border-white/10 bg-[#231515] flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white/20" />
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        {canAddMore && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
              dragging
                ? "border-amber-400 bg-amber-950/20"
                : "border-white/15 bg-[#231515] hover:border-amber-400 hover:bg-amber-950/10"
            )}
          >
            <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
            <p className="text-sm text-white/80 font-medium">
              {images.length === 0 ? "Carica la foto della bottiglia" : "Aggiungi altra foto"}
            </p>
            <p className="text-xs text-white/40 mt-1">
              JPG, PNG, WebP · max 8 MB · {images.length}/{MAX_FILES} foto
              {images.length === 0 && <span className="text-red-400 font-medium"> · obbligatoria</span>}
            </p>
            <p className="text-xs text-amber-400/60 mt-0.5">Verrà ritagliata automaticamente in formato 1:1</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={e => e.target.files && enqueueFiles(e.target.files)}
        />

        <p className="text-xs text-white/40">
          {images.length === 0 ? (
            <span className="text-red-400">⚠ Almeno 1 foto è obbligatoria (contratto A.1)</span>
          ) : images[0]?.uploading ? (
            <span className="text-amber-400">Caricamento in corso…</span>
          ) : images.some(i => i.error) ? (
            <span className="text-red-400">Alcuni file hanno avuto errori. Rimuovili e riprova.</span>
          ) : (
            <span className="text-green-400">
              ✓ {images.filter(i => i.url).length} foto caricate
              {images.length > 1 && " · La prima è la copertina — clicca ★ per cambiarla"}
            </span>
          )}
        </p>
      </div>
    </>
  );
}

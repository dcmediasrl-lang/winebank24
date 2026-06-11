"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function InsuranceUploadForm({
  currentDocUrl,
  uploadedAt,
}: {
  currentDocUrl: string | null;
  uploadedAt: Date | null;
}) {
  const [docUrl, setDocUrl] = useState(currentDocUrl);
  const [uploadedDate, setUploadedDate] = useState(uploadedAt);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cantina/insurance", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocUrl(data.url);
      setUploadedDate(new Date());
      toast.success("Polizza caricata con successo");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/cantina/insurance", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocUrl(null);
      setUploadedDate(null);
      toast.success("Polizza rimossa");
    } catch {
      toast.error("Errore nella rimozione");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          Documento polizza
        </h3>

        {docUrl ? (
          <div className="bg-[#2a1010] rounded-xl border border-white/15 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {docUrl.split("/").pop() || "polizza.pdf"}
                </p>
                {uploadedDate && (
                  <p className="text-xs text-white/40">
                    Caricata il {new Date(uploadedDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visualizza
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={removing}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-900/30"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {removing ? "Rimozione..." : "Rimuovi"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="border-amber-700/40 text-amber-400 hover:bg-amber-900/20"
              >
                <Upload className="w-4 h-4 mr-1" />
                Aggiorna
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-900/5 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-white/70 mb-1">Clicca per caricare la polizza</p>
            <p className="text-xs text-white/40">PDF, JPG o PNG · max 20 MB</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />

        {uploading && (
          <p className="text-sm text-amber-400 text-center animate-pulse">Caricamento in corso...</p>
        )}
      </CardContent>
    </Card>
  );
}

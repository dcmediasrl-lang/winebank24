"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, BookmarkPlus, Wine } from "lucide-react";

type WishlistItem = {
  id: string;
  wineName: string;
  cantina: string | null;
  vintage: string | null;
  grape: string | null;
  maxPrice: { toString(): string } | null;
  notes: string | null;
  createdAt: Date;
};

interface WishlistManagerProps {
  initialItems: WishlistItem[];
}

export function WishlistManager({ initialItems }: WishlistManagerProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    wineName: "",
    cantina: "",
    vintage: "",
    grape: "",
    maxPrice: "",
    notes: "",
  });

  function resetForm() {
    setForm({ wineName: "", cantina: "", vintage: "", grape: "", maxPrice: "", notes: "" });
  }

  async function handleAdd() {
    if (!form.wineName.trim()) {
      toast.error("Il nome del vino è obbligatorio");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/collector/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineName: form.wineName.trim(),
          cantina: form.cantina.trim() || null,
          vintage: form.vintage.trim() || null,
          grape: form.grape.trim() || null,
          maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => [data, ...prev]);
      resetForm();
      setOpen(false);
      toast.success("Aggiunto alla wishlist");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/collector/wishlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Rimosso dalla wishlist");
    } catch {
      toast.error("Errore durante la rimozione");
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Aggiungi
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi alla wishlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nome vino *</Label>
              <Input
                value={form.wineName}
                onChange={(e) => setForm((f) => ({ ...f, wineName: e.target.value }))}
                placeholder="es. Barolo Riserva"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cantina</Label>
                <Input
                  value={form.cantina}
                  onChange={(e) => setForm((f) => ({ ...f, cantina: e.target.value }))}
                  placeholder="es. Gaja"
                />
              </div>
              <div className="space-y-1">
                <Label>Annata</Label>
                <Input
                  value={form.vintage}
                  onChange={(e) => setForm((f) => ({ ...f, vintage: e.target.value }))}
                  placeholder="es. 2015"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Vitigno</Label>
                <Input
                  value={form.grape}
                  onChange={(e) => setForm((f) => ({ ...f, grape: e.target.value }))}
                  placeholder="es. Nebbiolo"
                />
              </div>
              <div className="space-y-1">
                <Label>Prezzo max (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxPrice}
                  onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Altre informazioni..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleAdd}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
              >
                {loading ? "Salvataggio..." : "Aggiungi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <BookmarkPlus className="w-12 h-12 mx-auto mb-4 text-stone-300" />
          <p className="text-lg">La tua wishlist è vuota</p>
          <p className="text-sm mt-2">Aggiungi i vini che stai cercando</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 pr-12">
                <CardTitle className="text-base font-semibold leading-tight flex items-center gap-2">
                  <Wine className="w-4 h-4 text-amber-500 shrink-0" />
                  {item.wineName}
                </CardTitle>
                {item.cantina && (
                  <p className="text-xs text-stone-500">{item.cantina}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {item.vintage && (
                    <Badge variant="outline" className="text-xs">{item.vintage}</Badge>
                  )}
                  {item.grape && (
                    <Badge variant="secondary" className="text-xs">{item.grape}</Badge>
                  )}
                  {item.maxPrice && (
                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                      max € {Number(item.maxPrice).toFixed(2)}
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-stone-500 line-clamp-2">{item.notes}</p>
                )}
                <p className="text-xs text-stone-400">
                  {new Date(item.createdAt).toLocaleDateString("it-IT")}
                </p>
              </CardContent>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7 text-stone-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

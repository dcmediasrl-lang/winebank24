"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "lucide-react";
import Image from "next/image";

type ProfileUser = {
  username: string | null;
  avatarUrl: string | null;
};

export function ProfileSettings({ user }: { user: ProfileUser }) {
  const [username, setUsername] = useState(user.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profilo aggiornato con successo");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-5 h-5 text-amber-500" />
          Profilo pubblico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {avatarUrl && (
          <div className="flex justify-center">
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-amber-200"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="il_tuo_username"
            maxLength={20}
          />
          <p className="text-xs text-stone-400">3-20 caratteri: lettere, numeri e underscore</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="avatarUrl">URL Avatar</Label>
          <Input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-stone-400">Inserisci un URL immagine pubblico</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
        >
          {loading ? "Salvataggio..." : "Salva profilo"}
        </Button>
      </CardContent>
    </Card>
  );
}

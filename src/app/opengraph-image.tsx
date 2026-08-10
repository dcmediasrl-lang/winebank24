import { ImageResponse } from "next/og";

/**
 * Anteprima mostrata quando il sito viene condiviso (WhatsApp, LinkedIn,
 * social, messaggistica). Senza, i link appaiono spogli e vengono aperti meno.
 * Generata dal server: nessun file immagine da mantenere aggiornato.
 */
export const runtime = "edge";
export const alt = "Wine Bank 24 — Bottiglie da collezione con proprietà certificata";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #13110C 0%, #2A1010 55%, #4A1512 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#FFFFFF", letterSpacing: -0.5 }}>
            Wine
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#E4736C", letterSpacing: -0.5 }}>
            Bank 24
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 900,
              display: "flex",
            }}
          >
            Bottiglie da collezione con proprietà certificata
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.62)", maxWidth: 820, display: "flex", lineHeight: 1.35 }}>
            Provenienza documentata, autenticità verificata, custodia in cantina
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 3, background: "#A21C19", display: "flex" }} />
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", display: "flex" }}>
            app.winebank24.eu
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

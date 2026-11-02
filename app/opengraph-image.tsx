import { ImageResponse } from "next/og";

export const alt = "HHES Kenya: digital quarterly lesson book ordering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0a67a8 0%, #08507f 100%)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0a67a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>HHES Kenya</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 980 }}>The new digital standard for quarterly book orders.</div>
          <div style={{ fontSize: 34, opacity: 0.9 }}>Order, pay with M-Pesa and track lesson books online.</div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.8 }}>Home Health Education Service · SDA Church-affiliated</div>
      </div>
    ),
    { ...size },
  );
}
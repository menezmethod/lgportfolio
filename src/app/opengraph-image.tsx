import { ImageResponse } from "next/og";

export const alt = "Luis Gimenez, software engineer, platform and reliability";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf9f6",
          color: "#14151a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, color: "#5a5d66", textTransform: "uppercase" }}>
          Software engineer / Platform + reliability / Tampa Bay, FL
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: 168, fontWeight: 600, letterSpacing: -8, lineHeight: 0.95 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>Luis</span>
            <span>Gimenez</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 34, background: "#ff5a1f", marginLeft: 12, marginBottom: 22 }} />
        </div>
        <div style={{ fontSize: 30, color: "#3c3f47" }}>
          Go services, telemetry, and release paths. gimenez.dev
        </div>
      </div>
    ),
    size,
  );
}

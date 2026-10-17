import { ImageResponse } from "next/og";

/** Shared 1200x630 Open Graph card: light theme, mono eyebrow, big title with the orange dot. */
export function renderOg(eyebrow: string, title: string) {
  const long = title.length > 26;
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
        <div style={{ fontSize: 24, letterSpacing: 4, color: "#5a5d66", textTransform: "uppercase" }}>{eyebrow}</div>
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: long ? 88 : 132, fontWeight: 600, letterSpacing: -5, lineHeight: 1.0 }}>
          <div style={{ display: "flex", maxWidth: 1000 }}>{title}</div>
          <div style={{ width: 28, height: 28, borderRadius: 28, background: "#ff5a1f", marginLeft: 12, marginBottom: 14 }} />
        </div>
        <div style={{ fontSize: 30, color: "#3c3f47" }}>Luis Gimenez / gimenez.dev</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

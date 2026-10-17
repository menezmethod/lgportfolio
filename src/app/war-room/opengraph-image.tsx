import { renderOg } from "@/lib/og";

export const alt = "War room: Live telemetry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg("War room", "Live telemetry");
}

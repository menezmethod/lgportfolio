import { renderOg } from "@/lib/og";

export const alt = "Privacy: What this site collects";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg("Privacy", "What this site collects");
}

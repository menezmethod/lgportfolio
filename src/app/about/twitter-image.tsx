import { renderOg } from "@/lib/og";

export const alt = "About: Software engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg("About", "Software engineer");
}

import { renderOg } from "@/lib/og";

export const alt = "Contact: Open to roles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg("Contact", "Open to roles");
}

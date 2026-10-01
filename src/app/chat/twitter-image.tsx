import { renderOg } from "@/lib/og";

export const alt = "Chat: Ask the assistant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg("Chat", "Ask the assistant");
}

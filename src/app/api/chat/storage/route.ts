import { isFirestoreConfigured } from "@/lib/firestore";

export const dynamic = "force-dynamic";

/** Tells the chat page whether chats and emails are actually saved. Boolean only, no secrets. */
export async function GET() {
  return Response.json({ storage: isFirestoreConfigured() }, { headers: { "Cache-Control": "no-store" } });
}

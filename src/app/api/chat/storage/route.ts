import { activeChatProviderIds } from "@/lib/chat-provider-env";
import { isFirestoreConfigured } from "@/lib/firestore";

export const dynamic = "force-dynamic";

/** Tells the chat page whether chats are saved and which providers generate answers. Booleans and provider names only, no secrets. */
export async function GET() {
  return Response.json({ storage: isFirestoreConfigured(), providers: activeChatProviderIds() }, { headers: { "Cache-Control": "no-store" } });
}

import { activeChatProviderIds } from "@/lib/chat-provider-env";
import { isFirestoreConfigured } from "@/lib/firestore";
import { getChatLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Tells the chat page whether chats are saved and which providers generate answers, and the effective limits (maxMessagesPerSession, maxRpmPerIp, dailyBudget). Booleans and provider names only, no secrets. */
export async function GET() {
  return Response.json({ storage: isFirestoreConfigured(), providers: activeChatProviderIds(), ...getChatLimits() }, { headers: { "Cache-Control": "no-store" } });
}

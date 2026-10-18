/**
 * Adds Cloudflare's own visitor data to the requests that feed visit digests
 * (/api/analytics/*, /api/chat), then forwards them unchanged to the origin:
 *   x-visitor-ip, x-visitor-city, x-visitor-region, x-visitor-country, x-visitor-asorg
 * Any client-sent x-visitor-* header is replaced or removed, so it cannot be spoofed
 * on these routes. If anything here throws, the request goes to the origin as-is.
 */
const FIELDS: Array<[string, (r: Request) => unknown]> = [
  ["x-visitor-ip", (r) => r.headers.get("cf-connecting-ip")],
  ["x-visitor-city", (r) => r.cf?.city],
  ["x-visitor-region", (r) => r.cf?.region],
  ["x-visitor-country", (r) => r.cf?.country],
  ["x-visitor-asorg", (r) => r.cf?.asOrganization],
];

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    ctx.passThroughOnException();
    const headers = new Headers(request.headers);
    for (const [name, get] of FIELDS) {
      const value = get(request);
      if (typeof value === "string" && value) headers.set(name, value.slice(0, 80));
      else headers.delete(name);
    }
    return fetch(new Request(request, { headers }));
  },
} satisfies ExportedHandler;

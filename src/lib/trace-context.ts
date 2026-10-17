/**
 * Extract trace ID from incoming request for Cloud Logging / Cloud Trace correlation.
 * Cloud Run sets X-Cloud-Trace-Context (TRACE_ID/SPAN_ID;o=OPTIONS) or W3C traceparent.
 * When our logs include this trace ID via logging.googleapis.com/trace, they appear
 * in the Trace UI and Logs Explorer under the same trace.
 */

export function getTraceIdFromRequest(req: Request): string | null {
  // Google Cloud: X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=OPTIONS
  const cloudTrace = req.headers.get("x-cloud-trace-context");
  if (cloudTrace) {
    const traceId = cloudTrace.split("/")[0]?.trim();
    if (traceId) return traceId;
  }
  // W3C: traceparent: 00-TRACE_ID-SPAN_ID-01
  const traceparent = req.headers.get("traceparent");
  if (traceparent) {
    const parts = traceparent.split("-");
    if (parts.length >= 2) return parts[1] ?? null;
  }
  return null;
}

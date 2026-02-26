#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${CHAT_EVAL_BASE_URL:-http://localhost:3000}"
TOKEN="${CHAT_EVAL_TOKEN:-}"
MAX_CASES="${CHAT_EVAL_MAX_CASES:-6}"
INCLUDE_RESPONSES="${CHAT_EVAL_INCLUDE_RESPONSES:-false}"
CASE_IDS="${CHAT_EVAL_CASE_IDS:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --max-cases)
      MAX_CASES="$2"
      shift 2
      ;;
    --case-ids)
      CASE_IDS="$2"
      shift 2
      ;;
    --include-responses)
      INCLUDE_RESPONSES="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

PAYLOAD=$(
  MAX_CASES="$MAX_CASES" INCLUDE_RESPONSES="$INCLUDE_RESPONSES" CASE_IDS="$CASE_IDS" python3 - <<'PY'
import json
import os

max_cases = int(os.environ["MAX_CASES"])
include_responses = os.environ["INCLUDE_RESPONSES"].lower() == "true"
case_ids_raw = os.environ["CASE_IDS"].strip()

payload = {
    "maxCases": max_cases,
    "includeResponses": include_responses,
}

if case_ids_raw:
    payload["caseIds"] = [value.strip() for value in case_ids_raw.split(",") if value.strip()]

print(json.dumps(payload))
PY
)

RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$RESPONSE_FILE"' EXIT

CURL_ARGS=(
  -sS
  -X POST
  -H "Content-Type: application/json"
  -o "$RESPONSE_FILE"
  -w "%{http_code}"
  "${BASE_URL%/}/api/chat/eval"
  -d "$PAYLOAD"
)

if [[ -n "$TOKEN" ]]; then
  CURL_ARGS+=(-H "x-chat-eval-token: $TOKEN")
fi

HTTP_CODE="$(curl "${CURL_ARGS[@]}")"

echo "HTTP ${HTTP_CODE}"

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "422" ]]; then
  cat "$RESPONSE_FILE"
  exit 1
fi

python3 - "$RESPONSE_FILE" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as file:
    data = json.load(file)

summary = data.get("summary", {})
print(
    f"pass_rate={summary.get('passRate', 0)}% "
    f"passed={summary.get('passed', 0)}/{summary.get('total', 0)} "
    f"avg_latency_ms={summary.get('avgLatencyMs', 0)}"
)

failed = []
for case in data.get("cases", []):
    status = "PASS" if case.get("passed") else "FAIL"
    print(f"[{status}] {case.get('id')} ({case.get('category')})")
    if not case.get("passed"):
        failed.append(case.get("id"))
        for check in case.get("checks", []):
            if not check.get("passed"):
                print(f"  - {check.get('name')}: {check.get('reason')}")

if failed:
    print(f"Failed cases: {', '.join(failed)}", file=sys.stderr)
    sys.exit(2)
PY

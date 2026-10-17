#!/usr/bin/env bash
# Delete remote branches that are fully merged into main, plus known stale agent/deploy branches.
#
# Usage:
#   ./scripts/git-cleanup-stale-branches.sh          # dry-run (default)
#   ./scripts/git-cleanup-stale-branches.sh --apply  # delete on GitHub
#
# Requires: gh CLI authenticated for menezmethod/lgportfolio

set -euo pipefail

REPO="${GITHUB_REPO:-menezmethod/lgportfolio}"
BASE="${BASE_BRANCH:-main}"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

git fetch origin --prune

# Branches always safe to remove (deploy churn, duplicate default, agent scratch)
ALWAYS_DELETE=(
  master
  chore/trigger-deploy
  fix/env-redeploy
)

mapfile -t MERGED < <(git branch -r --merged "origin/$BASE" | sed 's/^[* ]*origin\///' | rg -v "^(HEAD -> $BASE|$BASE)$" || true)

mapfile -t CURSOR < <(gh api "repos/$REPO/branches?per_page=100" --jq '.[].name' | rg '^cursor/' || true)

declare -A SEEN=()
TO_DELETE=()

add_branch() {
  local b="$1"
  [[ -z "$b" || "$b" == "$BASE" ]] && return
  [[ -n "${SEEN[$b]:-}" ]] && return
  SEEN[$b]=1
  TO_DELETE+=("$b")
}

for b in "${ALWAYS_DELETE[@]}"; do add_branch "$b"; done
for b in "${MERGED[@]}"; do add_branch "$b"; done
for b in "${CURSOR[@]}"; do add_branch "$b"; done

if [[ ${#TO_DELETE[@]} -eq 0 ]]; then
  echo "Nothing to delete."
  exit 0
fi

echo "Branches targeted (${#TO_DELETE[@]}):"
printf '  %s\n' "${TO_DELETE[@]}"

if [[ "$APPLY" != true ]]; then
  echo
  echo "Dry-run only. Re-run with --apply to delete on GitHub."
  exit 0
fi

for b in "${TO_DELETE[@]}"; do
  if gh api -X DELETE "repos/$REPO/git/refs/heads/$b" >/dev/null 2>&1; then
    echo "deleted: $b"
  else
    echo "skip: $b (missing or protected)"
  fi
done

echo "Done. Enable delete_branch_on_merge in GitHub repo Settings → General if not already on."

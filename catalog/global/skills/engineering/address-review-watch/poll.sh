#!/usr/bin/env bash
label="${1:-agent-ready}"
interval="${2:-1800}"

me=$(glab api user 2>&1) && me=$(jq -r .username <<< "$me") || {
  echo "ERROR glab auth: $me"
  exit 1
}

declare -A seen
while true; do
  if response=$(glab api "projects/:fullpath/merge_requests?state=opened&author_username=$me&labels=$label&per_page=100" 2>&1); then
    while read -r iid branch; do
      [ -z "$iid" ] && continue
      [ -n "${seen[$iid]}" ] && continue
      seen[$iid]=1
      echo "MR !$iid $branch"
    done < <(jq -r '.[] | "\(.iid) \(.source_branch)"' <<< "$response")
  else
    echo "ERROR glab poll: $response"
  fi
  sleep "$interval"
done

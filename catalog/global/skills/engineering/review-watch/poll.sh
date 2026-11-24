#!/usr/bin/env bash
interval="${1:-1800}"
state_file="$HOME/.claude/state/review-watch.seen"
touch "$state_file"

me=$(glab api user 2>&1) && me=$(jq -r .username <<< "$me") || {
  echo "ERROR glab auth: $me"
  exit 1
}

list_mrs() {
  glab api "projects/:fullpath/merge_requests?state=opened&wip=no&$1=$me&per_page=100"
}

already_commented() {
  glab api "projects/:fullpath/merge_requests/$1/notes?per_page=100" \
    | jq -e --arg me "$me" 'any(.[]; .system == false and .author.username == $me)' > /dev/null
}

while true; do
  if reviewer=$(list_mrs reviewer_username 2>&1) && assignee=$(list_mrs assignee_username 2>&1); then
    while read -r iid sha branch; do
      [ -z "$iid" ] && continue
      grep -qx "$iid $sha" "$state_file" && continue
      first_sighting=true
      grep -q "^$iid " "$state_file" && first_sighting=false
      echo "$iid $sha" >> "$state_file"
      if $first_sighting && already_commented "$iid"; then
        continue
      fi
      echo "MR !$iid $branch $sha"
    done < <(jq -rs --arg me "$me" \
      'add | unique_by(.iid) | .[] | select(.author.username != $me) | "\(.iid) \(.sha) \(.source_branch)"' \
      <<< "$reviewer $assignee")
  else
    echo "ERROR glab poll: $reviewer $assignee"
  fi
  sleep "$interval"
done

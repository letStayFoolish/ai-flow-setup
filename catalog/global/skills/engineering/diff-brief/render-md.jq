# Markdown projection of data.json — for the MR. English, ~30 lines, no code bodies.
# Deterministic: never hand-write this output.

def live: map(select(.verdict != "rejected"));
def oftype($t): [.claims[] | select(.type == $t and .verdict != "rejected")] | sort_by(.order // 0);
def ref: (.anchors // [])[0] as $a
  | if $a == null or ($a.path // null) == null then ""
    else " — `\($a.path):\(($a.lines // [])[0] // "")`" end;
def plu($n; $w): "\($n) \($w)\(if $n == 1 then "" else "s" end)";
def para: (.text | gsub("\n"; " ") | gsub(" +"; " "));

. as $d
| $d.meta as $m
| [
  "## What changed",
  "",
  ( oftype("delta")
    | to_entries
    | if length == 0 then ["_No behaviour delta identified._"]
      else map("\(.key + 1). \(.value | para)\(.value | ref)") end
    | .[] ),
  "",
  ( oftype("flow") as $f
    | if ($f | length) == 0 then empty
      else ("## How it flows", "", "```text", ($f[0].text), "```", "") end
    | . ),
  ( [ oftype("coverage")[] | select(.text | test("did not find"; "i")) ] as $u
    | if ($u | length) == 0 then empty
      else ("## Not covered by tests", "", ($u[] | "- \(. | para)\(. | ref)"), "") end
    | . ),
  ( oftype("question") as $q
    | if ($q | length) == 0 then empty
      else ("## Questions", "", ($q[0:5][] | "- \(. | para)\(. | ref)"),
            (if ($q | length) > 5 then "- _…and \(($q | length) - 5) more in the HTML brief._" else empty end),
            "") end
    | . ),
  ( oftype("merge-danger") as $md
    | if ($md | length) == 0 then empty
      else ("## Merge danger", "", ($md[0].text), "") end
    | . ),
  "---",
  "",
  ([ plu((($d | oftype("delta")) | length); "delta"),
     "\([ $d.claims[] | select(.type == "coverage" and .verdict != "rejected") | select(.text | test("did not find"; "i")) ] | length) uncovered",
     plu((($d | oftype("question")) | length); "question"),
     plu(([ $d.claims[] | select(.verdict == "rejected") ] | length); "rejected claim"),
     (if (($m.notExamined // []) | length) > 0
      then "not examined: \(($m.notExamined // []) | join(", "))" else empty end),
     (if ($m.spec // null) == null then "no spec — scope creep not determined" else empty end),
     (if ($m.dirty // false) then "dirty working tree included" else empty end)
   ] | join(" · ")),
  "",
  "`/diff-brief` over `\($m.base // "?")`\(if ($m.head // null) != null then " → `\($m.head)`" else "" end). Full brief with code: `\($m.label // "")`.html"
]
| join("\n")

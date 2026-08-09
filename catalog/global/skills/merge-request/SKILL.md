---
name: merge-request
description: Pregleda GitLab Merge Request u stilu Roberta Saba — čita MR diff, Jira task opis, analizira kod po pravilima iz REVIEW-RULES.md i ostavlja inline komentare direktno na tačnim linijama diffa. Koristi kada korisnik kaže "pregledaj MR", "review MR", "review ovaj MR", "napravi code review", ili proslijedi GitLab MR URL/broj.
---

# Merge Request Review Skill

## Čitanje REVIEW-RULES.md

Na početku svakog reviewa pročitaj `REVIEW-RULES.md` iz ovog foldera — tu su sva pravila i prioriteti.

---

## Input

Skill prihvata:
- GitLab MR URL: `http://gitlab.indas.rs:8888/inVIEW/inViewWebScada/-/merge_requests/1316`
- Samo broj: `1316`
- Ako nije proslijeđen argument, pitaj korisnika za MR broj ili URL.

Izvuci MR broj iz input-a (zadnji segment URL-a).

---

## Kredencijali

Sve API pozive vršiti koristeći env varijable koje Claude Code učitava iz `settings.local.json`:

```
$env:GITLAB_TOKEN   — GitLab Personal Access Token
$env:GITLAB_URL     — http://gitlab.indas.rs:8888
$env:JIRA_URL       — https://swindas.atlassian.net
$env:JIRA_EMAIL     — rsabo@indas.rs
$env:JIRA_TOKEN     — Jira API token
```

Ako env varijable nisu dostupne u trenutnoj sesiji (npr. pri prvom pokretanju), koristiti vrijednosti direktno iz `C:\Users\robert\.claude\settings.local.json`.

**Nikad ne commituji token vrijednosti.**

---

## Korak 1 — Fetch MR detalja

```powershell
$mr = Invoke-RestMethod `
    -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId" `
    -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN}
```

Izvuci:
- `$mr.title` — naslov (sadrži Jira ID u formatu `#IWS-XXXXX` ili `IWS-XXXXX`)
- `$mr.description`
- `$mr.source_branch`, `$mr.target_branch`
- `$mr.author.name`
- `$mr.state`

---

## Korak 2 — Fetch Jira taska

Iz naslova MR-a izvuci Jira ID regexom: `IWS-\d+`

```powershell
$base64 = [Convert]::ToBase64String(
    [Text.Encoding]::UTF8.GetBytes("$env:JIRA_EMAIL`:$env:JIRA_TOKEN"))

$jira = Invoke-RestMethod `
    -Uri "$env:JIRA_URL/rest/api/3/issue/$jiraId" `
    -Headers @{Authorization = "Basic $base64"}

# Izvuci description tekst
$desc = $jira.fields.description.content |
    ForEach-Object { $_.content | ForEach-Object { $_.text } } |
    Where-Object { $_ } | Out-String
```

Koristiti Jira opis kao **kontekst za review** — šta je task tražio, da li je implementacija kompletna.

---

## Korak 3 — Fetch diff i mapiranje linija

```powershell
$changes = Invoke-RestMethod `
    -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId/changes" `
    -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN}
```

Za svaki fajl u `$changes.changes`:
- `$file.new_path` — putanja fajla
- `$file.diff` — unified diff tekst

**Mapiranje novih linija** (za inline komentare):

```powershell
function Get-LineMap($diffText) {
    $map = @{}  # new_line -> tip ('added'/'context')
    $newLine = 0
    foreach ($line in ($diffText -split "`n")) {
        if ($line -match '^\+\+\+') { continue }
        if ($line -match '^@@\s+-\d+(?:,\d+)?\s+\+(\d+)') {
            $newLine = [int]$Matches[1] - 1
            continue
        }
        if ($line.StartsWith('-')) { continue }
        $newLine++
        if ($line.StartsWith('+')) { $map[$newLine] = 'added' }
        else { $map[$newLine] = 'context' }
    }
    return $map
}
```

---

## Korak 4 — Fetch postojećih komentara (izbjegni duplikate)

```powershell
$existing = Invoke-RestMethod `
    -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId/notes?per_page=100" `
    -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN}

$myComments = $existing | Where-Object { $_.author.username -eq 'robert.sabo0' -and -not $_.system }
```

---

## Korak 5 — Analiza koda

Analiziraj diff prema pravilima iz `REVIEW-RULES.md`. Za svaki fajl:

1. Čitaj diff liniju po liniju (fokus na `+` linije — novi kod)
2. Primjeni pravila od kritičnih prema manjim (redoslijed iz tabele prioriteta)
3. Za svaki nalaz zabilježi:
   - **Fajl** i **new_line** broj
   - **Kategorija** (iz REVIEW-RULES.md)
   - **Komentar** — napisan u stilu Roberta: direktan, koncizan, sa primjerom rješenja
   - **Prioritet** (🔴/🟠/🟡/🟢)

Uzmi u obzir Jira opis — provjeri da li je implementacija **kompletna** (Robert često vraća MR kada je urađena samo polovina traženog).

---

## Korak 6 — Prezentacija korisniku (OBAVEZNO PRIJE SLANJA)

Prikaži sve nalaze u preglednoj formi. **Ne slati ništa bez potvrde korisnika.**

Format prikaza:

```
## Code Review — MR !{broj} / {JiraID}
> {naslov MR-a} | Autor: {ime} | {source} → {target}
> Jira: {jira summary}

### 🔴 Kritično
**1. {naziv problema}**
`{fajl}:{linija}`
{komentar u stilu Roberta}

### 🟠 Visoko
...

### ✅ Što je dobro urađeno
...
```

Zatim pitaj: **"Šta da pošaljem? Sve nalaze, samo kritične/visoke, ili odaberi brojeve?"**

---

## Korak 7 — Postavljanje inline komentara

Fetch diff versions za SHA-ove:

```powershell
$versions = Invoke-RestMethod `
    -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId/versions" `
    -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN}

$v = $versions[0]
$base = $v.base_commit_sha
$start = $v.start_commit_sha
$head = $v.head_commit_sha
```

Za svaki potvrđeni nalaz — POST inline discussion:

```powershell
function Post-InlineComment($filePath, $newLine, $body, $isNewFile = $false) {
    $pos = [ordered]@{
        base_sha      = $base
        start_sha     = $start
        head_sha      = $head
        position_type = "text"
        new_path      = $filePath
        new_line      = $newLine
    }
    if (-not $isNewFile) { $pos["old_path"] = $filePath }

    $payload = @{ body = $body; position = $pos } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Method Post `
        -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId/discussions" `
        -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN; "Content-Type" = "application/json"} `
        -Body $payload

    Start-Sleep -Milliseconds 300  # rate limiting
}
```

**Napomena za `new_line`:** Zbog off-by-one u parsiranju diff hunka (`@@ +N` = počinje od N, ali prvi inkrement daje N+1 u loop-u), uvijek oduzeti 1 od vrijednosti dobijene standardnim brojenjem.

---

## Korak 8 — Opcija: Mark as Draft

Ako je review imao kritične ili visoke nalaze, ponuditi:

```powershell
# Pokušaj draft parametrom
$payload = @{ draft = $true } | ConvertTo-Json
# Ako ne radi (starija GitLab verzija), dodaj prefix u naslov:
$payload = @{ title = "Draft: $($mr.title)" } | ConvertTo-Json

Invoke-RestMethod -Method Put `
    -Uri "$env:GITLAB_URL/api/v4/projects/inVIEW%2FinViewWebScada/merge_requests/$mrId" `
    -Headers @{"PRIVATE-TOKEN" = $env:GITLAB_TOKEN; "Content-Type" = "application/json"} `
    -Body $payload
```

---

## Pravila ponašanja skilla

1. **Uvijek pročitaj REVIEW-RULES.md** na početku.
2. **Uvijek prikaži nalaze korisniku i čekaj potvrdu** prije nego što se bilo šta pošalje na GitLab.
3. **Nikad ne dupliraj postojeće komentare** — provjeri `$myComments` prije slanja.
4. **Inline komentari samo na `+` linijama** (nove linije u diffu) — za context linije potreban je i `old_line`.
5. **Komentiraj u stilu Roberta**: direktno, kratko, sa konkretnim prijedlogom rješenja.
6. **Provjeri kompletnost implementacije** nasuprot Jira opisu — to je česta zamerka.
7. **Pohvali što je dobro urađeno** — Robert to radi, skill to treba raditi.

---

## Primjer toka

```
Korisnik: /merge-request 1316

Skill:
1. Fetchuje MR !1316 detalje
2. Fetchuje Jira IWS-12137 opis
3. Fetchuje diff (9 fajlova)
4. Analizira prema REVIEW-RULES.md
5. Prikazuje nalaze (6 tačaka) i pita za potvrdu
6. Korisnik kaže "pošalji sve"
7. Skill postavlja 6 inline komentara
8. Nudi da označi MR kao Draft
```

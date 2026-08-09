# iWS — Team Review Patterns
>
> Seeded from `.claude/skills/merge-request/REVIEW-RULES.md` (345 MR-ova, Robert Sabo). Extended by `sync-rules`, koji od sad prati komentare i od `robert.sabo0` i od `mapatovic`.

<!-- sync-cursor: 2026-08-08 -->

---

## 1. Performanse i baza podataka

### N+1 query — najčešća zamerka

**Pravilo:** EF poziv unutar `foreach`/`for` → vrati na izmenu. Rešenje: jedan query, pa lookup u memoriji (HashSet, Dictionary).

### GetAll antipattern

**Pravilo:** Svaki `.ToList()` bez filtera na veliku tabelu je problem. Filter mora biti u SQL-u, ne u memoriji.

### Filter pre paginacije

**Pravilo:** Filter → Sort → Paginate. Nikad obratno.

### EF `.Include()` misuse

**Pravilo:** `.Include()` samo kada se navigacija koristi van query-ja. Za filter/join u LINQ-u — Include nije potreban.

### Native/raw SQL

**Pravilo:** Native queryji samo uz opravdan razlog (SQLite limitacije). ORM mora biti kompatibilan sa svim bazama.

### AsNoTracking

**Pravilo:** Za read-only operacije uvek `AsNoTracking()`.

---

## 2. Arhitektura i dizajn

### DAO klase — deprecated

**Pravilo:** DAO klase su deprecated. Koristiti `ReadUnitOfWork` / `UnitOfWork` pattern.

### UnitOfWork pravila

**Pravila:**

1. Jedan UoW po requestu.
2. `.Complete()` se poziva nakon poziva unutrašnje metode, nikad unutar nje.
3. Nikad novi UoW unutar postojećeg.

### Read-only operacije — `ReadUnitOfWork`, ne `UnitOfWork`

**Pravilo:** Za read-only operacije (GET, provere postojanja, itd.) uvek koristiti `ReadUnitOfWork`, nikad obični `UnitOfWork` — write `UnitOfWork` drži write konekciju zauzetu bez razloga. `ReadUnitOfWork`/`UnitOfWork` moraju uvek biti u `using` bloku — bez toga, u async kontekstu ako `await` baci exception pre dispose-a, ostaje connection/memory leak.

### WorkRequest — terminalni status (`FINISHED`/`ERROR`) mora biti poslednji update

**Pravilo:** `FINISHED` i `ERROR` su terminalna stanja — FE prestaje da sluša dalje update-e nakon njih, i prelaz iz `FINISHED` u bilo koje drugo stanje nije dozvoljen. Poziv koji postavlja status na `FINISHED` ili `ERROR` mora biti poslednja stvar u servisnoj metodi, nakon svega što može baciti exception (npr. nakon `uow.Complete()`, ne pre njega). `InProgress` status, obrnuto, treba postaviti što pre, na početku metode.

### Duplicate/copy-paste kod

**Pravilo:** Copy-paste od 3+ linija → izdvoji u zajedničku metodu/klasu.

### Controller ne poziva bazu direktno

**Pravilo:** Controller → Service → Repository/EF. Bez preskakanja slojeva.

### Vidljivost metoda

**Pravilo:** Minimalna vidljivost. Interno → `private`. Za testove → `internal` + `[InternalsVisibleTo]`.

### Imenovanje (C# konvencija + semantika)

**Pravilo:** Ime metode = primarna funkcija. C# PascalCase za metode/klase, camelCase za lokalne varijable.

### Mikroservisna podrška mora biti kompletna

**Pravilo:** Svaka izmena koja ima Kafka/microservice implikacije mora ih tretirati (npr. `Old name` propagacija, ponašanje pri 2+ instance mikroservisa).

### Custom IoC

**Pravilo:** Projekat koristi sopstveni IoC kontejner, ne standardni ASP.NET Core DI registration pattern iz globalnih pravila — proveri registraciju servisa kroz postojeći custom IoC mehanizam pre nego što predložiš `services.AddScoped<>()` stil.

---

## 3. Logovanje

### `Console.WriteLine` — nikad u produkcijskom kodu

**Pravilo:** Svaki `Console.WriteLine` → `log.Info` ili `log.Debug`.

### `log.Info` vs `log.Debug` na hot pathu

**Pravilo:** Dijagnostički logovi na svakom eventu/poruci → `log.Debug`. `log.Info` za životne cikluse (start/stop/greška).

---

## 4. Testiranje

### Bugovi = Test-Driven

**Pravilo:** Svaki bugfix mora imati test koji dokazuje da bug postoji i da je popravljen.

### Nedostatak testova — vraća MR

**Pravilo:** MR bez testova za novu funkcionalnost → vraća na izmenu.

### Nivo testova

**Pravilo:** Unit (bez baze) → Service → Controller → Integration. Svaki ima svoju svrhu.

### Kvalitet assertion-a

**Pravilo:** Assertion ne sme sadržavati logiku. Zakucane vrednosti, ne filter iz inicijalizatora.

### Edge cases

**Pravilo:** Happy path + negative case + cross-project isolation.

---

## 5. Git i konfiguracija

### Konfige ne commitovati

**Pravilo:** Config fajlovi sa deployment vrednostima (IP, GUID, credentiali) se ne commituju. Samo placeholder/default.

### Migracije samo nakon merge-a u develop

**Pravilo:** DB migracija se ne nalazi u MR-u. Kreira se lokalno nakon merge-a u develop.

**Napomena:** Migracija sme privremeno postojati u MR-u kao **zaseban commit** radi testiranja (da saradnici mogu da migriraju svoju lokalnu bazu i testiraju izmenu), ali se **revertuje pre spajanja** u develop granu — finalna migracija se generiše tek nakon merge-a.

### MR naslov mora sadržavati Jira ID

**Pravilo:** Format: `#IWS-XXXXX opis`. Bez Jira ID-a → traži ispravku.

---

## 6. REST API konvencije

### HTTP metode

**Pravilo:** Download/read → GET. Insert → POST. Update → PUT/PATCH. Delete → DELETE.

### URL konvencije

**Pravilo:** `/api/resource-name`, bez glagola, mala slova, crtice.

### Response shape — bez success/error wrapper-a

**Pravilo:** Ne vraćamo `{ success: true/false, error: null }` envelope kada status kod već nosi tu informaciju (npr. 200). Vraćamo direktno resurs (npr. `workRequest.id`), a greške idu kroz `ProblemDetails` (RFC 7807) sa odgovarajućim statusom.

---

## 7. Ostalo

### DateTime — `DateTime.Now`, ne `DateTime.UtcNow`

**Pravilo:** Ovaj projekat koristi `DateTime.Now`. Ne `DateTime.UtcNow`. (Napomena: ovo je projektno pravilo koje eksplicitno overrideuje generički globalni C# savet.)

### Thread-safety — volatile + double-checked locking

**Pravilo:** Lazy init u multithreaded contextu → `volatile` + double-check lock ili `Lazy<T>`.

### Project scope / izolacija

**Pravilo:** Svaki API mora biti filtriran po projectId. Cross-project pristup = sigurnosni propust.

### Backward compatibility

**Pravilo:** Svaka izmena postojeće logike mora biti popraćena potvrdom da je backward compatibility sačuvana.

### Encoding artefakti u tekstu

**Pravilo:** Karakteri poput pogrešno enkodiranog em/en dash-a ili strelica koji se pojave u komentarima/porukama/JSON opisima (često iz copy-paste ili AI-generisanog teksta) moraju se ispraviti pre merge-a — čist ASCII/UTF-8 tekst.

### AI-review nalazi — verifikuj pre primene, ne ignoriši

**Pravilo:** Ako AI alat (Copilot/Claude/ChatGPT i sl.) ostavi nalaz na MR-u, on mora biti eksplicitno adresiran — ili primenjen, ili prokomentarisan zašto se odbacuje, nikad tiho ignorisan. Istovremeno, AI predlozi se ne primenjuju slepo — proveriti da li AI razume postojeću konvenciju/kontekst pre nego što se predlog primeni (AI zna da pogrešno savetuje, npr. koji tip UnitOfWork-a koristiti).

---

## 8. Prioritet zamerki

| Prioritet | Kategorija | Akcija |
| ----------- | ------------ | -------- |
| 🔴 Kritično | N+1 query, GetAll na velikim tabelama | Vraća na izmenu |
| 🔴 Kritično | Cross-project izolacija | Vraća na izmenu |
| 🔴 Kritično | Bug bez testa | Vraća na izmenu |
| 🔴 Kritično | DAO klase u novom kodu | Vraća na izmenu |
| 🔴 Kritično | Config commitovan sa deployment vrednostima | Vraća na izmenu |
| 🔴 Kritično | Custom IoC zaobiđen / pogrešan DI stil | Vraća na izmenu |
| 🟠 Visoko | Native SQL bez razloga | Vraća na izmenu |
| 🟠 Visoko | Console.WriteLine u produkciji | Vraća na izmenu |
| 🟠 Visoko | Filter poslije paginacije | Vraća na izmenu |
| 🟠 Visoko | Migracija u MR-u | Vraća na izmenu |
| 🟡 Srednje | Nedostatak testova za novu funkcionalnost | Traži dodavanje |
| 🟡 Srednje | log.Info na hot pathu | Traži izmenu |
| 🟡 Srednje | UoW.Complete() na krivom mjestu | Traži izmenu |
| 🟡 Srednje | HTTP metoda nije odgovarajuća | Traži izmenu |
| 🟡 Srednje | Copy-paste kod | Traži refaktoring |
| 🟡 Srednje | `UnitOfWork` umesto `ReadUnitOfWork` za read-only | Traži izmenu |
| 🟡 Srednje | WorkRequest terminalni status pre svih throw-ova | Traži izmenu |
| 🟡 Srednje | AI-review nalazi neadresirani | Traži izmenu |
| 🟢 Manje | Imenovanje metoda/klasa | Komentariše |
| 🟢 Manje | log.Debug vs log.Info | Komentariše |
| 🟢 Manje | Vidljivost metoda (public/private) | Komentariše |
| 🟢 Manje | MR naslov bez Jira ID-a | Uvek traži ispravku |
| 🟢 Manje | REST success/error wrapper kad status kod već nosi info | Komentariše |
| 🟢 Manje | Encoding artefakti u tekstu | Komentariše |

---

## 9. Stil komunikacije

- Direktan i koncizan. Daje primer rešenja.
- Pita pitanjem kada je nešto principijelno loše.
- Sigurnosna rupa ili arhitekturalni propust → vraća u draft odmah.
- Pohvaljuje kada je urađeno dobro.

---

## 10. Sync log

<!-- svaki sync dodaje red ovde: | datum | broj novih MR-ova pregledanih | broj dodatih/izmenjenih pravila | -->

| Datum | Novih MR-ova | Izmena pravila |
|-------|-------------|-----------------|
| 2026-08-08 | 239 (merged, poslednjih 90 dana) | 5 novih pravila (ReadUnitOfWork za read-only, WorkRequest terminalni status, REST response bez wrapper-a, encoding artefakti, AI-review triage) + 1 napomena (migracija privremeno u MR-u) |

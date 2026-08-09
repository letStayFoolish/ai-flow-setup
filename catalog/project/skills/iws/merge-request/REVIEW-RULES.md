# Robert Sabo — MR Review Patterns
> Izvedeno iz 345 MR-ova u kojima je Robert ostavio komentare.

---

## 1. Performanse i baza podataka

### N+1 query — najčešća zamerka
- "Zasto radimo N+1 fetch iz baze?"
- "povukli smo kolekciju iz baze. I onda u petlji, u svakoj iteraciji mi tu kolekciju ponovo projektujemo"
- "mozemo svesti na trivijalno samom funkcijom .ToHashSet() i na O(1) smo"

**Pravilo:** EF poziv unutar `foreach`/`for` → vrati na izmjenu. Rješenje: jedan query, pa lookup u memoriji (HashSet, Dictionary).

---

### GetAll antipattern
- "nikako ne smemo getAll da radimo"
- "Napraviti metodu koja u single pozivu baze ovo resava"
- "da li nam je ovde potrebno da loadujemo sve? odgovor je negativan: ne treba"

**Pravilo:** Svaki `.ToList()` bez filtera na veliku tabelu je problem. Filter mora biti u SQL-u, ne u memoriji.

---

### Filter prije paginacije
- "radimo prvo paginaciju pa filtriranje? nijedan test nije ovo pokrio"

**Pravilo:** Filter → Sort → Paginate. Nikad obratno.

---

### EF `.Include()` misuse
- "Sto radimo ove silne include-ove? Kasnije na entitetu radimo samo delete by ID."
- ".Include nije isto sto i .Join"
- "EF po automatizmu join-uje kada pristupas podobjektima, nema potrebe za .Include"

**Pravilo:** `.Include()` samo kada se navigacija koristi van query-ja. Za filter/join u LINQ-u — Include nije potreban.

---

### Native/raw SQL
- "ponovo, nije ok native query"
- "narusavamo princip ORM-a (pitanje da li ce i kako raditi sa SQLite, MariaDB, MySQL, MSSQL)"

**Pravilo:** Native queryji samo uz opravdan razlog (SQLite limitacije). ORM mora biti kompatibilan sa svim bazama.

---

### AsNoTracking
- "_entities.AsNoTracking();"

**Pravilo:** Za read-only operacije uvijek `AsNoTracking()`.

---

## 2. Arhitektura i dizajn

### DAO klase — deprecated
- "Zasto koristimo i dalje Dao klase?"
- "izbacimo upotrebu Dao klasa. Neka se kreira ReadUnitOfWork i tako pozove"

**Pravilo:** DAO klase su deprecated. Koristiti `ReadUnitOfWork` / `UnitOfWork` pattern.

---

### UnitOfWork pravila
- "Losa je praksa da za isti request otvaramo XY UnitOfWork-a"
- "ako se prosledjuje UoW unutra na obradu, onda se complete radi nakon poziva, ne u unutrasnjosti metode"
- "zasto moramo imati visestruki complete u istoj metodi?"
- "nemoj da ovde inicijalizujes ReadUnitOfWork unutar drugog UoW"

**Pravila:**
1. Jedan UoW po requestu.
2. `.Complete()` se poziva nakon poziva unutrašnje metode, nikad unutar nje.
3. Nikad novi UoW unutar postojećeg.

---

### Duplicate/copy-paste kod
- "ne svidja mi se sto je kod dupiran"
- "copypaste iz AEmikroservisa? jesmo ga mogli smestiti na zajednicko mesto"
- "Ne smemo svaki put dodavati nove konstante"

**Pravilo:** Copy-paste od 3+ linija → izdvoji u zajedničku metodu/klasu.

---

### Controller ne poziva bazu direktno
- "prebacimo ovo na servis, nemoj da controller poziva direktno bazu"

**Pravilo:** Controller → Service → Repository/EF. Bez preskakanja slojeva.

---

### Vidljivost metoda
- "`ParseAll` nema razloga biti `public` — koristi se samo interno"

**Pravilo:** Minimalna vidljivost. Interno → `private`. Za testove → `internal` + `[InternalsVisibleTo]`.

---

### Imenovanje (C# konvencija + semantika)
- "pratimo c# konvenciju imenovanja"
- "imamo metodu koja se zove retrieve a samo radi retrieve. Rename je teza operacija, mora ona prva da ide."
- "Ako metoda radi i rename, hajde da se zove RenameScripts a ne retrieve...AndRename"

**Pravilo:** Ime metode = primarna funkcija. C# PascalCase za metode/klase, camelCase za lokalne varijable.

---

### Mikroservisna podrška mora biti kompletna
- "na mikroservisnoj arhitekturi mora se poslati i Old name. Ne vidim da je na temu toga ista uradjeno"
- "kako ce se ponasati ako pokrenemo 2 ili vise ovih mikroservisa?"

**Pravilo:** Svaka izmjena koja ima Kafka/microservice implikacije mora ih tretirati. Robert uvijek pita za MS scenarije.

---

## 3. Logovanje

### `Console.WriteLine` — nikad u produkcijskom kodu
- "Console.WriteLine posklanjaj, pisimo u log"
- "nema potrebe da printamo i u konzolu i u log"

**Pravilo:** Svaki `Console.WriteLine` → `log.Info` ili `log.Debug`.

---

### `log.Info` vs `log.Debug` na hot pathu
- "ovo je log debug, nemojte ovo u info"
- "`log.Info` sa `string.Join` pozivom na svakom eventu — izvrsava se uvijek bez obzira na log level"

**Pravilo:** Dijagnostički logovi na svakom eventu/poruci → `log.Debug`. `log.Info` za životne cikluse (start/stop/greška).

---

## 4. Testiranje

### Bugovi = Test-Driven
- "Bugove uvek resavamo test driven"
- "meni fali test koji ce dokazati da je ovim nesto popravljeno"

**Pravilo:** Svaki bugfix mora imati test koji dokazuje da bug postoji i da je popravljen.

---

### Nedostatak testova — vraća MR
- "Ne vidim ni jedan test"
- "Slabo vidim novodopisanih testova"
- "Testova 0 bodova"

**Pravilo:** MR bez testova za novu funkcionalnost → vraća na izmjenu.

---

### Nivo testova
- "Napisani su controller testovi, koji samo proveravaju controller. Potrebno je dodati i service testove"

**Pravilo:** Unit (bez baze) → Service → Controller → Integration. Svaki ima svoju svrhu.

---

### Kvalitet assertion-a
- "nemoj da ti assertation deo sadrzi neku logiku. pisi slobodno gluplje testove"
- "dodajte e1,log2,e3,log4 u assertationu mozes zakucati: ocekujem da ima log2 i log4"

**Pravilo:** Assertion ne smije sadržavati logiku. Zakucane vrijednosti, ne filter iz inicijalizatora.

---

### Rubni slučajevi
- "pokriti slucaj kada se posalje ime koje ne postoji"
- "pokriti slucaj da ne dovlaci sa drugog projekta"

**Pravilo:** Happy path + negative case + cross-project isolation.

---

## 5. Git i konfiguracija

### Konfige ne commitovati
- "confige ne commitujemo, osim novododate"
- "discard database config-a, molim te"
- "Konkretne deployment vrijednosti ne bi trebale biti u repozitorijumu"

**Pravilo:** Config fajlovi sa deployment vrijednostima (IP, GUID, credentiali) se ne commituju. Samo placeholder/default.

---

### Migracije samo nakon merge-a u develop
- "Migracije kreiramo po merge-u u develop"
- "Ukloniti migraciju iz commita"

**Pravilo:** DB migracija se ne nalazi u MR-u. Kreira se lokalno nakon merge-a u develop.

---

### MR naslov mora sadržavati Jira ID
- "Mogu li te zamoliti da MR nazivamo sa # id-em taska u formatu #IWS-10370"
- "na taj nacin dobijemo automatski link do taska"

**Pravilo:** Format: `#IWS-XXXXX opis`. Bez Jira ID-a → traži ispravku.

---

## 6. REST API konvencije

### HTTP metode
- "Zasto download radimo kao post? Mi GET-ujemo fajl"
- "POST metoda i onda se zove get-nesto"

**Pravilo:** Download/read → GET. Insert → POST. Update → PUT/PATCH. Delete → DELETE.

---

### URL konvencije
- "nema glagola u definisanom resursu"
- "sve mala slova, odvajamo crticom"
- "nema potrebe 'get' u imenu Endpointa koji je metode 'GET'"

**Pravilo:** `/api/resource-name`, bez glagola, mala slova, crtice.

---

## 7. Ostalo

### DateTime — `DateTime.Now`, ne `DateTime.UtcNow`
- "Now, ne UTCNow. Sve timestampove cuvamo u timezoni-i u kojoj je i server"

**Pravilo:** Ovaj projekat koristi `DateTime.Now`. Ne `DateTime.UtcNow`.

---

### Thread-safety — volatile + double-checked locking
- "`_myScriptGuids` nije `volatile` — double-checked locking bez `volatile` je broken na .NET memory modelu"

**Pravilo:** Lazy init u multithreaded contextu → `volatile` + double-check lock ili `Lazy<T>`.

---

### Project scope / izolacija
- "takodje proslediti i projectId, da ne bi neko mogao getovati podatke sa tudjeg projekta"
- "Obavezno ograniciti na projekat"

**Pravilo:** Svaki API mora biti filtriran po projectId. Cross-project pristup = sigurnosni propust.

---

### Backward compatibility
- "Namerno smo zamenili a ponasanje je i dalje korektno? Jesmo 100% sigurni?"
- "bitno je da postojece API-e koji vracaju error kao objekat ostanu nepromenjeni"

**Pravilo:** Svaka izmjena postojeće logike mora biti popraćena potvrdom da je backward compatibility sačuvana.

---

## 8. Prioritet zamerki

| Prioritet | Kategorija | Akcija |
|-----------|------------|--------|
| 🔴 Kritično | N+1 query, GetAll na velikim tabelama | Vraća na izmjenu |
| 🔴 Kritično | Cross-project izolacija | Vraća na izmjenu |
| 🔴 Kritično | Bug bez testa | Vraća na izmjenu |
| 🔴 Kritično | DAO klase u novom kodu | Vraća na izmjenu |
| 🔴 Kritično | Config commitovan sa deployment vrijednostima | Vraća na izmjenu |
| 🟠 Visoko | Native SQL bez razloga | Vraća na izmjenu |
| 🟠 Visoko | Console.WriteLine u produkciji | Vraća na izmjenu |
| 🟠 Visoko | Filter poslije paginacije | Vraća na izmjenu |
| 🟠 Visoko | Migracija u MR-u | Vraća na izmjenu |
| 🟡 Srednje | Nedostatak testova za novu funkcionalnost | Traži dodavanje |
| 🟡 Srednje | log.Info na hot pathu | Traži izmjenu |
| 🟡 Srednje | UoW.Complete() na krivom mjestu | Traži izmjenu |
| 🟡 Srednje | HTTP metoda nije odgovarajuća | Traži izmjenu |
| 🟡 Srednje | Copy-paste kod | Traži refaktoring |
| 🟢 Manje | Imenovanje metoda/klasa | Komentariše |
| 🟢 Manje | log.Debug vs log.Info | Komentariše |
| 🟢 Manje | Vidljivost metoda (public/private) | Komentariše |
| 🟢 Manje | MR naslov bez Jira ID-a | Uvijek traži ispravku |

---

## 9. Stil komunikacije

- Direktan i koncizan. Daje primjer rješenja: "mozes svesti na trivijalno sa .ToHashSet(t=>t.iwsScriptId)"
- Pita pitanjem kada je nešto principijelno loše: "Zasto radimo N+1 fetch?"
- Manji problemi: "sminku" / "higijena" — ne blokira uvijek, ali traži ispravku
- Sigurnosna rupa ili arhitekturalni propust → vraća u draft odmah
- Pohvaljuje kada je urađeno dobro: "love it, great job", "to je to"
- Pita za pojašnjenje kada ne razumije: "Mislim da ja gresim, pa molim za pojasnjenje"

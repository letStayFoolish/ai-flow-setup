---
name: ticket-standard
description: IWS standard for writing a Jira ticket a developer reads cold — Serbian, problem first, checkable acceptance criteria. Use when writing, drafting, or publishing any ticket, follow-up, or bug report for the IWS team.
---

# Ticket Standard

A ticket is written for a **cold reader**: a teammate who was not in the grilling session, the meeting, or this conversation. They read it once and know what is broken or missing, why it matters, and when they are done. Every rule below serves that reader.

## Language

Serbian, Latin script — the whole team reads it in their mother tongue. Technical terms stay in English (endpoint, migration, retry, payload). Plain sentences a person would say out loud to a colleague.

## Template

```
Naslov: [BE|FE|BE+FE] <glagol> <šta> <gde>

**Problem**
2–4 rečenice: šta danas ne radi ili nedostaje, ko to primećuje i zašto je važno.

**Šta treba uraditi**
Ishod koji se vidi spolja, ne recept. Najviše 1–3 putokaza u kod (vidi Putokazi).

**Acceptance criteria**
- [ ] Uslov koji developer ili QA može da proveri
- [ ] ...

**Van scope-a**            ← samo kad postoji realna dvosmislenost
**Poreklo**                ← tiket, MR ili sastanak iz kog je nastao
```

- **Naslov**: up to ~70 characters, an action verb, the layer prefix. A bug title names the symptom ("Write na i3x lokalne varijable odbijen kada je gateway2modbus = 0").
- **Problem** carries the _why_. When the cause is known, state it in one sentence; when it is a hypothesis, say so ("verovatni uzrok").
- **Šta treba uraditi** names the target behaviour. Leave the design to the developer unless a decision was already made — then state the decision and who made it.
- **Acceptance criteria**: 2–5 observable outcomes ("vraća 404 za nepostojeći employeeId"). Edge cases the reader would otherwise miss belong here.
- Open questions go into the ticket as an explicit **Otvoreno pitanje** line, addressed to a role (FE tim, product owner).

## Putokazi (code pointers)

At most 3 per ticket, by file or class name, no line numbers — names survive refactors, line numbers go stale with the next merge. A pointer earns its place when it saves the reader a search ("provera je u `IwsI3xValueSetCommunicationChecker`"). Code snippets, stack traces and long file lists stay in the linked spec or MR.

## Type and size

- **Bug** for broken existing behaviour, **Task** for new or changed behaviour.
- One ticket = one deliverable a developer finishes and demos alone. A ticket that needs both BE and FE stays one ticket when the two halves only make sense together; otherwise split and link.

## Final check

Read the draft as the cold reader. It is done when each answer is yes:

1. Do I know what is wrong or missing without opening another document?
2. Do I know why it matters?
3. Can I tell, from the acceptance criteria alone, when I am finished?
4. Is every sentence about the problem — none about how the ticket was produced?

## Example

```
Naslov: [BE] Write na i3x lokalne varijable odbijen kada je gateway2modbus = 0

**Problem**
Upis vrednosti u lokalnu varijablu i3x konekcije pada sa "Invalid argument provided"
kada je Modbus strana gateway-a nedostupna (gateway2modbus = 0, gateway2broker = 1).
Lokalne varijable ne idu preko Modbusa, pa bi upis trebalo da prođe.

**Šta treba uraditi**
Provera komunikacije pre upisa (`IwsI3xValueSetCommunicationChecker`) za lokalne
varijable ne gleda status gateway2modbus. Za ostale varijable ponašanje ostaje isto.

**Acceptance criteria**
- [ ] Upis u lokalnu varijablu prolazi kada je gateway2modbus = 0, a status i gateway2broker = 1
- [ ] Upis u Modbus varijablu i dalje se odbija kada je gateway2modbus = 0
- [ ] Oba slučaja pokrivena testom

**Poreklo**
Sastanak sa aplikativnim i FE timom, Sugestije.xlsx.
```

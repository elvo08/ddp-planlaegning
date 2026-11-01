# DDP-planlægning

MVP af et planlægningsværktøj, der fører interne, AI-assisterede udviklingsprojekter gennem Discovery-Driven Planning (McGrath & MacMillan, 1995): omvendt gevinstregnskab, antagelser, milepæle med beslutningspunkter (fortsæt, justér, stop) og evaluering af metoden. Værktøjet samler også viden om, hvordan de færdige værktøjer er bygget, i et værktøjskatalog.

## Struktur

```
src/
  index.html   Sidens skelet
  styles.css   Design, farver og mørk tilstand (variabler under :root)
  demo.js      Opdigtede demoprojekter (window.DDP_DEMO)
  app.js       Al logik
tests/
  tests.html   Tests, der kører i browseren med en falsk database
  run.sh       Kører tests.html i en hovedløs Chrome
dist/
  ddp-planlaegning.html   Samlet fil, der publiceres på claude.ai
build.ps1      Samler src/ til dist/ (PowerShell, kræver ikke Node)
build.js       Samme som build.ps1, til Node.js
docs/superpowers/   Design og implementeringsplan
```

## Demo og live

I toppen kan man skifte mellem **Demo** og **Live**.

- **Live** er de rigtige, fælles projekter i claude.ai's database.
- **Demo** viser seks opdigtede projekter fra `src/demo.js` i forskellige faser. Man kan ændre i dem, men intet gemmes, og alt nulstilles ved genindlæsning. Demo skriver aldrig til databasen.

Hvert besøg starter i Live. Uden database (filen åbnet lokalt) starter den i Demo. `#demo` i adressen åbner demo direkte (se "Kendte begrænsninger").

## Vigtige steder i app.js

- `CATS`, `STATUS`, `DEC`, `REV_DEFAULT`, `FQ`: kategorier, statusser, beslutninger, standardtal og evalueringsspørgsmål.
- `calc()`: det omvendte gevinstregnskab (krævet gevinst → tilladte omkostninger → krævede sparede timer).
- `status()`: projektets status. "I drift" vises, når værktøjet er markeret i drift, og den seneste beslutning er "Fortsæt".
- `tabRev`, `tabAss`, `tabMs`, `tabBuild`, `tabEval`: de fem trin i et projekt.
- `renderCatalog()` / `catalogItems()`: værktøjskataloget og dets filtre.
- `setMode()` / `applyMode()`: skift mellem demo og live. `inMemory()` afgør, om ændringer kun gemmes i hukommelsen.
- `queuePatch()` / `flush()`: gemmer ændringer (samlet og én ad gangen pr. projekt).
- `boot()`: forbinder til claude.ai's fælles database (`db`), brugeroplysninger (`user`) og download (`downloads`).
- `window.DDP`: kroge, som testene bruger.

## Datamodel

Hvert projekt er ét dokument i samlingen `projects`:

```
{ name, department, description, createdBy, createdAt, updatedAt,
  rev:        { targetNet, marginPct, rate, users, weeks, lifetime, devHours, oneTime, maintHours, runMonthly },
  assumptions:{ <id>: { text, cat, impact, uncertainty, status, expected, actual, order, deleted? } },
  milestones: { <id>: { name, desc, date, budget, tests:{<antagelses-id>:bool}, result,
                        decision, rationale, decidedBy, decidedAt, order, deleted? } },
  feedback:   { <bruger-id>: { q1, q2, q3, q4, comment, at } },
  build:      { summary, stack:[tag], reusable, links, learnings, contact, live } }
```

`build` er valgfrit. Projekter uden det virker som før og vises bare ikke i kataloget.

## Arbejdsgang

1. Ret i filerne under `src/`.
2. Kør testene: `bash tests/run.sh` (kræver Chrome). Sidste linje skal være `ALLE N TESTS BESTÅET`.
3. Byg: `powershell -ExecutionPolicy Bypass -File build.ps1` (eller `node build.js`).
4. Publicér `dist/ddp-planlaegning.html` på claude.ai, så den opdaterer det eksisterende værktøj.

Åbnes `src/index.html` eller filen i `dist/` direkte i en browser, kører værktøjet uden database og starter i demo.

## Kendte begrænsninger

- Om `#demo` i et claude.ai-link når frem til værktøjet, er ikke afprøvet endnu.

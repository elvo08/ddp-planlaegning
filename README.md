# DDP-planlægning

MVP af et planlægningsværktøj, der fører interne, AI-assisterede udviklingsprojekter gennem Discovery-Driven Planning (McGrath & MacMillan, 1995): omvendt gevinstregnskab, antagelser, milepæle med beslutningspunkter (fortsæt, justér, stop) og evaluering af metoden.

## Struktur

```
src/
  index.html   Sidens skelet
  styles.css   Design, farver og mørk tilstand (variabler under :root)
  app.js       Al logik
dist/
  ddp-planlaegning.html   Samlet fil, der publiceres på claude.ai
build.js       Samler src/ til dist/
```

## Vigtige steder i app.js

- `CATS`, `STATUS`, `DEC`, `REV_DEFAULT`, `FQ`: kategorier, statusser, beslutninger, standardtal og evalueringsspørgsmål.
- `calc()`: det omvendte gevinstregnskab (krævet gevinst → tilladte omkostninger → krævede sparede timer).
- `tabRev`, `tabAss`, `tabMs`, `tabEval`: de fire trin i et projekt.
- `queuePatch()` / `flush()`: gemmer ændringer i databasen (samlet og én ad gangen pr. projekt).
- `boot()`: forbinder til claude.ai's fælles database (`db`), brugeroplysninger (`user`) og download (`downloads`).

## Datamodel

Hvert projekt er ét dokument i samlingen `projects`:

```
{ name, department, description, createdBy, createdAt, updatedAt,
  rev:        { targetNet, marginPct, rate, users, weeks, lifetime, devHours, oneTime, maintHours, runMonthly },
  assumptions:{ <id>: { text, cat, impact, uncertainty, status, expected, actual, order, deleted? } },
  milestones: { <id>: { name, desc, date, budget, tests:{<antagelses-id>:bool}, result,
                        decision, rationale, decidedBy, decidedAt, order, deleted? } },
  feedback:   { <bruger-id>: { q1, q2, q3, q4, comment, at } } }
```

## Arbejdsgang

1. Ret i filerne under `src/`.
2. Kør `node build.js` (kræver Node.js).
3. Publicér `dist/ddp-planlaegning.html` på claude.ai, så den opdaterer det eksisterende værktøj.

Åbnes `src/index.html` eller filen i `dist/` direkte i en browser, kører værktøjet i lokal tilstand, hvor intet gemmes. Den fælles database findes kun, når værktøjet kører på claude.ai.

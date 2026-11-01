# DDP-planlægning

MVP af et planlægningsværktøj, der fører interne, AI-assisterede udviklingsprojekter gennem Discovery-Driven Planning (McGrath & MacMillan, 1995): omvendt gevinstregnskab, antagelser, milepæle med beslutningspunkter (fortsæt, justér, stop) og evaluering af metoden. Værktøjet samler også viden om, hvordan de færdige værktøjer er bygget, i et værktøjskatalog.

## Kør værktøjet

Kræver Python 3.11 eller nyere.

```
powershell -ExecutionPolicy Bypass -File start.ps1
```

Åbn derefter http://localhost:8000. Første gang opretter scriptet et Python-miljø i `.venv` og installerer FastAPI. Data gemmes i `ddp.db` (SQLite) i projektmappen. Slet filen for at starte forfra.

Kolleger på samme netværk kan bruge værktøjet, hvis serveren startes med `--host 0.0.0.0` og de åbner `http://<din-maskines-ip>:8000`.

## Tech stack

| Del | Hvad |
|---|---|
| Brugerflade | HTML, CSS og JavaScript uden frameworks (`src/`) |
| Server | FastAPI (Python), `server/main.py` |
| Database | SQLite, én fil (`ddp.db`). Hvert projekt er ét JSON-dokument |
| Opdateringer | Siden henter data fra serveren hvert 4. sekund og straks efter hver ændring |
| Brugere | Man skriver sit navn første gang. Det gemmes i browseren og på serveren. Der er ingen adgangskoder |
| Test | pytest til serveren, en browserbaseret testside til brugerfladen |

## Struktur

```
server/
  main.py        FastAPI: API under /api og levering af siden fra src/
  test_main.py   Tests af API'et
src/
  index.html     Sidens skelet
  styles.css     Design, farver og mørk tilstand (variabler under :root)
  demo.js        Opdigtede demoprojekter (window.DDP_DEMO)
  app.js         Al logik i brugerfladen
tests/
  tests.html     Tests, der kører i browseren med en falsk backend
  run.sh         Kører tests.html i en hovedløs Chrome
start.ps1        Starter serveren
requirements.txt / requirements-dev.txt
build.js / build.ps1 / dist/   Samlet enkeltfil (fra claude.ai-versionen, bruges ikke af serveren)
docs/superpowers/   Design og implementeringsplaner
```

## API

| Metode | Sti | Hvad |
|---|---|---|
| GET | `/api/projects` | Alle projekter som `{id: projekt}` |
| PUT | `/api/projects/{id}` | Opret eller erstat et projekt |
| PATCH | `/api/projects/{id}` | Flet ændringer ind. Objekter flettes, lister erstattes |
| DELETE | `/api/projects/{id}` | Slet et projekt |
| GET | `/api/users` | Alle navne som `{bruger-id: navn}` |
| PUT | `/api/users/{id}` | Gem et navn: `{"name": "..."}` |

Id'er må kun indeholde bogstaver, tal, `-` og `_`. Se også http://localhost:8000/docs.

## Demo og live

I toppen kan man skifte mellem **Demo** og **Live**.

- **Live** er de rigtige projekter fra serveren.
- **Demo** viser seks opdigtede projekter fra `src/demo.js`. Man kan ændre i dem, men intet gemmes, og alt nulstilles ved genindlæsning. Demo skriver aldrig til serveren.

Hvert besøg starter i Live. Kører siden uden server (filen åbnet direkte), starter den i Demo. `#demo` i adressen åbner demo direkte.

## Vigtige steder i app.js

- `CATS`, `STATUS`, `DEC`, `REV_DEFAULT`, `FQ`: kategorier, statusser, beslutninger, standardtal og evalueringsspørgsmål.
- `calc()`: det omvendte gevinstregnskab (krævet gevinst → tilladte omkostninger → krævede sparede timer).
- `status()`: projektets status. "I drift" vises, når værktøjet er markeret i drift, og den seneste beslutning er "Fortsæt".
- `tabRev`, `tabAss`, `tabMs`, `tabBuild`, `tabEval`: de fem trin i et projekt.
- `renderCatalog()` / `catalogItems()`: værktøjskataloget og dets filtre.
- `setMode()` / `applyMode()`: skift mellem demo og live. `inMemory()` afgør, om ændringer kun gemmes i hukommelsen.
- `queuePatch()` / `flush()`: gemmer ændringer (samlet og én ad gangen pr. projekt).
- `httpBackend()`: taler med FastAPI-serveren (projekter, navne, download).
- `boot()`: starter appen. Tests kan sætte en falsk backend i `window.DDP_BACKEND`.
- `window.DDP`: kroge, som testene bruger.

## Datamodel

```
{ name, department, description, createdBy, createdAt, updatedAt,
  rev:        { targetNet, marginPct, rate, users, weeks, lifetime, devHours, oneTime, maintHours, runMonthly },
  assumptions:{ <id>: { text, cat, impact, uncertainty, status, expected, actual, order, deleted? } },
  milestones: { <id>: { name, desc, date, budget, tests:{<antagelses-id>:bool}, result,
                        decision, rationale, decidedBy, decidedAt, order, deleted? } },
  feedback:   { <bruger-id>: { q1, q2, q3, q4, comment, at } },
  build:      { summary, stack:[tag], reusable, links, learnings, contact, live } }
```

## Test

```
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m pytest server
bash tests/run.sh
```

`tests/run.sh` kræver Chrome. Sidste linje skal være `ALLE N TESTS BESTÅET`.

## Kendte begrænsninger

- Der er ingen adgangskoder. Alle, der kan nå serveren, kan læse og ændre alt. Kør den kun på et betroet netværk.
- Ændrer to personer samme felt samtidig, vinder den sidste.

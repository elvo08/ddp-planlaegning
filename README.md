# DDP-planlægning

Et planlægningsværktøj til interne, AI-assisterede udviklingsprojekter. Det fører et projekt gennem Discovery-Driven Planning (McGrath & MacMillan, 1995): man starter med den gevinst, projektet skal give, regner baglæns til, hvad der så skal være sandt, og tester de antagelser ved faste milepæle, hvor man beslutter at fortsætte, justere eller stoppe. Værktøjet samler også viden om, hvordan de færdige værktøjer er bygget, i et fælles værktøjskatalog.

Det er et MVP. Alt brugervendt sprog er dansk.

## Hvad værktøjet gør

- **Omvendt gevinstregnskab.** Ud fra den krævede gevinst beregner værktøjet, hvor meget projektet højst må koste, og hvor meget tid hver bruger skal spare, før det er umagen værd.
- **Antagelser.** De tal og forudsætninger, projektet hviler på, skrives ned, prioriteres efter betydning og usikkerhed og får en status, når de er testet.
- **Milepæle med beslutningspunkter.** Hver milepæl tester bestemte antagelser og afsluttes med en beslutning: Fortsæt, Justér eller Stop. Beslutningen gemmes med navn og tidspunkt.
- **Sådan er det bygget.** Når værktøjet er færdigt, beskrives tech stack, genbrugelige dele og læringer, så kolleger kan bygge videre.
- **Evaluering.** Brugerne vurderer, om metoden hjalp. Svarene bruges som empiri om selve metoden.
- **Projektoversigt og værktøjskatalog.** Forsiden viser alle projekter med status og filtre, og kataloget viser de dokumenterede værktøjer på tværs af afdelinger.

## Metoden kort

Discovery-Driven Planning er lavet til projekter, hvor man ved lidt og antager meget. I stedet for at lave en detaljeret plan ud fra gæt, gør man gættene synlige og tester dem billigst muligt først.

1. **Regn baglæns.** Hvad skal projektet mindst give? Hvad må det så højst koste? Hvad skal være sandt, for at det hænger sammen?
2. **Skriv antagelserne ned.** Hver antagelse får en kategori, en betydning og en usikkerhed. De vigtigste og mest usikre testes først.
3. **Planlæg milepæle som test.** En milepæl er ikke en leverance, men et tidspunkt, hvor bestemte antagelser bliver be- eller afkræftet.
4. **Beslut ved hver milepæl.** Fortsæt, justér planen, eller stop, før der er brugt flere penge.

## Sådan bruger du det

### Første gang

Siden spørger om dit navn. Det vises ved projekter, beslutninger og evalueringer, så kolleger kan se, hvem der har gjort hvad. Der er ingen adgangskode; navnet gemmes i browseren og på serveren.

### Opret et projekt

Nederst på forsiden udfylder du projektnavn, afdeling og det problem, værktøjet skal løse. Projektet åbner i trin 1.

### De fem trin i et projekt

| Trin | Fane | Det gør du |
|---|---|---|
| 1 | **Gevinstregnskab** | Skriv krævet nettogevinst, gevinstmargin, timepris, antal brugere og forventede omkostninger. Værktøjet viser med det samme, hvor mange timer hver bruger skal spare om ugen, de tilladte omkostninger og om budgettet holder. Knappen "Lav antagelser ud fra tallene" opretter de første antagelser automatisk. |
| 2 | **Antagelser** | Skriv de forudsætninger, projektet hviler på. Hver antagelse har en kategori (Gevinst, Brug og adoption, Omkostning, Teknisk, Organisatorisk), betydning og usikkerhed (Lav, Mellem, Høj), forventet og faktisk værdi, og en status: Ikke testet, Holder, Holder delvist eller Holder ikke. |
| 3 | **Milepæle og beslutninger** | Opret milepæle, eller brug de fire standardmilepæle (kortlæg arbejdsgang, klikbar prototype, MVP i brug, pilot i afdelingen). Vælg hvilke antagelser milepælen tester, skriv resultatet, og træf beslutningen: Fortsæt, Justér eller Stop, med begrundelse. |
| 4 | **Sådan er det bygget** | Beskriv kort hvad værktøjet gør, tech stack som tags, dele andre kan genbruge, links, læringer og kontaktperson. Markér værktøjet som "i drift", når det bruges. Alle felter er frivillige. |
| 5 | **Evaluering** | Fire spørgsmål på en skala fra 1 til 5 om, hvorvidt metoden hjalp, plus et fritekstfelt. Hver bruger svarer for sig selv, og fanen viser gennemsnittet. |

### Gevinstregnskabet

Beregningen går baglæns fra den krævede gevinst:

- Krævet bruttogevinst = krævet nettogevinst ÷ gevinstmargin. Marginen er den andel af bruttogevinsten, der skal være tilbage, når omkostningerne er trukket fra. Med 50 % margin skal projektet give dobbelt så meget, som det koster.
- Tilladte omkostninger pr. år = bruttogevinst minus nettogevinst.
- Krævede sparede timer = bruttogevinst ÷ timepris, fordelt på brugere og arbejdsuger.
- Forventede omkostninger = udvikling fordelt over levetiden + vedligehold + drift og licenser.

Ligger de forventede omkostninger under de tilladte, hviler projektet på, at tidsbesparelsen faktisk opnås. Nulpunktet viser, hvor lidt hver bruger skal spare, før værktøjet bare dækker sig selv.

### Status

Projektets status udledes af den seneste beslutning ved en milepæl:

| Status | Hvornår |
|---|---|
| Under planlægning | Ingen antagelser endnu |
| I test | Antagelser findes, men ingen beslutning er truffet |
| Fortsætter / Justeres / Stoppet | Seneste beslutning var Fortsæt, Justér eller Stop |
| I drift | Seneste beslutning var Fortsæt, og værktøjet er markeret i drift under "Sådan er det bygget" |

### Forsiden

- **Projekter** viser alle projekter med afdeling, status, antal testede antagelser og næste milepæl. Søg i navn, filtrér på afdeling og status, og sortér efter seneste ændring, navn eller hvor langt projektet er.
- **Værktøjskatalog** viser de projekter, der har udfyldt "Sådan er det bygget", nyeste først. Filtrér på afdeling, teknologi eller fritekst for at finde noget, der ligner det, du skal lave.

### Demo og live

I toppen kan man skifte mellem **Demo** og **Live**.

- **Live** er de rigtige projekter fra serveren. Ændringer gemmes med det samme, og kolleger ser dem inden for få sekunder.
- **Demo** viser seks opdigtede projekter i forskellige faser. Man kan ændre i dem, men intet gemmes, og alt nulstilles ved genindlæsning. Demo skriver aldrig til serveren.

Hvert besøg starter i Live. Kører siden uden server (filen åbnet direkte), starter den i Demo. `#demo` i adressen åbner demo direkte.

## Kør værktøjet

Kræver Python 3.11 eller nyere.

```
powershell -ExecutionPolicy Bypass -File start.ps1
```

Åbn derefter http://localhost:8000. Første gang opretter scriptet et Python-miljø i `.venv` og installerer FastAPI. Data gemmes i `ddp.db` (SQLite) i projektmappen. Slet filen for at starte forfra.

Fejler installationen første gang, står `.venv` tilbage uden pakker, og scriptet springer installationen over næste gang. Kør så installationen manuelt:

```
.venv\Scripts\python -m pip install -r requirements.txt
```

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
  styles.css     Design og farver (variabler under :root). Altid lys, uanset systemets farvetema
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

## Vigtige steder i app.js

- `CATS`, `STATUS`, `DEC`, `REV_DEFAULT`, `FQ`: kategorier, statusser, beslutninger, standardtal og evalueringsspørgsmål.
- `calc()`: det omvendte gevinstregnskab (krævet gevinst → tilladte omkostninger → krævede sparede timer).
- `status()`: projektets status. "I drift" vises, når værktøjet er markeret i drift, og den seneste beslutning er "Fortsæt".
- `tabRev`, `tabAss`, `tabMs`, `tabBuild`, `tabEval`: de fem trin i et projekt.
- `renderCatalog()` / `catalogItems()`: værktøjskataloget og dets filtre.
- `setMode()` / `applyMode()`: skift mellem demo og live. `inMemory()` afgør, om ændringer kun gemmes i hukommelsen.
- `queuePatch()` / `flush()`: gemmer ændringer (samlet og én ad gangen pr. projekt).
- `render()`: tegner hele siden om og gendanner fokus og markør i det felt, man stod i.
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
- Hver maskine, der kører sin egen server, har sin egen database. Skal flere dele data, skal de bruge samme server.

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

## Metoden: Discovery-Driven Planning

Discovery-Driven Planning (DDP) blev beskrevet af Rita Gunther McGrath og Ian C. MacMillan i Harvard Business Review i 1995 og udbygget i bogen *Discovery-Driven Growth* fra 2009. Afsnittet her forklarer metodens trin, hvorfor de findes, og hvordan værktøjet bruger dem. Kilderne står nederst i afsnittet.

### Hvorfor konventionel planlægning svigter i nye projekter

Artiklen åbner med tre kendte fiaskoer: Disneys europæiske forlystelsespark havde tabt over en milliard dollar efter to år, Federal Express tabte 600 millioner dollar på faxproduktet Zap-mail, og Polaroid tabte 200 millioner dollar på instant-film. Forfatternes pointe er, at virksomhederne planlagde de nye satsninger, som om de var kendte forretninger: med detaljerede budgetter og prognoser, der blev behandlet som fakta.

Det går galt, fordi forholdet mellem antagelser og viden er omvendt i nye projekter. I en kendt forretning bygger planen på erfaring, og afvigelser er fejl, der skal rettes. I et nyt projekt bygger planen på gæt, og afvigelser er ny viden. McGrath og MacMillan kalder den første form for planlægning *platform-based planning*: man står på en platform af viden og planlægger derfra. Den passer ikke til projekter, hvor platformen ikke findes endnu.

Interne, AI-assisterede udviklingsværktøjer er netop sådanne projekter. Ingen ved på forhånd, om kollegerne vil bruge værktøjet, hvor meget tid det sparer, eller hvor meget vedligehold det kræver. Derfor er DDP valgt som metode.

### Grundidéen

DDP vender logikken om: man planlægger for at lære, ikke for at forudsige. Planen er en samling antagelser, der gøres eksplicitte og testes billigst muligt først. Penge og tid frigives i små portioner, og hver portion skal købe viden, der afgør, om den næste er værd at bruge. McGrath og MacMillan formulerer det som, at man skal omdanne antagelser til viden til lavest mulige omkostning.

Det bygger videre på Block og MacMillans tidligere arbejde fra 1985 om milepæle i venturer, hvor en milepæl ikke er en leverance, men et punkt, hvor noget centralt bliver afgjort.

### Metodens fire dokumenter og det femte trin

Artiklen fra 1995 beskriver fire dokumenter, der hænger sammen, og en disciplin til at holde dem opdaterede. Bogen fra 2009 beholder kernen, men tilføjer et indledende trin, hvor man rammer satsningen ind (*framing*) og sammenligner med kendte tal (*benchmarking*), før man regner.

**1. Den omvendte resultatopgørelse (reverse income statement).**
*Hvad:* I stedet for at estimere omsætning og omkostninger og se, hvad der bliver tilbage, starter man med den gevinst, projektet skal give for at være umagen værd. Derfra regner man baglæns: hvilken bruttogevinst kræver det, og hvad må projektet så højst koste?
*Hvorfor:* Et almindeligt budget starter med det, man tror, man kan opnå, og ender ofte med et resultat, der ser fint ud på papiret. Det omvendte regnestykke tvinger én til at tage stilling til, hvad der *skal* være sandt, og gør kravene synlige, før der er brugt penge. Det er også her, projektet kan stoppes tidligst: hvis de krævede tal er urealistiske, er der ingen grund til at gå videre.
*I værktøjet:* Fanen **Gevinstregnskab**. Krævet nettogevinst og margin giver bruttogevinst og tilladte omkostninger, og timeprisen oversætter det til, hvor mange timer hver bruger skal spare om ugen.

**2. Specifikation af driften (pro forma operations specifications).**
*Hvad:* Hvilke aktiviteter skal der til for at levere gevinsten, og hvad koster de? For et internt værktøj er det udviklingstid, engangsudgifter, vedligehold og drift.
*Hvorfor:* Omkostningerne i det omvendte regnestykke må ikke være et rundt tal. De skal udledes af, hvad der faktisk skal gøres, så man kan se, om de tilladte omkostninger er nok til at gøre det.
*I værktøjet:* Felterne under **Forventede omkostninger** på gevinstfanen. Værktøjet sammenligner dem med de tilladte omkostninger og viser, om der er plads, og hvad nulpunktet er.

**3. Tjeklisten over nøgleantagelser (key assumptions checklist).**
*Hvad:* Hver antagelse, som regnestykket og driften hviler på, skrives ned som en konkret, testbar påstand: hvor mange brugere, hvor mange sparede timer, hvor mange udviklingstimer, hvor meget vedligehold.
*Hvorfor:* Antagelser, der ikke er skrevet ned, bliver til fakta i folks hoveder. Listen gør det muligt at prioritere: de antagelser, der betyder mest og er mest usikre, skal testes først, fordi de kan vælte projektet billigst. Listen er også det sted, hvor ny viden skrives ind, så planen ændrer sig, når virkeligheden gør.
*I værktøjet:* Fanen **Antagelser**. Hver antagelse har kategori, betydning, usikkerhed, forventet og faktisk værdi og en status. Knappen "Lav antagelser ud fra tallene" laver de første antagelser direkte fra gevinstregnskabet, så regnestykke og antagelser hænger sammen fra start.

**4. Milepælsplanen (milestone planning chart).**
*Hvad:* En plan over milepæle, hvor hver milepæl er knyttet til de antagelser, den tester. Milepælene lægges, så de vigtigste og mest usikre antagelser testes først og billigst.
*Hvorfor:* En milepæl er i DDP ikke "prototypen er færdig", men "ved prototypen finder vi ud af, om brugerne forstår og vil bruge løsningen". Den kobling gør, at man ved, hvad man skal måle, og at man ikke bygger videre på antagelser, der aldrig blev testet. Det er samtidig her, pengene frigives: hver milepæl giver grundlag for at beslutte, om den næste portion er værd at bruge.
*I værktøjet:* Fanen **Milepæle og beslutninger**. Hver milepæl vælger, hvilke antagelser den tester, og de fire standardmilepæle (kortlæg arbejdsgang, klikbar prototype, MVP i brug, pilot) følger princippet om billigste test først.

**5. Opdatering og beslutning ved hver milepæl.**
*Hvad:* Når en milepæl er nået, føres resultatet tilbage i antagelseslisten og regnestykket. Holder antagelsen? Holder den delvist? Holder den ikke? Derefter træffes en beslutning: fortsæt, justér planen, eller stop.
*Hvorfor:* Det er den disciplin, der adskiller DDP fra at lave en plan og lægge den i skuffen. McGrath og MacMillan lægger vægt på, at det skal være legitimt at stoppe eller ændre retning, og at det skal ske tidligt, mens det er billigt. Bogen fra 2009 kalder det at vide, hvornår man skal trække sig fra et tvivlsomt projekt, før det er for sent. En plan, der aldrig fører til et stop, er ikke blevet testet.
*I værktøjet:* Status på hver antagelse, og beslutningen Fortsæt, Justér eller Stop på hver milepæl, med begrundelse, navn og tidspunkt. Projektets samlede status udledes af den seneste beslutning.

### Hvad værktøjet tilføjer ud over metoden

To faner er ikke en del af DDP, men er tilføjet til formålet her:

- **Sådan er det bygget** samler viden om de færdige værktøjer, så andre afdelinger kan genbruge dele og undgå at bygge det samme igen.
- **Evaluering** spørger brugerne, om metoden hjalp dem med at se kravene, beslutte og teste. Svarene er empiri om, hvordan DDP fungerer på små, interne AI-projekter.

### Forholdet til Lean Startup

DDP er fra 1995 og deler grundidé med den senere Lean Startup-tilgang: byg småt, test antagelser, og lær hurtigt. McGrath har selv beskrevet sammenhængen og forskellene i en artikel fra 2024. Den væsentligste forskel for dette værktøj er, at DDP starter med økonomien, det omvendte regnestykke, og lader den afgøre, hvilke antagelser der er værd at teste.

### Kilder

- McGrath, R. G. & MacMillan, I. C. (1995). Discovery-Driven Planning. *Harvard Business Review*, 73(4), juli–august 1995, s. 44–54. https://hbr.org/1995/07/discovery-driven-planning
- McGrath, R. G. & MacMillan, I. C. (2009). *Discovery-Driven Growth: A Breakthrough Process to Reduce Risk and Seize Opportunity*. Harvard Business Press.
- Block, Z. & MacMillan, I. C. (1985). Milestones for Successful Venture Planning. *Harvard Business Review*, 63(5), s. 84–90.
- McGrath, R. G. (2024). Who Learns Fastest, Wins: Lean Startup and Discovery Driven Growth. *Journal of Management*, 50(8), s. 3162–3182.
- Wikipedia: Discovery-driven planning. https://en.wikipedia.org/wiki/Discovery-driven_planning (oversigt og litteraturliste)

## Sådan bruger du det

### Første gang

Siden spørger om dit navn. Det vises ved projekter, beslutninger og evalueringer, så kolleger kan se, hvem der har gjort hvad. Der er ingen adgangskode; navnet gemmes i browseren og på serveren.

### Opret et projekt

Nederst på forsiden udfylder du projektnavn, afdeling og det problem, værktøjet skal løse. Projektet åbner i trin 1.

### De fem trin i et projekt

| Trin | Fane | Det gør du |
|---|---|---|
| 1 | **Gevinstregnskab** | Skriv krævet nettogevinst, gevinstmargin, timepris, antal brugere og forventede omkostninger. Værktøjet viser med det samme, hvor mange timer hver bruger skal spare om ugen, råderummet pr. år og hvornår udviklingen er tjent hjem. Knappen "Lav antagelser ud fra tallene" opretter de første antagelser automatisk. |
| 2 | **Antagelser** | Skriv de forudsætninger, projektet hviler på. Hver antagelse har en kategori (Gevinst, Brug og adoption, Omkostning, Teknisk, Organisatorisk), betydning og usikkerhed (Lav, Mellem, Høj), forventet og faktisk værdi, og en status: Ikke testet, Holder, Holder delvist eller Holder ikke. |
| 3 | **Milepæle og beslutninger** | Opret milepæle, eller brug de fire standardmilepæle (kortlæg arbejdsgang, klikbar prototype, MVP i brug, pilot i afdelingen). Vælg hvilke antagelser milepælen tester, skriv resultatet, og træf beslutningen: Fortsæt, Justér eller Stop, med begrundelse. |
| 4 | **Sådan er det bygget** | Beskriv kort hvad værktøjet gør, tech stack som tags, dele andre kan genbruge, links, læringer og kontaktperson. Markér værktøjet som "i drift", når det bruges. Alle felter er frivillige. |
| 5 | **Evaluering** | Fire spørgsmål på en skala fra 1 til 5 om, hvorvidt metoden hjalp, plus et fritekstfelt. Hver bruger svarer for sig selv, og fanen viser gennemsnittet. |

### Gevinstregnskabet

Beregningen går baglæns fra den krævede gevinst:

| Begreb | Beregning |
|---|---|
| Krævet bruttogevinst | krævet nettogevinst ÷ gevinstmargin. Marginen er den andel af bruttogevinsten, der skal være tilbage, når omkostningerne er trukket fra. Med 50 % margin skal projektet give dobbelt så meget, som det koster |
| Tilladte omkostninger pr. år | bruttogevinst − nettogevinst |
| Krævede sparede timer | bruttogevinst ÷ timepris, fordelt på brugere og arbejdsuger |
| Løbende omkostninger pr. år | vedligehold × 12 × timepris + drift og licenser × 12 |
| Råderum pr. år | tilladte − løbende |
| Engangsudgift | udviklingstimer × timepris + andre engangsudgifter |
| Tilbagebetalingstid | engangsudgift ÷ råderum pr. år, vist i måneder (eller år, når over 24 måneder). "Aldrig", hvis råderummet er nul eller negativt |

Der indgår ingen levetid. Man håber, at et internt værktøj holder, så længe behovet findes, så i stedet for at fordele udviklingen over et gættet antal år viser værktøjet, hvor hurtigt engangsudgiften er tjent hjem.

Er råderummet positivt, hviler projektet på, at tidsbesparelsen faktisk opnås. Nulpunktet viser, hvor lidt hver bruger skal spare, før værktøjet bare dækker sine løbende omkostninger.

### Status

Projektets status udledes af den seneste beslutning ved en milepæl:

| Status | Hvornår |
|---|---|
| Under planlægning | Ingen antagelse er testet, og ingen beslutning er truffet |
| I test | Mindst én antagelse er testet, men ingen beslutning er truffet |
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
  rev:        { targetNet, marginPct, rate, users, weeks, devHours, oneTime, maintHours, runMonthly, lifetime? (gammelt felt, læses ikke) },
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

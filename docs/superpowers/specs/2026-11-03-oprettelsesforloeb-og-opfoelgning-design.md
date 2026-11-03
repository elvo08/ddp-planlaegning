# Oprettelsesforløb, opfølgning og noter i DDP-planlægning

Dato: 2026-11-03

## Hvorfor

I dag er et projekt fem faner, der alle kan redigeres hele tiden. Det, man skal udfylde fra start (gevinstregnskab, antagelser, milepælsplan), står side om side med det, der først kommer undervejs (status på antagelser, resultat og beslutning ved milepæle, hvordan værktøjet er bygget, evaluering). Det er svært at se, hvad man skal gøre nu, og hvad der kommer senere, og plantal kan ændres ved et uheld midt i opfølgningen.

Samtidig mangler der et sted at skrive kontekst. En antagelse eller en milepæl har tit brug for en forklaring, som ikke passer i de faste felter.

## Mål

1. **Oprettelse som ét guidet forløb.** Man opretter et projekt ved at gå igennem fire trin (projekt, gevinst, antagelser, milepæle) og ender med et færdigt projekt. Det er planen i DDP-forstand.
2. **Projektsiden er opfølgning.** Når man vender tilbage, ser man én side, der handler om at teste antagelser, beslutte ved milepæle, dokumentere det byggede og evaluere. Planen vises som opsummering og rettes via et særskilt "Ret planen".
3. **Noter.** Man kan skrive en note med navn og tidspunkt på projektet, på hver antagelse og på hver milepæl.

## Ikke-mål

- Ingen ændringer af server, API eller database. Alt nyt ligger i projektets JSON-dokument og dækkes af de eksisterende `PUT`/`PATCH`.
- Ingen kladder. Et forløb, der ikke afsluttes med "Opret projekt", gemmes ikke.
- Ingen rettigheder på noter. Alle kan skrive og slette alle noter, som alt andet i værktøjet.
- Ingen ændringer af forsiden ud over, at "Opret projekt" åbner forløbet.
- Ingen ændringer af værktøjskataloget eller demo/live-skiftet.

## Anti-mål (ville være en fejl, selvom det virker)

- Opfølgningsdata må aldrig gå tabt, når planen gemmes. "Ret planen" må kun skrive plantal, antagelsernes plandel og milepælenes plandel. Status, faktiske værdier, resultater, beslutninger, noter, "Sådan er det bygget" og evalueringer rører den ikke.
- En milepæl med en truffet beslutning må ikke kunne slettes fra planen, og en antagelse med status må ikke kunne slettes. Så forsvinder empiri ikke.
- Demo må stadig aldrig skrive til serveren, heller ikke fra forløbet eller noter.
- Det må aldrig være uklart, om man er i gang med at oprette, rette planen eller følge op.
- Eksisterende projekter i databasen skal virke uændret, uden migrering. Manglende felter behandles som tomme.

## Rammer

- Samme opbygning som i dag: ren HTML, CSS og JavaScript uden biblioteker i `src/`. `build.ps1` samler det til `dist/`.
- Alt brugervendt sprog er dansk, i samme tone som resten.
- Datamodellen udvides kun med nye, valgfrie felter.
- Tests: `tests/tests.html` (browser, falsk backend) og `server/test_main.py` (uændret). Alle eksisterende tests, der refererer til faner eller formularen "Nyt projekt", skrives om til den nye struktur.
- Mappen er et git-repo. Hver afsluttet del committes.

## Det besluttede

### 1. Oprettelsesforløbet

**Indgang.** Knappen "Opret projekt" på forsiden åbner forløbet. Formularen "Nyt projekt" nederst på forsiden fjernes. Adressen er `#nyt` (i demo `#demo-nyt`).

**Fire trin** med en trinviser øverst (1 Projekt, 2 Gevinst, 3 Antagelser, 4 Milepæle), knapperne "Tilbage" og "Næste" nederst, og et link "Annullér", der går tilbage til forsiden uden at gemme.

| Trin | Felter | Noter |
|---|---|---|
| 1 Projekt | Projektnavn (krævet), afdeling, hvilket problem værktøjet skal løse | Som i dag. Navn er det eneste krævede felt i hele forløbet. |
| 2 Gevinst | Felterne fra `rev` undtagen levetid (ni tal), se afsnit 7 | Resultatpanelet vises og opdateres med det samme, som på gevinstfanen i dag, men med indholdet fra afsnit 7. |
| 3 Antagelser | Liste af antagelser med tekst, kategori, betydning, usikkerhed, forventet værdi | Trinnet starter tomt med knappen "Lav antagelser ud fra tallene" (samme logik som i dag) og "Tilføj antagelse". Prioriteringsmatrixen og listen "Test i denne rækkefølge" vises under listen som planlægningshjælp (uden status-markeringer, da intet er testet endnu). Status og faktisk værdi vises ikke her; de hører til opfølgningen. |
| 4 Milepæle | Liste af milepæle med navn, beskrivelse, dato, budget og hvilke antagelser milepælen tester | Trinnet starter tomt med knapperne "Brug standardmilepælene" (de fire fra i dag) og "Tilføj milepæl". Resultat og beslutning vises ikke her. |

**Afslutning.** På trin 4 hedder knappen "Opret projekt". Den samler alt til ét projekt og skriver det med ét `PUT` (som `createProject` i dag). Derefter åbnes projektsiden.

**Tilstand.** Forløbet holder sine data i hukommelsen (en `draft`), ikke i `projects`. Intet skrives, før man trykker "Opret projekt". Genindlæser man siden, er kladden væk. Det er bevidst.

**Validering.** Går man videre fra trin 1 uden navn, vises en toast, og feltet får fokus. Alt andet er valgfrit.

### 2. "Ret planen"

- Projektsiden har knappen "Ret planen" ved planopsummeringen. Den åbner det samme forløb med projektets data fyldt ind. Adressen er `#p-<id>-plan`.
- Trinviser, "Tilbage" og "Næste" er de samme. Den sidste knap hedder "Gem planen", og "Annullér" går tilbage til projektsiden.
- "Gem planen" skriver ét `PATCH` med `name`, `department`, `description`, `rev`, samt antagelsernes og milepælenes plandel. Fordi `PATCH` fletter objekter, bevares status, faktisk værdi, resultat, beslutning og noter på de id'er, der allerede findes. Fjernede antagelser og milepæle markeres `deleted: true` (som i dag), ikke slettet fra dokumentet.
- Antagelser med en status (andet end "Ikke testet") og milepæle med en beslutning kan ikke fjernes i forløbet. Deres slet-knap er væk, og en lille tekst siger hvorfor.
- Alle felter kan redigeres på trin 1 og 2. På trin 3 og 4 kan alt i plandelen redigeres, også på antagelser og milepæle, der allerede er testet eller besluttet.

### 3. Projektsiden (opfølgning)

Fanerne fjernes. Projektsiden er én side med sektioner i denne rækkefølge. Adressen er `#p-<id>`. De gamle adresser `#p-<id>-gevinst`, `-antagelser`, `-milepaele`, `-bygget` og `-evaluering` virker stadig og ruller ned til den tilsvarende sektion (`-gevinst` til planopsummeringen).

**Hoved.** Projektnavn, afdeling, statuschip (som i dag), "Oprettet af … den …", og "Næste milepæl: …" (den første milepæl uden beslutning, sorteret som i dag). Knappen "Slet projekt" flyttes til bunden af siden som i dag.

**Noter på projektet.** Se afsnit 4.

**Planen.** En boks med overskriften "Planen". Øverst problembeskrivelsen (`description`) som almindelig tekst, så den kan læses uden at åbne "Ret planen" (projekthovedet er uændret: navn, afdeling, status). Derunder tallene fra `calc()` med begreberne fra afsnit 7: krævet nettogevinst, tilladte omkostninger pr. år, løbende omkostninger pr. år, råderum pr. år, engangsudgift og tilbagebetalingstid, samt krævede sparede timer pr. bruger pr. uge, og "tjent hjem efter …"-linjen fra afsnit 7. Knappen "Ret planen" sidder i boksen. Ingen redigérbare felter her.

**Antagelser.** Overskrift med "x af y testet". Prioriteringsmatrixen (betydning × usikkerhed med ✓/½/✕ ud fra status) beholdes øverst i sektionen som i dag, fordi den giver overblikket over, hvad der er testet. Listen "Test i denne rækkefølge" flyttes til forløbets trin 3 og vises ikke her. Hver antagelse viser tekst, kategori og betydning/usikkerhed som chips (ikke redigérbare), feltet "Faktisk" og status-vælgeren (Ikke testet, Holder, Holder delvist, Holder ikke), som i dag. Forventet værdi vises som tekst. Noter på hver antagelse, se afsnit 4. Ingen "Tilføj antagelse" her; nye antagelser laves via "Ret planen".

**Milepæle.** Milepælsstien (noderne øverst) beholdes som i dag. Listen som i dag, sorteret efter dato og rækkefølge. Hver milepæl er en foldbar blok (`details`, som i dag). Den næste milepæl (første uden beslutning) er åben og markeret "Næste". Milepæle med beslutning er foldet sammen og viser beslutningen som chip i overskriften. Inde i blokken: beskrivelse, dato og budget som tekst; derefter de antagelser, milepælen tester, med felterne "Faktisk" og status for hver, som i dag (det er DDP's trin 5: resultatet føres tilbage i antagelseslisten ved milepælen, og felterne er de samme `a.<id>.actual`/`a.<id>.status` som i Antagelser-sektionen); feltet "Resultat", beslutningen (Fortsæt, Justér, Stop) med begrundelse, "Besluttet af … den …" og "Fortryd beslutning" som i dag. Noter på hver milepæl, se afsnit 4. Ingen "Tilføj milepæl" her; nye milepæle laves via "Ret planen".

**Status.** Fordi alle nye projekter nu har antagelser fra start, ændres `status()`: "Under planlægning" gælder, indtil mindst én antagelse har en status forskellig fra "Ikke testet" eller en beslutning er truffet; "I test" gælder derefter, indtil første beslutning. Resten er uændret. README's statustabel, statusfiltret og demodata (mindst ét demoprojekt skal stå "Under planlægning") følger med.

**Sådan er det bygget.** Som fanen i dag, uændret indhold.

**Evaluering.** Som fanen i dag, med én tilføjet linje øverst: "Evalueringen er tænkt til, når I har truffet mindst én beslutning ved en milepæl." Den låses ikke.

**Slet projekt.** Nederst, som i dag.

### 4. Noter

- Tre steder: på projektet (under hovedet), på hver antagelse og på hver milepæl.
- Hvert sted viser eksisterende noter som en kort liste, ældste øverst: tekst, navn og tidspunkt (`fmtTs` som ved beslutninger). Under listen et tekstfelt med knappen "Tilføj note". Enter i feltet tilføjer også (Shift+Enter giver linjeskift).
- En note har en lille "Slet"-knap. Sletning er blød (`deleted: true`).
- Har man ikke skrevet sit navn (`myName` tom), vises noten med "En kollega", som andre steder. Noter kan skrives uden navn.
- Noter kan skrives i demo og gemmes kun i hukommelsen.
- Antallet af noter vises i parentes ved overskriften "Noter (3)", så man kan se, om der er kontekst, uden at folde ud. På antagelser og milepæle er notelisten foldet sammen, når der er nul noter, og foldet ud, når der er mindst én.

### 5. Datamodel

Nye, valgfrie felter. Alt andet er som i dag.

```
{ ...,
  notes: { <id>: { text, by, at, order, deleted? } },
  assumptions:{ <id>: { ..., notes: { <id>: { text, by, at, order, deleted? } } } },
  milestones: { <id>: { ..., notes: { <id>: { text, by, at, order, deleted? } } } } }
```

- `by` er bruger-id (`meId`) eller `null`. Navnet slås op via `nameOf` som ved beslutninger.
- `at` er `Date.now()`.
- `order` som på antagelser og milepæle, så rækkefølgen er stabil.
- Noter skrives med `queuePatch` med `delay = 0`, som andre strukturelle ændringer.

### 6. Forsiden

- Knappen "Opret projekt" åbner forløbet (`#nyt`). Formularen "Nyt projekt" fjernes.
- Projektlisten og filtrene er uændrede. "Næste milepæl"-kolonnen er uændret.
- Kataloget er uændret. "Se hvordan det er bygget" (`open-build`) åbner projektsiden rullet ned til "Sådan er det bygget".

### 7. Gevinstregnskabet uden levetid

"Forventet levetid" udgår som felt. Man håber, at et internt værktøj holder, så længe behovet findes, og tallet var et gæt, der ikke kunne testes.

Uden levetid kan udviklingen ikke fordeles ud pr. år. Regnestykket deles derfor i løbende og engangs:

| Begreb | Beregning |
|---|---|
| Tilladte omkostninger pr. år | bruttogevinst − nettogevinst (som i dag) |
| Løbende omkostninger pr. år | vedligehold × 12 × timepris + drift og licenser × 12 |
| Råderum pr. år | tilladte − løbende |
| Engangsudgift | udviklingstimer × timepris + andre engangsudgifter |
| Tilbagebetalingstid | engangsudgift ÷ råderum pr. år, vist i måneder (eller år, når over 24 måneder) |

Resultatpanelet viser: timer pr. bruger pr. uge (uændret), tilladte omkostninger pr. år, løbende omkostninger pr. år, råderum pr. år, engangsudgift og tilbagebetalingstid. Søjlerne "Tilladt" og "Forventet" sammenligner tilladte og løbende omkostninger pr. år. Teksten under siger fx "Udviklingen er tjent hjem efter 5 måneder. Derefter ligger omkostningerne 76.800 kr. under rammen om året." Er råderummet nul eller negativt, står der "Udviklingen bliver aldrig tjent hjem: de løbende omkostninger alene overstiger rammen."

Nulpunktet (hvor lidt hver bruger skal spare, før værktøjet dækker sig selv) beregnes ud fra de løbende omkostninger alene.

Feltet `lifetime` bliver i datamodellen og i gamle projekter, men læses ikke. `REV_DEFAULT` mister `lifetime`. Antagelsesforslagene ("Lav antagelser ud fra tallene") er uændrede, da ingen af dem bruger levetid.

### 8. Tests

Eksisterende tests, der skal ændres: alle, der bruger `#…-bygget`/`-evaluering` som fane (de skal stadig virke som adresser, men siden har ikke faner), `data-act="tab"`, `np-name`/`data-act="create"` på forsiden, "demo dækker alle faser" (demodata skal følge den nye statusregel), og de design-tests, der tjekker matrix-chips og projekthovedet (hovedet er uændret, matrixen bliver i Antagelser-sektionen).

Nye tests, mindst:

- Forløbet: "Opret projekt" uden navn giver toast og ingen skrivning. Med navn og tal på alle trin skriver det ét `set` med `rev`, `assumptions` og `milestones` udfyldt, og projektsiden åbnes.
- "Annullér" i forløbet skriver intet, og `projects` er uændret.
- "Ret planen": ændret timepris og en ny antagelse giver ét `update`, der ikke indeholder `status`, `actual`, `result`, `decision`, `notes`, `build` eller `feedback`, og som bevarer eksisterende id'er.
- "Ret planen": en antagelse med status "Holder" og en milepæl med beslutning har ingen slet-knap.
- Projektsiden: ingen redigérbare `rev`-felter; "Ret planen" findes; næste milepæl er åben og markeret; problembeskrivelsen står i planboksen, ikke i hovedet.
- `status()`: et nyt projekt med antagelser, men uden status på nogen af dem, er "Under planlægning"; når én antagelse får status "Holder", er det "I test".
- Noter: "Tilføj note" på projekt, antagelse og milepæl skriver `notes.<id>` med `text`, `by`, `at`; listen viser navn og tidspunkt; "Slet" sætter `deleted`.
- Gamle adresser: `#p-<id>-bygget` åbner projektsiden og ruller til sektionen.
- Demo: forløbet og noter skriver intet til `__writes`.
- `calc()`: med givne tal giver råderum, engangsudgift og tilbagebetalingstid de forventede værdier; råderum ≤ 0 giver "aldrig"; et gammelt projekt med `lifetime` i `rev` regnes uden at bruge det.

## Overladt til den der bygger

- Hvordan `draft` opbevares og bindes til felterne i forløbet. Det er fint at genbruge `data-k` og `onField`, så længe forløbets felter aldrig rammer `queuePatch`, før "Opret projekt"/"Gem planen".
- Hvordan de fire tal i planboksen formateres og placeres. `revOut()` kan genbruges i en kortere form.
- Om trin 3 og 4 i forløbet genbruger markup fra de nuværende `tabAss` og `tabMs`, eller får deres egen. Plandelen og opfølgningsdelen skal bare være tydeligt adskilt i koden.
- Præcis tekst på toasts, tomme tilstande og hjælpetekster, i samme tone som i dag.
- Hvordan "rul til sektion" laves ved de gamle adresser (`scrollIntoView` på sektionens overskrift er nok).
- Hvordan README og demo-data opdateres. Demoprojekterne må gerne få et par noter, så demoen viser funktionen.

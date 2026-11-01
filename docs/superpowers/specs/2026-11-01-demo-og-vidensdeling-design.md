# Demo-visning og vidensdeling i DDP-planlægning

Dato: 2026-11-01

## Hvorfor

Værktøjet virker, men en ny bruger, en vejleder eller en censor møder i dag en tom side. Man kan ikke se, hvordan det ser ud, når det har været i brug i et stykke tid, med projekter i forskellige faser og beslutninger truffet undervejs.

Samtidig mangler der et sted at dele, hvordan de interne værktøjer faktisk er bygget. Skal man fx lave noget til Indkøb, skal man kunne se, hvad der allerede er lavet i andre afdelinger, hvordan det virker, hvilken tech stack det bruger, og hvad der kan genbruges.

## Mål

1. **Demo/live-skift.** Man kan skifte mellem en demo-visning med opdigtede, realistisk udfyldte projekter og den rigtige, fælles live-visning.
2. **"Sådan er det bygget".** Hvert projekt får en ny fane, der beskriver værktøjet teknisk og deler viden.
3. **Værktøjskatalog.** Forsiden får et katalog, hvor man kan se de dokumenterede værktøjer på tværs af afdelinger og filtrere i dem.

## Ikke-mål

- Værktøjet læser ikke selv kode, repoer eller systemer. Alt i "Sådan er det bygget" udfyldes i hånden.
- Ingen upload af filer eller billeder.
- Ingen ændringer af login, adgang eller deling.

## Anti-mål (ville være en fejl, selvom det virker)

- Demodata må **aldrig** skrives til den fælles database. Det gælder også evalueringssvar, som bruges som empiri i opgaven.
- Det må aldrig være uklart, om man ser demo eller live. Man skal ikke kunne tro, man arbejder i rigtige data, når man er i demo, eller omvendt.
- Kataloget må ikke blive en tung ekstra opgave. Felterne skal være få og frivillige.

## Rammer

- Samme opbygning som i dag: ren HTML, CSS og JavaScript uden biblioteker i `src/`. `build.js` samler det til én fil i `dist/`, som publiceres på den eksisterende artefakt-URL (https://claude.ai/artifact/58Z6umqtuLCJQWiP8W8Bw3). Linket skal blive ved med at virke.
- Alt brugervendt sprog er dansk, i samme tone som resten af værktøjet.
- Eksisterende projekter i databasen skal fortsat virke uden migrering. Nye felter er valgfrie, og manglende felter behandles som tomme.
- Node.js er ikke installeret på Emils maskine. Bygningen skal derfor også kunne gøres uden Node (se "Overladt til den der bygger").
- Mappen er et git-repo. Hver afsluttet del committes.

## Det besluttede

### 1. Demo/live-skift

- I toppen står et skift med to valg: **Demo** og **Live**.
- Demo viser et fast sæt opdigtede projekter, der ligger i koden. Man kan klikke rundt og ændre i dem, men intet gemmes. Alt nulstilles ved genindlæsning.
- Live er værktøjet, som det virker i dag med den fælles database.
- Mens man er i demo, står der et tydeligt banner øverst: "Du ser demodata. Ændringer gemmes ikke." (Jeg har valgt teksten.)
- Demo og live blandes aldrig i samme liste.

Mine valg (kan rettes):
- **Startvisning:** Hvert nyt besøg starter i Live, når databasen er tilgængelig. Uden database (filen åbnet lokalt) starter den i Demo. Valget huskes **ikke** mellem besøg, så ingen ved et uheld ender i demo og mister evalueringssvar eller ændringer.
- **Direkte link:** `#demo` i adressen åbner demo-visningen direkte, hvis claude.ai sender adressens `#`-del videre til siden. Det er ikke afprøvet. Det tjekkes efter første publicering. Virker det ikke, er skiftet i toppen vejen ind i demo, og der laves ikke noget alternativ i denne omgang. Et `#demo`-besøg huskes heller ikke.
- I demo virker "Slet projekt", "Opret projekt" osv. som normalt, men kun i hukommelsen.

### 2. Fanen "Sådan er det bygget"

Ny fane som trin 4. Evaluering bliver trin 5. Fanen har disse felter, alle frivillige:

| Felt | Type | Formål |
|---|---|---|
| Hvad værktøjet gør | tekst, 2–3 linjer | Kort beskrivelse til kataloget |
| Tech stack | tags | Fx Python, Shopify API, Google Sheets, Claude API |
| Dele andre kan genbruge | tekst | Fx "Shopify-udtræk", "prompt-skabelon" |
| Links | tekst | Kode, dokumentation, demo |
| Læring og faldgruber | tekst | Hvad man skal vide, hvis man bygger noget lignende |
| Kontaktperson | tekst | Hvem man kan spørge |
| I drift | afkrydsning | Markerer, at værktøjet bruges i hverdagen |

Mine valg:
- Tech stack indtastes som tags. Feltet foreslår tags, der allerede er brugt i andre projekter, så samme teknologi staves ens.
- "I drift" erstatter **kun** statussen "Fortsætter": Når "I drift" er sat, og den seneste beslutning er "Fortsæt", vises status som **I drift** (grøn). Alle andre statusser (Under planlægning, I test, Justeres, Stoppet) vises uændret, også selvom feltet er sat. Det gælder overalt, hvor status vises: projektlisten, projektets top, katalogkortene og eksporten.

### 3. Værktøjskatalog

- Forsiden får to faner: **Projekter** (listen fra i dag) og **Værktøjskatalog**.
- Kataloget viser kort for hvert projekt, hvor "Hvad værktøjet gør" eller "Tech stack" er udfyldt. Stoppede projekter er med, fordi deres læring også er værd at dele.
- Hvert kort viser navn, afdeling, status, kort beskrivelse, tech stack-tags og genbrugelige dele. Klik åbner projektet direkte på fanen "Sådan er det bygget".
- Man kan filtrere på afdeling og teknologi og søge i fritekst.

### 4. Demoindhold

5–6 opdigtede projekter fra forskellige afdelinger hos en webshop som Sinful, fx Indkøb, Kundeservice, Marketing, Økonomi og Lager. De skal tilsammen vise hele forløbet:

- ét under planlægning (kun gevinstregnskab og et par antagelser)
- ét eller to i test (milepæle i gang, nogle antagelser testet)
- ét, der er blevet justeret
- ét, der er stoppet, med en tydelig begrundelse og læring
- ét eller to i drift, med fuldt udfyldt "Sådan er det bygget"

Alle har realistiske tal i gevinstregnskabet, antagelser i forskellige felter af prioriteringsmatricen, milepæle med datoer, resultater og begrundede beslutninger, og et par evalueringssvar. Personer er opdigtede fornavne med afdeling. Ingen rigtige navne.

### 5. Datamodel

Nyt valgfrit felt på hvert projekt:

```
build: { summary, stack: [string], reusable, links, learnings, contact, live: bool }
```

Eksporten (JSON) tager `build` med. Eksport i demo eksporterer demodata.

## Overladt til den der bygger

- Hvor demodata ligger i koden (fx `src/demo.js`, som `build.js` lægger med ind i den samlede fil).
- Det præcise layout af kort, filtre og tag-felt, inden for værktøjets eksisterende design.
- Hvordan bygningen kan køres uden Node, fx et lille PowerShell-script, der gør det samme som `build.js`.
- Det konkrete indhold af demoprojekterne inden for rammerne ovenfor.
- Opdatering af `README.md`.

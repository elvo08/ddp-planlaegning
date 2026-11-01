# Demo-visning og vidensdeling – implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj et demo/live-skift med opdigtede projekter, en fane "Sådan er det bygget" pr. projekt og et værktøjskatalog på forsiden.

**Architecture:** Alt bliver i den eksisterende vanilla-JS-app (`src/app.js`, én IIFE). Demodata ligger i en ny `src/demo.js`, der sætter `window.DDP_DEMO`. Appen holder to projektsæt i hukommelsen (`liveProjects` fra databasen, `demoProjects` klonet fra `DDP_DEMO`), og `projects` peger på det aktive. I demo går alle skrivninger kun til hukommelsen. Appen eksponerer en lille `window.DDP`-krog, som en browserbaseret testside bruger.

**Tech Stack:** HTML, CSS og JavaScript uden biblioteker. Byg med PowerShell (`build.ps1`), fordi Node ikke er installeret. Test i en almindelig HTML-side (`tests/tests.html`), der køres i browseren via `python -m http.server`.

**Spec:** `docs/superpowers/specs/2026-11-01-demo-og-vidensdeling-design.md`

## Global Constraints

- Ingen eksterne biblioteker. Kun `src/index.html`, `src/styles.css`, `src/app.js` og den nye `src/demo.js`.
- Alt brugervendt sprog er dansk, i samme tone som resten af værktøjet.
- Demodata må aldrig skrives til den fælles database, heller ikke evalueringssvar.
- Bannerteksten i demo er præcis: "Du ser demodata. Ændringer gemmes ikke."
- Hvert nyt besøg starter i Live, når databasen er tilgængelig. Uden database starter det i Demo. Valget huskes ikke (ingen `localStorage` til mode).
- `#demo` i adressen åbner demo. Det tjekkes på claude.ai efter publicering; virker det ikke, laves intet alternativ.
- "I drift" erstatter kun "Fortsætter": når `build.live` er sat og den seneste beslutning er `fortsaet`, er status `["I drift","ok"]`.
- Nye felter er valgfrie; eksisterende projekter uden `build` skal virke uden migrering.
- Datamodel: `build: { summary, stack: [string], reusable, links, learnings, contact, live: bool }`.
- Demopersoner er opdigtede fornavne med afdeling. Ingen rigtige navne.
- Publicering sker til https://claude.ai/artifact/58Z6umqtuLCJQWiP8W8Bw3 fra `dist/ddp-planlaegning.html`.

## Review Focus

1. **Skift af visning midt i en redigering:** En live-ændring, der venter på sin 600 ms-forsinkelse, skal gemmes i databasen, før man skifter til demo. Den må hverken gå tabt eller ende i demodata. Test i Task 2.
2. **Live-opdatering mens man er i demo:** Når databasen sender nye data, mens man er i demo, opdateres `liveProjects`, men det man ser forbliver demo. Test i Task 2.
3. **Gamle projekter uden `build`:** Status, katalog og fanen må ikke fejle. Projektet vises bare ikke i kataloget. Test i Task 3 og Task 4.
4. **Bruger med kun læseadgang:** Kan redigere i demo, men er stadig låst i live. Test i Task 2.
5. **Tags med forskelligt store/små bogstaver:** "python" tilføjes ikke, hvis "Python" findes på projektet. Forslagslisten samler stavemåder, så første stavemåde vinder. Test i Task 3.

---

### Task 1: Byggescript og testopsætning

**Files:**
- Create: `build.ps1`
- Create: `src/demo.js` (midlertidigt: `window.DDP_DEMO={projects:{},people:{}};`)
- Create: `tests/tests.html`
- Modify: `src/index.html` (tilføj `<script src="demo.js"></script>` før `app.js`)
- Modify: `build.js` (samme indlejring af `demo.js`, så de to byggere giver samme resultat)
- Modify: `src/app.js` (eksponér `window.DDP`, se nedenfor)

**Interfaces:**
- Produces: `window.DDP = { state(): {mode, projects, liveProjects, demoProjects, view, canWrite}, render(), status(p), calc(r) }`. Senere tasks tilføjer funktioner til det samme objekt.
- Produces: testsiden `tests/tests.html` med `test(name, fn)` (asynkron er tilladt), `eq(a, b, msg)` og `ok(cond, msg)`. Resultatet skrives i `<pre id="results">`. Sidste linje er enten `ALLE N TESTS BESTÅET` eller `FEJL: x af N`.
- Produces: en falsk `window.claude`, som testsiden sætter op **før** `src/app.js` indlæses: `use("db")` returnerer et objekt, hvor `collection("projects").onSnapshot(cb)` gemmer `cb` i `window.__snap`, og `doc(path).update(p)` / `.set()` / `.delete()` logger `{op,path,p}` i `window.__writes`. `use("user")` returnerer `{id:()=>"me", can:()=>window.__canWrite!==false, me:()=>({name:"Test"}), profiles:()=>({})}`. `use("downloads")` returnerer `null`.
- Testsiden indeholder elementerne `#app`, `#crumb`, `#who`, `#toast` og indlæser `../src/demo.js` og `../src/app.js`.

- [ ] **Step 1: Skriv `tests/tests.html` med harness, falsk `claude` og en første test**

```js
test("appen starter i live med database", async () => {
  await tick(); // venter på boot
  window.__snap({docs:[], size:0, metadata:{fromCache:false}});
  eq(DDP.state().mode, "live");
});
```

- [ ] **Step 2: Start server og kør testen – forvent fejl**

Run (fra `ddp-planlaegning/`): `python -m http.server 8765` i baggrunden, og åbn `http://localhost:8765/tests/tests.html` i browserpanelet. Læs `#results`.
Expected: FEJL – `DDP is not defined`.

- [ ] **Step 3: Eksponér `window.DDP` i `src/app.js`, opdatér `index.html` og `build.js`, og opret `src/demo.js` og `build.ps1`**

`state().mode` er indtil videre altid `"live"`. `build.ps1` gør det samme som `build.js`: læser filerne som UTF-8, bruger `String.Replace` (ikke regex, så `$` i koden ikke tolkes), indlejrer `styles.css`, `demo.js` og `app.js` og skriver `dist/ddp-planlaegning.html` som UTF-8 **uden** BOM (`New-Object System.Text.UTF8Encoding $false`).

- [ ] **Step 4: Kør testen igen og byg**

Run: genindlæs testsiden. Kør derefter `powershell -ExecutionPolicy Bypass -File build.ps1`.
Expected: `ALLE 1 TESTS BESTÅET`. `dist/ddp-planlaegning.html` indeholder ingen `<script src=` og ingen `<link rel="stylesheet" href="styles.css">`, og de første tre bytes er ikke `EF BB BF`.

- [ ] **Step 5: Commit**

```bash
git add build.ps1 build.js src tests dist
git commit -m "Byggescript i PowerShell og browserbaserede tests"
```

### Task 2: Demo/live-skift

**Files:**
- Modify: `src/app.js` (tilstand, skrivninger, boot, hash, header-skift, banner)
- Modify: `src/index.html` (plads i headeren: `<span id="mode"></span>` før `#who`)
- Modify: `src/styles.css` (segmenteret skift `.seg` og bannerklassen `.banner.demo` i advarselsfarven `--warn-soft`/`--warn`)
- Test: `tests/tests.html`

**Interfaces:**
- Consumes: `window.DDP_DEMO = { projects: {<id>: projekt}, people: {<bruger-id>: navn} }` fra Task 1/5.
- Produces: `DDP.setMode(m: "demo"|"live")`: kalder `flushAll()` først, skifter `projects`, sætter `view.pid=null`, opdaterer hash og tegner.
- Produces: `DDP.queuePatch(id, patch, delay)` og `DDP.flushAll()` (de eksisterende funktioner).
- Produces: `canEdit(): boolean` = `mode==="demo" || canWrite`. Den erstatter `canWrite` alle steder, hvor der tjekkes, om man må redigere (`queuePatch`, `fieldset disabled`, klik-handleren og læseadgangsbanneret, som kun vises i live).
- Hash: demo-visning har præfikset `demo`: `#demo`, `#demo-katalog`, `#demo-p-<id>-<fane>`. Live som i dag: `#p-<id>-<fane>`, `#katalog`.
- Demopersoner: `DDP_DEMO.people` lægges ind i `names` ved opstart, så `nameOf()` virker for demoprojekter.

- [ ] **Step 1: Skriv de fejlende tests**

```js
test("skift til demo viser demoprojekter og skriver ikke til db", async () => {
  DDP.setMode("demo");
  const id = Object.keys(DDP.state().projects)[0];
  ok(id, "der findes demoprojekter"); // kræver mindst ét testprojekt i demo.js, se note
  window.__writes.length = 0;
  DDP.queuePatch(id, {name:"Ændret"}, 0); DDP.flushAll(); await tick();
  eq(window.__writes.length, 0, "ingen db-skrivninger i demo");
  eq(DDP.state().projects[id].name, "Ændret");
});
test("ventende live-ændring gemmes før skift til demo", async () => {
  DDP.setMode("live");
  window.__snap({docs:[fakeDoc("L1",{name:"Live"})], size:1, metadata:{fromCache:false}});
  window.__writes.length = 0;
  DDP.queuePatch("L1", {name:"Live 2"}); // 600 ms forsinkelse
  DDP.setMode("demo"); await tick();
  eq(window.__writes.length, 1); eq(window.__writes[0].path, "projects/L1");
  ok(!("L1" in DDP.state().projects), "live-projekt vises ikke i demo");
});
test("live-snapshot i demo ændrer ikke det viste", () => {
  DDP.setMode("demo");
  window.__snap({docs:[fakeDoc("L2",{name:"Ny"})], size:1, metadata:{fromCache:false}});
  ok(!("L2" in DDP.state().projects)); ok("L2" in DDP.state().liveProjects);
});
test("læseadgang: må redigere i demo, ikke i live", () => {
  window.__canWrite = false; DDP.setCanWrite(false);
  DDP.setMode("demo"); eq(document.querySelector("fieldset.all").disabled, false);
  DDP.setMode("live"); eq(document.querySelector("fieldset.all").disabled, true);
  DDP.setCanWrite(true); window.__canWrite = true;
});
test("#demo i adressen åbner demo", () => { DDP.readHashFrom("#demo-katalog"); eq(DDP.state().mode, "demo"); });
test("banner vises kun i demo", () => {
  DDP.setMode("demo"); ok(document.body.textContent.includes("Du ser demodata. Ændringer gemmes ikke."));
  DDP.setMode("live"); ok(!document.body.textContent.includes("Du ser demodata."));
});
```

`fakeDoc(id, data)` er en hjælper i testsiden: `{id, data:()=>data}`. `DDP.setCanWrite(b)` og `DDP.readHashFrom(h)` er testkroge, der kun sætter `canWrite` + tegner, hhv. kører hash-fortolkningen på en given streng. Note: indtil Task 5 lægges ét minimalt testprojekt i `src/demo.js` (`{name:"Demo-test", rev:{}, assumptions:{}, milestones:{}, feedback:{}}`).

- [ ] **Step 2: Kør testene – forvent fejl** (`DDP.setMode is not a function`)

- [ ] **Step 3: Implementér skiftet**

Opstart: `mode="live"`, medmindre hash starter med `demo` eller der ikke er nogen database (`localMode`). I så fald `mode="demo"`. `localMode` beholder sin betydning (ingen database), men banneret "Data gemmes ikke i denne visning …" vises kun, når man er i live uden database. `onSnapshot` skriver til `liveProjects` og sætter kun `projects=liveProjects`, når `mode==="live"`. `createProject`/`deleteProject` i demo virker kun på `demoProjects`. Skiftet i headeren er to knapper med `data-act="mode" data-mode="demo|live"` og `aria-pressed`. Når `#demo...` åbnes, men opstarten ellers ville være live, skiftes der til demo.

- [ ] **Step 4: Kør testene – forvent `ALLE N TESTS BESTÅET`**

- [ ] **Step 5: Commit** – `git commit -am "Demo/live-skift"` (husk `git add` for nye filer)

### Task 3: Fanen "Sådan er det bygget" og status "I drift"

**Files:**
- Modify: `src/app.js` (ny fane `bygget`, `tabBuild(p)`, `patchFromKey` for `b.*`, tag-felt, `status()`, JSON-eksport)
- Modify: `src/styles.css` (tag-chips med fjern-knap)
- Test: `tests/tests.html`

**Interfaces:**
- Produces: `DDP.status(p) -> [label, cls]` med reglen fra Global Constraints.
- Produces: `DDP.allStackTags(projectsObj) -> string[]`: unikke tags på tværs af projekter, sammenlignet uden hensyn til store og små bogstaver. Første stavemåde vinder, sorteret med `localeCompare(…,"da")`.
- Produces: `DDP.addTag(pid, tag)` og `DDP.removeTag(pid, tag)`: trimmer, ignorerer tomme tags og tags, der allerede findes på projektet uanset store og små bogstaver. Skriver hele `build.stack`-arrayet via `queuePatch` (arrays erstattes helt i `deepMerge`).
- Fanerne bliver `[["gevinst","Gevinstregnskab"],["antagelser","Antagelser"],["milepaele","Milepæle og beslutninger"],["bygget","Sådan er det bygget"],["evaluering","Evaluering"]]`. Hash-regex'en udvides med `bygget`.
- Feltetiketter (præcis): "Hvad værktøjet gør", "Tech stack", "Dele andre kan genbruge", "Links", "Læring og faldgruber", "Kontaktperson", "Værktøjet er i drift". Data-nøgler: `b.summary`, `b.reusable`, `b.links`, `b.learnings`, `b.contact` (tekst, gemmes med forsinkelse) og `b.live` (afkrydsning, gemmes med det samme). `patchFromKey` mapper `b.x` til `{build:{x:v}}`.
- Tag-feltet er et tekstfelt med `<datalist>` fra `allStackTags`. Enter eller komma tilføjer et tag. Hver chip har en knap med `data-act="del-tag"` og `aria-label="Fjern <tag>"`.

- [ ] **Step 1: Skriv de fejlende tests**

```js
const ms = (dec, at) => ({m1:{decision:dec, decidedAt:at, name:"x"}});
test("I drift erstatter Fortsætter", () => eq(DDP.status({milestones:ms("fortsaet",1), build:{live:true}}), ["I drift","ok"]));
test("I drift erstatter ikke Justeres", () => eq(DDP.status({milestones:ms("juster",1), build:{live:true}})[0], "Justeres"));
test("I drift erstatter ikke Under planlægning", () => eq(DDP.status({build:{live:true}})[0], "Under planlægning"));
test("projekt uden build virker", () => eq(DDP.status({milestones:ms("fortsaet",1)})[0], "Fortsætter"));
test("allStackTags samler stavemåder", () => eq(DDP.allStackTags({a:{build:{stack:["Python","Shopify API"]}}, b:{build:{stack:["python"]}}, c:{}}), ["Python","Shopify API"]));
test("addTag afviser dublet med andre bogstaver", async () => {
  DDP.setMode("demo"); const id = Object.keys(DDP.state().projects)[0];
  DDP.addTag(id, "Python"); DDP.addTag(id, " python "); DDP.addTag(id, "");
  eq(DDP.state().projects[id].build.stack.filter(t=>t.toLowerCase()==="python").length, 1);
  DDP.removeTag(id, "Python"); ok(!DDP.state().projects[id].build.stack.includes("Python"));
});
```

- [ ] **Step 2: Kør – forvent fejl**

- [ ] **Step 3: Implementér `tabBuild(p)`, tags, status og eksport**

Fanen starter med en kort `lead` i stil med de andre faner: "Beskriv hvordan værktøjet er bygget, så andre kan lære af det og genbruge dele, når de skal lave noget lignende." Layout: to kolonner med klassen `.two`, som de andre faner. JSON-eksporten får `bygget:{beskrivelse,tech_stack,genbrug,links,laering,kontakt,i_drift}`.

- [ ] **Step 4: Kør – forvent `ALLE N TESTS BESTÅET`.** Åbn derefter `src/index.html` via serveren (`http://localhost:8765/src/index.html#demo`) og kontrollér, at fanen ser rigtig ud i lys og mørk tilstand og ved 375 px bredde.

- [ ] **Step 5: Commit** – `"Fanen Sådan er det bygget og status I drift"`

### Task 4: Værktøjskatalog på forsiden

**Files:**
- Modify: `src/app.js` (`renderOverview` får faner, `renderCatalog()`, `catalogItems`)
- Modify: `src/styles.css` (kortgitter `.cat-grid`, `.cat-card`, filterlinje)
- Test: `tests/tests.html`

**Interfaces:**
- Consumes: `status(p)`, `allStackTags(projects)`, hash-præfikset fra Task 2.
- Produces: `DDP.catalogItems(projectsObj, {dep:"", tech:"", q:""}) -> Array<projekt med id>`. Med i listen er kun projekter, hvor `build.summary` (trimmet) ikke er tom eller `build.stack` har mindst ét tag. `dep` matcher `department` præcist. `tech` matcher et tag uden hensyn til store og små bogstaver. `q` søger uden hensyn til store og små bogstaver i navn, afdeling, `summary`, `reusable`, `learnings` og tags. Sorteret efter `updatedAt` med nyeste først.
- `view.home: "projekter"|"katalog"` og `view.filter: {dep, tech, q}`. Hash `katalog` / `demo-katalog`. Fanerne hedder "Projekter (n)" og "Værktøjskatalog (n)", hvor n er antallet uden filter.
- Et katalogkort er en knap med `data-act="open-build" data-id=…`, der åbner projektet på fanen `bygget`. Kortet viser navn, afdeling, statuspille, `summary`, op til 5 tags og "Genbrugelig: …", hvis `reusable` er udfyldt.
- Tom tilstand uden filter: "Der er ingen dokumenterede værktøjer endnu. Udfyld fanen Sådan er det bygget i et projekt, så det kommer med her." Med filter: "Ingen værktøjer matcher filtrene."

- [ ] **Step 1: Skriv de fejlende tests**

```js
const P = {
  a:{name:"Lager", department:"Indkøb", updatedAt:2, build:{summary:"Rapport", stack:["Python"]}},
  b:{name:"Tom", department:"HR", updatedAt:3, build:{summary:"  ", stack:[]}},
  c:{name:"Gammel", department:"Indkøb", updatedAt:1},
  d:{name:"Tekster", department:"Marketing", updatedAt:4, build:{stack:["Claude API"], learnings:"Brug skabelon"}}
};
test("katalog: kun dokumenterede, nyeste først", () => eq(DDP.catalogItems(P,{}).map(x=>x.id), ["d","a"]));
test("katalog: filter afdeling", () => eq(DDP.catalogItems(P,{dep:"Indkøb"}).map(x=>x.id), ["a"]));
test("katalog: filter teknologi uden hensyn til bogstaver", () => eq(DDP.catalogItems(P,{tech:"claude api"}).map(x=>x.id), ["d"]));
test("katalog: fritekst i læring", () => eq(DDP.catalogItems(P,{q:"skabelon"}).map(x=>x.id), ["d"]));
```

- [ ] **Step 2: Kør – forvent fejl**

- [ ] **Step 3: Implementér katalog, faner og filtre.** Filtrene er to `<select>` (afdelinger og tags fra alle dokumenterede projekter, første valg "Alle afdelinger"/"Alle teknologier") og et søgefelt. Filterændringer opdaterer `view.filter` og tegner; de skriver aldrig til databasen. Søgefeltet skal beholde fokus, mens man skriver (`render()` bevarer allerede fokus via `data-k`; giv feltet `data-k="filter.q"` og lad `onField` håndtere `filter.*` lokalt, før projektlogikken).

- [ ] **Step 4: Kør – forvent `ALLE N TESTS BESTÅET`.** Tjek visuelt i browseren i lys og mørk tilstand og ved 375 px.

- [ ] **Step 5: Commit** – `"Værktøjskatalog med filtre"`

### Task 5: Demoindhold

**Files:**
- Modify: `src/demo.js` (erstat testprojektet med det rigtige indhold)
- Test: `tests/tests.html`

**Interfaces:**
- Produces: `window.DDP_DEMO = { projects: {<id>: projekt i fuld datamodel inkl. build}, people: {"demo-<navn>": "<Fornavn>, <Afdeling>"} }`. `createdBy`, `decidedBy` og `feedback`-nøgler bruger `demo-…`-id'erne.
- Datoer ligger mellem 2026-03-01 og 2026-12-15 (i dag er 2026-11-01), så nogle milepæle er afsluttede, og andre ligger ude i fremtiden. `createdAt`/`decidedAt`/`updatedAt` er tidsstempler i ms, der passer til datoerne.

Indhold (konkret tekst og tal er op til den der bygger, inden for disse rammer):

| Id | Projekt | Afdeling | Fase | Krav |
|---|---|---|---|---|
| `demo-lager` | Automatisk lagerrapport | Indkøb | I drift | Fuld `build`, `live:true`, sidste beslutning fortsæt, 2+ evalueringssvar |
| `demo-retur` | Hjælp til returhenvendelser | Kundeservice | Justeres | Sidste beslutning justér med begrundelse, delvist udfyldt `build` |
| `demo-tekster` | Produkttekster med AI | Marketing | I test | Milepæle i gang, nogle antagelser testet, `build` med stack |
| `demo-bilag` | Bilagsmatching | Økonomi | Stoppet | Stop-beslutning med tydelig begrundelse, `build.learnings` udfyldt |
| `demo-pluk` | Pluklister til lageret | Lager | I drift | Fuld `build`, `live:true`, deler et tag med `demo-lager` |
| `demo-vagt` | Vagtplan-påmindelser | HR | Under planlægning | Kun gevinstregnskab og 2–3 antagelser, ingen milepæle, ingen `build` |

Antagelser fordeles over flere felter i prioriteringsmatricen og over alle statusser.

- [ ] **Step 1: Skriv de fejlende tests**

```js
test("demo dækker alle faser", () => {
  const s = new Set(Object.values(DDP_DEMO.projects).map(p => DDP.status(p)[0]));
  ["I drift","Justeres","I test","Stoppet","Under planlægning"].forEach(x => ok(s.has(x), x));
});
test("demo: alle personer findes", () => {
  for (const p of Object.values(DDP_DEMO.projects)) {
    ok(DDP_DEMO.people[p.createdBy], p.name);
    Object.values(p.milestones||{}).forEach(m => m.decidedBy && ok(DDP_DEMO.people[m.decidedBy], m.name));
    Object.keys(p.feedback||{}).forEach(k => ok(DDP_DEMO.people[k], k));
  }
});
test("demo: kataloget har mindst 4 værktøjer", () => ok(DDP.catalogItems(DDP_DEMO.projects,{}).length >= 4));
test("demo: tests-referencer peger på eksisterende antagelser", () => {
  for (const p of Object.values(DDP_DEMO.projects))
    Object.values(p.milestones||{}).forEach(m => Object.keys(m.tests||{}).forEach(a => ok(p.assumptions[a], `${p.name}: ${a}`)));
});
```

- [ ] **Step 2: Kør – forvent fejl** (fasen mangler)

- [ ] **Step 3: Skriv demoindholdet i `src/demo.js`**

- [ ] **Step 4: Kør – forvent `ALLE N TESTS BESTÅET`.** Klik derefter igennem alle seks demoprojekter i browseren, og tjek at ingen fane ser tom eller forkert ud.

- [ ] **Step 5: Commit** – `"Demoindhold med seks projekter"`

### Task 6: Dokumentation, byg og publicering

**Files:**
- Modify: `README.md` (ny filstruktur med `demo.js`, `build.ps1` og `tests/`, datamodel med `build`, arbejdsgang med `powershell -ExecutionPolicy Bypass -File build.ps1` og testkørsel)
- Modify: `dist/ddp-planlaegning.html` (genereret)

- [ ] **Step 1: Opdatér README og kør `build.ps1`**

- [ ] **Step 2: Åbn `dist/ddp-planlaegning.html` via serveren og kontrollér,** at den starter i Demo (ingen database lokalt), at skiftet virker, og at konsollen er uden fejl.

- [ ] **Step 3: Commit** – `"README og bygget version"`

- [ ] **Step 4: Publicér** `dist/ddp-planlaegning.html` til https://claude.ai/artifact/58Z6umqtuLCJQWiP8W8Bw3 (artifact-publish med `url`, læs artefaktet først).

- [ ] **Step 5: Tjek `#demo` på claude.ai.** Åbn `https://claude.ai/artifact/58Z6umqtuLCJQWiP8W8Bw3#demo` og se, om værktøjet starter i demo. Skriv resultatet i README under "Kendte begrænsninger", og fortæl det til Emil.

# Oprettelsesforløb, opfølgningsside og noter: implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adskil det, man udfylder ved oprettelsen (planen, i fire guidede trin), fra det, man udfylder undervejs (opfølgning på én side), tilføj noter på projekt, antagelser og milepæle, og fjern levetid fra gevinstregnskabet.

**Architecture:** Alt bliver i `src/app.js` (én IIFE, som i dag), men i tydeligt adskilte afsnit: regnestykke, noter, forløb (`view.wiz` med en `draft` i hukommelsen), projektside. Forløbet genbruger de eksisterende felt-renderere ved at splitte `tabRev`/`tabAss`/`tabMs` i en plandel og en opfølgningsdel. Felter i forløbet bindes med de samme `data-k`-nøgler som i dag; `onField` og plan-knapperne skriver til `view.wiz.draft` i stedet for `queuePatch`, så intet rammer databasen før "Opret projekt"/"Gem planen". Projektsiden er sektioner med id'er, og de gamle fane-adresser ruller til sektionen.

**Tech Stack:** HTML, CSS, JavaScript uden biblioteker. Browsertests i `tests/tests.html` (kør `bash tests/run.sh`, kræver Chrome). Server og API røres ikke.

**Spec:** `docs/superpowers/specs/2026-11-03-oprettelsesforloeb-og-opfoelgning-design.md`

## Global Constraints

- Ingen ændringer af `server/`, API eller database. Nye felter er valgfrie og ligger i projektets JSON.
- Alt brugervendt sprog er dansk, i samme tone som i dag.
- Eksisterende projekter uden de nye felter skal virke uden migrering; manglende felter behandles som tomme.
- Demo må aldrig skrive til serveren. `inMemory()`/`canEdit()` som i dag.
- "Gem planen" skriver kun `name`, `department`, `description`, `rev` og plandelen af `assumptions`/`milestones`. Aldrig `status`, `actual`, `result`, `decision`, `rationale`, `decidedBy`, `decidedAt`, `notes`, `build`, `feedback`.
- Filerne har CRLF-linjeskift. Bevar dem (Edit-værktøjet gør det automatisk; brug ikke `sed -i`/`perl` uden at tage højde for `\r`).
- Hver task slutter med `bash tests/run.sh` → sidste linje `ALLE N TESTS BESTÅET`, derefter `powershell -ExecutionPolicy Bypass -File build.ps1`, derefter commit.
- Commit-beskeder på dansk, i bydeform som de eksisterende (fx "Noter på projekt, antagelser og milepæle"), afsluttet med `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Man forlader forløbet via brandknappen "home", "Annullér" eller demo/live-skiftet midt i en kladde: intet skrives, `view.wiz` er `null`, og forsiden vises. (Task 4, test "forløb: annullér og visningsskift skriver intet".)
2. Råderum pr. år er nul eller negativt: resultatpanelet siger "aldrig tjent hjem" i stedet for `Infinity`/`NaN` måneder. (Task 1, test "calc: råderum nul eller negativt giver aldrig".)
3. "Gem planen" efter at en kollega i mellemtiden har sat status på en antagelse: status overlever, fordi patchen ikke indeholder opfølgningsfelter. (Task 5, test "ret planen: patch indeholder kun plandelen".)
4. En antagelse fjernes i "Ret planen", mens en milepæl stadig tester den: milepælen viser ikke den slettede antagelse, og intet går i stykker. (Task 5, test "ret planen: fjernet antagelse forsvinder fra milepælens testliste".)
5. En note med kun mellemrum sendes: ingen note oprettes, intet skrives. (Task 3, test "noter: tom note afvises".)

---

### Task 1: Gevinstregnskab uden levetid

**Files:**
- Modify: `src/app.js:21` (`REV_DEFAULT`), `src/app.js:84-98` (`calc`), `src/app.js:325-383` (`tabRev`, `revOut`)
- Modify: `src/demo.js` (fjern `lifetime` fra de seks `rev`-objekter; valgfrit, men holder demoen ren)
- Modify: `README.md` (afsnittet "Gevinstregnskabet", og `lifetime` i datamodellen markeres "læses ikke længere")
- Test: `tests/tests.html`

**Interfaces:**
- Produces: `calc(r)` returnerer `{targetNet, margin, rate, users, weeks, gross, allow, hoursYear, perUserWeek, build, maintYear, runYear, running, slack, paybackMonths, breakEvenMin}` hvor `running = maintYear + runYear`, `slack = allow - running`, `build = devHours*rate + oneTime`, `paybackMonths = slack > 0 ? build / slack * 12 : Infinity`, `breakEvenMin = running / rate / users / weeks * 60`. `life`, `buildYear` og `est` udgår.
- Produces: `fmtPayback(months)` → `"0 måneder"` når `build` er 0, `"N måneder"` op til og med 24, ellers `"N,N år"` (`nf1`), og `"aldrig"` ved `Infinity`.
- Produces: `revFields(r)` → HTML for de to paneler med de ni talfelter (uden `lifetime`); `revOut(r)` → resultatpanelet med de nye begreber. `tabRev` beholdes midlertidigt som `lead + description + two(revOut, revFields)` og fjernes i Task 5.

- [ ] **Step 1: Skriv de fejlende tests** (indsæt før `runAll();`)

```js
/* Regnestykke uden levetid */
const R = {targetNet:100000, marginPct:50, rate:400, users:5, weeks:46, devHours:40, oneTime:0, maintHours:4, runMonthly:200};
test("calc: råderum, engangsudgift og tilbagebetaling", () => {
  const c = DDP.calc(R);
  eq(c.allow, 100000); eq(c.running, 4*12*400 + 200*12); eq(c.slack, 100000 - 21600);
  eq(c.build, 16000); eq(Math.round(c.paybackMonths*100)/100, Math.round(16000/78400*12*100)/100);
  ok(!("life" in c) && !("buildYear" in c) && !("est" in c), "levetidsfelter er væk");
});
test("calc: råderum nul eller negativt giver aldrig", () => {
  const c = DDP.calc(Object.assign({}, R, {maintHours:30}));
  ok(c.slack <= 0); eq(c.paybackMonths, Infinity); eq(DDP.fmtPayback(c.paybackMonths), "aldrig");
});
test("calc: gammelt projekt med lifetime regnes uden at bruge det", () => {
  eq(DDP.calc(Object.assign({lifetime:3}, R)).slack, DDP.calc(R).slack);
});
test("calc: tilbagebetaling formateres i måneder op til 24, ellers år", () => {
  eq(DDP.fmtPayback(2.4), "2 måneder"); eq(DDP.fmtPayback(24), "24 måneder"); eq(DDP.fmtPayback(30), "2,5 år"); eq(DDP.fmtPayback(0), "0 måneder");
});
test("gevinst: panelet viser råderum og tilbagebetaling, ikke levetid", () => {
  openDemo("#demo-p-demo-lager-gevinst"); const t = appEl().textContent;
  ok(t.includes("Råderum pr. år")); ok(t.includes("tjent hjem")); ok(!t.includes("Forventet levetid")); ok(!appEl().querySelector('[data-k="rev.lifetime"]'));
  DDP.setMode("live");
});
```

- [ ] **Step 2: Kør testene, og se dem fejle**

Run: `bash tests/run.sh | grep -E "FEJL|BESTÅET"`
Expected: `FEJL calc: …` (fire af dem) og `FEJL gevinst: …`; `DDP.fmtPayback is not a function`.

- [ ] **Step 3: Implementér `calc(r)` og `fmtPayback(months)`**

Fjern `lifetime` fra `REV_DEFAULT`. Eksponér `fmtPayback` i `window.DDP`. `nulpunkt`-teksten bruger `breakEvenMin` beregnet af de løbende omkostninger alene.

- [ ] **Step 4: Split `tabRev` i `revFields(r)` og `revOut(r)`**

`revOut` viser i rækkefølge: udsagnet "Hver bruger skal spare … timer om ugen", tabellen nettogevinst/bruttogevinst/tilladte omkostninger pr. år, tabellen vedligehold/drift og licenser/**Løbende omkostninger pr. år** (sum)/**Råderum pr. år**, linjen "Engangsudgift (udvikling og andet): …", søjlerne "Tilladt" (allow) og "Løbende" (running), og verdict-teksten:
- `slack > 0`: `Udviklingen er tjent hjem efter ${fmtPayback(paybackMonths)}. Derefter ligger omkostningerne ${kr(slack)} under rammen om året.`
- ellers: `Udviklingen bliver aldrig tjent hjem: de løbende omkostninger alene overstiger rammen med ${kr(-slack)}.`
Verdict-klassen er `ok` når `slack > 0`, ellers `bad`. Knappen "Lav antagelser ud fra tallene" bliver i panelet.

- [ ] **Step 5: Ret README og demo.js**

README "Gevinstregnskabet": erstat punkterne med tabellen fra spec afsnit 7. Datamodel: `lifetime` → "(læses ikke længere)". `demo.js`: fjern `lifetime:` fra de seks `rev`.

- [ ] **Step 6: Kør alle tests, byg, commit**

Run: `bash tests/run.sh | tail -1` → `ALLE N TESTS BESTÅET`. Run: `powershell -ExecutionPolicy Bypass -File build.ps1`.

```bash
git add src/app.js src/demo.js README.md tests/tests.html dist/ddp-planlaegning.html
git commit -m "Gevinstregnskab uden levetid: råderum og tilbagebetalingstid"
```

---

### Task 2: Ny statusregel

**Files:**
- Modify: `src/app.js:99-105` (`status`)
- Modify: `src/demo.js` (mindst ét projekt skal være "Under planlægning" efter den nye regel)
- Modify: `README.md:119-120` (statustabellen)
- Test: `tests/tests.html` (ret `PF`-fixture-forventningerne og "farver: I test …")

**Interfaces:**
- Produces: `status(p)`: "Under planlægning" når ingen beslutning er truffet og ingen antagelse har `status` forskellig fra `""`/`"ikke"`; "I test" når ingen beslutning, men mindst én antagelse er testet; resten uændret.

- [ ] **Step 1: Skriv de fejlende tests**

```js
test("status: antagelser uden status er stadig Under planlægning", () => eq(DDP.status({assumptions:{x:{status:"ikke"}, y:{}}})[0], "Under planlægning"));
test("status: én testet antagelse giver I test", () => eq(DDP.status({assumptions:{x:{status:"holder"}, y:{status:"ikke"}}}), ["I test","info"]));
```

Ret eksisterende: `"farver: I test har sin egen farve, ikke accent"` → `DDP.status({assumptions:{x:{status:"delvist"}}})`. I `PF`-fixturen er `d` nu "Under planlægning"; ret `"filtre: flere statusser på én gang"` til `eq(ids(DDP.projectItems(PF, {status:["I test","Stoppet"]})), ["a","b"])`. Kør og tjek, om andre `filtre:`-tests ændrer sig (sortering "progress" bruger `progressOf`, ikke status, så den bør holde).

- [ ] **Step 2: Kør testene, og se de to nye fejle**

Run: `bash tests/run.sh | grep -E "FEJL|BESTÅET"`

- [ ] **Step 3: Implementér den nye regel i `status(p)`**

- [ ] **Step 4: Kør alle tests; ret demodata hvis "demo dækker alle faser" fejler**

Et demoprojekt skal have antagelser, men ingen med status, og ingen beslutning. Vælg "Vagtplan-påmindelser" (HR) eller det projekt, der i dag er "Under planlægning", og sæt alle dets antagelser til `"ikke"` med tom `actual`.

- [ ] **Step 5: Ret README-statustabellen** til: Under planlægning = "Ingen antagelse er testet, og ingen beslutning er truffet"; I test = "Mindst én antagelse er testet, men ingen beslutning er truffet".

- [ ] **Step 6: Kør alle tests, byg, commit**

```bash
git add src/app.js src/demo.js README.md tests/tests.html dist/ddp-planlaegning.html
git commit -m "Under planlægning indtil første antagelse er testet"
```

---

### Task 3: Noter på projekt, antagelser og milepæle

**Files:**
- Modify: `src/app.js` (nyt afsnit `/* ---------- noter ---------- */` efter `aNum`, ca. linje 123; klik- og tastehandlere ved linje 532-540 og 560+; `window.DDP`)
- Modify: `src/styles.css` (ny blok `.notes` sidst i filen)
- Test: `tests/tests.html`

**Interfaces:**
- Produces: `notePatch(kind, id, nid, note)` → patch-objekt: `kind="p"` → `{notes:{[nid]:note}}`, `"a"` → `{assumptions:{[id]:{notes:{[nid]:note}}}}`, `"m"` → `{milestones:{[id]:{notes:{[nid]:note}}}}`.
- Produces: `addNote(kind, id, text)` → trimmer; tom tekst → returnerer `null` uden skrivning; ellers `queuePatch(view.pid, notePatch(kind,id,newId(),{text, by:meId||null, at:Date.now(), order:nextOrder(obj)}), 0)` og returnerer nid. `obj` er `P().notes`, `P().assumptions[id].notes` eller `P().milestones[id].notes`.
- Produces: `deleteNote(kind, id, nid)` → `queuePatch(view.pid, notePatch(kind,id,nid,{deleted:true}), 0)`.
- Produces: `renderNotes(kind, id, notesObj, {open})` → HTML: `<details class="notes" data-notes="${kind}.${id}" ${open?"open":""}><summary>Noter (${n})</summary>` + liste (`listOf(notesObj)`, ældste øverst; hver note: tekst med linjeskift bevaret via `white-space:pre-wrap`, `nameOf(by)`, `fmtTs(at)`, knap `data-act="del-note" data-note="${kind}.${id}" data-nid="${nid}"` med `aria-label="Slet note"`) + `<textarea data-note="${kind}.${id}" rows="2" aria-label="Ny note" placeholder="Skriv en note …">` + knap `data-act="add-note" data-note="${kind}.${id}"` med teksten "Tilføj note" + `<p class="small muted">Enter tilføjer, Shift+Enter giver linjeskift.</p>`. `open` er `true` for projektet altid, og for antagelser/milepæle når `n > 0`.
- Tastatur: `keydown` på `textarea[data-note]` med `Enter` uden Shift → `preventDefault` og samme som "Tilføj note".
- Eksponér `addNote`, `deleteNote`, `renderNotes` i `window.DDP`.
- Rendering på siden sker i Task 5; i denne task testes komponenten ved at kalde `DDP.renderNotes` og ved at sætte dens HTML ind i `#app` i testen.

- [ ] **Step 1: Skriv de fejlende tests**

```js
/* Noter */
const notesHost = html => { appEl().innerHTML = `<fieldset class="all">${html}</fieldset>`; };
test("noter: addNote skriver tekst, navn og tidspunkt på projektet", async () => {
  DDP.setMode("live"); window.__snap({docs:[fakeDoc("n1",{name:"N", assumptions:{a:{text:"x"}}, milestones:{m:{name:"y"}}})], size:1, metadata:{fromCache:false}});
  DDP.readHashFrom("#p-n1"); window.__writes.length = 0;
  const nid = DDP.addNote("p", "n1", "  Mere kontekst  "); DDP.flushAll(); await tick();
  const n = DDP.state().projects.n1.notes[nid];
  eq(n.text, "Mere kontekst"); eq(n.by, "me"); ok(n.at > 0); eq(n.order, 1);
  eq(window.__writes.length, 1); eq(window.__writes[0].p.notes[nid].text, "Mere kontekst");
});
test("noter: på antagelse og milepæl ligger noten under elementet", () => {
  const a = DDP.addNote("a", "a", "om antagelsen"), m = DDP.addNote("m", "m", "om milepælen");
  eq(DDP.state().projects.n1.assumptions.a.notes[a].text, "om antagelsen");
  eq(DDP.state().projects.n1.milestones.m.notes[m].text, "om milepælen");
});
test("noter: tom note afvises", async () => {
  window.__writes.length = 0; DDP.flushAll(); await tick(); window.__writes.length = 0;
  eq(DDP.addNote("p", "n1", "   "), null); DDP.flushAll(); await tick(); eq(window.__writes.length, 0);
});
test("noter: slet sætter deleted, og listen skjuler den", () => {
  const nid = DDP.addNote("p", "n1", "væk"); DDP.deleteNote("p", "n1", nid);
  eq(DDP.state().projects.n1.notes[nid].deleted, true);
  notesHost(DDP.renderNotes("p", "n1", DDP.state().projects.n1.notes, {open:true}));
  ok(!appEl().textContent.includes("væk"));
});
test("noter: listen viser navn og tidspunkt, og knapper virker", async () => {
  const notes = DDP.state().projects.n1.notes;
  notesHost(DDP.renderNotes("p", "n1", notes, {open:true}));
  ok(appEl().textContent.includes("Mere kontekst")); ok(appEl().textContent.includes("dig"));
  ok(appEl().querySelector("details.notes").open);
  appEl().querySelector("textarea[data-note]").value = "fra knappen";
  appEl().querySelector('[data-act="add-note"]').click();
  ok(Object.values(DDP.state().projects.n1.notes).some(n => n.text === "fra knappen"));
});
test("noter: Enter i feltet tilføjer, Shift+Enter gør ikke", () => {
  notesHost(DDP.renderNotes("p", "n1", DDP.state().projects.n1.notes, {open:true}));
  const ta = appEl().querySelector("textarea[data-note]"); const before = Object.keys(DDP.state().projects.n1.notes).length;
  ta.value = "med shift"; ta.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter", shiftKey:true, bubbles:true}));
  eq(Object.keys(DDP.state().projects.n1.notes).length, before);
  ta.value = "med enter"; ta.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter", bubbles:true}));
  eq(Object.keys(DDP.state().projects.n1.notes).length, before + 1);
});
test("noter: antagelse uden noter er foldet sammen, med noter foldet ud", () => {
  notesHost(DDP.renderNotes("a", "a", {}, {open:false}) + DDP.renderNotes("a", "a", DDP.state().projects.n1.assumptions.a.notes, {open:true}));
  const d = appEl().querySelectorAll("details.notes"); eq(d[0].open, false); eq(d[1].open, true); ok(d[0].textContent.includes("Noter (0)"));
});
test("noter: demo skriver intet", async () => {
  DDP.setMode("demo"); const id = Object.keys(DDP.state().projects)[0]; DDP.readHashFrom("#demo-p-"+id);
  window.__writes.length = 0; DDP.addNote("p", id, "demo-note"); DDP.flushAll(); await tick();
  eq(window.__writes.length, 0); ok(Object.values(DDP.state().projects[id].notes).some(n => n.text === "demo-note"));
  DDP.setMode("live");
});
```

- [ ] **Step 2: Kør testene, og se dem fejle** (`DDP.addNote is not a function`)

- [ ] **Step 3: Implementér `notePatch`, `addNote`, `deleteNote`, `renderNotes`, klik- og tastehandlere**

Klik: `add-note` læser `textarea[data-note="<kind.id>"]` inden for samme `details.notes`, kalder `addNote`, tømmer feltet, kalder `render()` og giver fokus til det nye felt med samme `data-note`. `del-note` kalder `deleteNote` og `render()`. Handlerne sidder efter `if(!canEdit())return;` og `if(!p)return;` ligesom `add-ass`.

- [ ] **Step 4: CSS**

`.notes` som en let indrykket blok: `summary` i `.small`-størrelse, listen med `border-left:3px solid var(--line)`, note-tekst `white-space:pre-wrap`, meta-linje `.small.muted`. Ingen inline-stilarter i markup.

- [ ] **Step 5: Kør alle tests, byg, commit**

```bash
git add src/app.js src/styles.css tests/tests.html dist/ddp-planlaegning.html
git commit -m "Noter på projekt, antagelser og milepæle"
```

---

### Task 4: Oprettelsesforløbet (`#nyt`)

**Files:**
- Modify: `src/app.js`: `view` (linje 40), `render` (140-167), `renderOverview` (272-302: fjern "Nyt projekt"-panelet, `new-project` åbner forløbet), `tabAss` → split, `tabMs` → split, `onField` (514-531), klikhandlere (560-607), `setHash`/`readHashFrom` (645-657), `setMode` (196-198), `window.DDP`
- Modify: `src/styles.css` (`.step[aria-current]` som `.step[aria-selected=true]`; `.wiz-nav`)
- Test: `tests/tests.html` (ret "forsiden viser projektlisten før Nyt projekt", "design: Opret projekt står før projektlisten", "I1: oprettelse i live …", "design: problembeskrivelsen er første felt i trin 1", "design: resultatet står før tallene i trin 1", "design: samme navn for 'lav antagelser' begge steder")

**Interfaces:**
- Produces: `view.wiz = null | {mode:"new"|"edit", pid:string|null, step:1|2|3|4, draft:null|{name,department,description,rev,assumptions,milestones}, orig:null|project}`. `draft` bygges lazily i `renderWizard()`: for `"new"` → `{name:"",department:"",description:"",rev:Object.assign({},REV_DEFAULT),assumptions:{},milestones:{}}`; `"edit"` i Task 5.
- Produces: `WIZ_STEPS=[["projekt","Projekt"],["gevinst","Gevinst"],["antagelser","Antagelser"],["milepaele","Milepæle"]]`.
- Produces: `applyPatch(patch)`: hvis `view.wiz` → `deepMerge(view.wiz.draft, clone(patch))`; ellers `queuePatch(view.pid, patch, 0)`. `addAssumption(p,a)`, `add-ms`, `std-ms`, `del-ass`, `del-ms`, `suggest-ass` bruger `applyPatch` og læser fra `cur()` i stedet for `P()`, hvor `cur = () => view.wiz ? view.wiz.draft : P()`.
- Produces: `onField`: når `view.wiz` er sat og nøglen starter med `p.`, `rev.`, `a.` eller `m.` → `deepMerge(view.wiz.draft, patchFromKey(k,v))`; `rev`-felter opdaterer `#rev-out` som i dag; strukturelle felter (`select`, checkbox) kalder `render()`; ingen `queuePatch`.
- Produces: `renderWizard()` → HTML: `<h1 id="view-title" tabindex="-1">${mode==="new"?"Opret projekt":"Ret planen"}</h1>`, trinviser `<nav class="steps" aria-label="Trin">` med `<span class="step" aria-current="step">` på det aktive trin (ikke knapper: man går kun frem/tilbage med knapperne), trinindholdet, og `<div class="wiz-nav row-actions">` med `data-act="wiz-back"` (skjult på trin 1), `data-act="wiz-cancel"` ("Annullér"), `data-act="wiz-next"` ("Næste: Gevinst" / "Næste: Antagelser" / "Næste: Milepæle") eller på trin 4 `data-act="wiz-finish"` ("Opret projekt" / "Gem planen", `btn primary`).
- Produces: trinindhold: trin 1 = `wizStep1(d)` (projektnavn `data-k="p.name"` med `id="np-name"`, afdeling `p.department`, problem `p.description`, alle `type=text`/textarea); trin 2 = `revOut(rev(d)) + revFields(rev(d))` i `.two`; trin 3 = `assPlanList(d)` + `assPrioPanel(d, {withStatus:false})`; trin 4 = `msPlanList(d)`.
- Produces: `assPlanList(p, locked)` (fra `tabAss`; `locked` er valgfri `(kind,id)=>boolean`, bruges først i Task 5): knapperne "Tilføj antagelse"/"Lav antagelser ud fra tallene" og rækker med `a.<id>.text`, `.cat`, `.impact`, `.uncertainty`, `.expected` og slet-knap; **ikke** `.status`/`.actual`. `assPrioPanel(p,{withStatus})` = matrixen (+ legend og "Test i denne rækkefølge" kun når `withStatus` er `false`, dvs. i forløbet). Med `withStatus:true` viser chips ✓/½/✕ som i dag.
- Produces: `msPlanList(p, locked)` (fra `tabMs`; samme `locked` som ovenfor): knapperne "Tilføj milepæl"/"Brug standardmilepælene" (omdøbt fra "Brug standardforløb") og pr. milepæl: navn, dato, budget, beskrivelse, testede antagelser (checkboxes `m.<id>.tests.<aid>`), slet-knap; **ikke** gatebox. Milepælene vises som almindelige blokke (`.panel`), ikke `details`.
- Produces: `wiz-finish` i `"new"`: hvis `draft.name.trim()` tom → `toast("Giv projektet et navn.")`, `view.wiz.step=1`, render, fokus `#np-name`. Ellers `createProject(Object.assign({}, draft, {name:draft.name.trim(), createdBy:meId||null, createdAt:now, updatedAt:now, feedback:{}}))` → `view.wiz=null; view.pid=id; setHash(); render(); window.scrollTo(0,0); afterRoute()`.
- Produces: `wiz-next` på trin 1 uden navn → samme toast, bliver på trin 1. Ellers `step++`, `render()`, `window.scrollTo(0,0)`, `afterRoute()`.
- Produces: `wiz-cancel` → `view.wiz=null; view.pid = wiz.pid` (edit) eller `null` (new); `setHash(); render(); afterRoute()`.
- Produces: `setHash`: `view.wiz` → `nyt` (new) eller `p-<pid>-plan` (edit); `readHashFrom`: `nyt` → `view.wiz={mode:"new",pid:null,step:1,draft:null,orig:null}`; alt andet sætter `view.wiz=null`. `setMode` sætter `view.wiz=null`. `render()`: hvis `view.wiz` → `renderWizard()` i `fieldset(...)` i stedet for forside/projekt. `document.title` = `"Opret projekt · DDP-planlægning"` / `"Ret planen · <navn> · DDP-planlægning"`.
- `new-project`-knappen på forsiden: `view.wiz={mode:"new",…}; setHash(); render(); window.scrollTo(0,0); afterRoute()`. Knappen vises kun når `canEdit()` (som i dag).
- Eksponér intet nyt ud over det, testene bruger: `DDP.state()` viser `view.wiz` automatisk.

- [ ] **Step 1: Skriv de fejlende tests**

```js
/* Oprettelsesforløbet */
const setField = (k, v) => { const el = appEl().querySelector(`[data-k="${k}"]`); el.value = v; el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", {bubbles:true})); };
const act = a => appEl().querySelector(`[data-act="${a}"]`).click();
test("forløb: #nyt åbner trin 1, og forsiden har ingen Nyt projekt-formular", () => {
  DDP.setMode("live"); window.__snap({docs:[], size:0, metadata:{fromCache:false}}); DDP.readHashFrom(""); DDP.render();
  ok(!appEl().querySelector("#np-name"), "ingen formular på forsiden"); act("new-project");
  eq(DDP.state().view.wiz.mode, "new"); eq(DDP.state().view.wiz.step, 1); eq(location.hash, "#nyt");
  ok(appEl().querySelector("#np-name")); ok(/Projekt/.test(appEl().querySelector(".step[aria-current]").textContent));
  ok(document.title.startsWith("Opret projekt"));
});
test("forløb: i demo oprettes projektet kun i hukommelsen", async () => {
  DDP.setMode("demo"); DDP.readHashFrom("#demo-nyt"); DDP.render(); eq(location.hash, "#demo-nyt");
  setField("p.name", "Demo-forløb"); window.__writes.length = 0; act("wiz-next"); act("wiz-next"); act("wiz-next"); act("wiz-finish"); await tick();
  eq(window.__writes.length, 0); ok(Object.values(DDP.state().projects).some(p => p.name === "Demo-forløb")); DDP.setMode("live");
});
test("forløb: uden navn kommer man ikke videre", () => {
  act("wiz-next"); eq(DDP.state().view.wiz.step, 1); ok(document.getElementById("toast").textContent.includes("navn"));
});
test("forløb: trin 2 regner med det samme, trin 3 foreslår antagelser, trin 4 har standardmilepæle", () => {
  setField("p.name", "Forløbstest"); setField("p.department", "Test"); act("wiz-next"); eq(DDP.state().view.wiz.step, 2);
  setField("rev.rate", "500"); eq(DDP.state().view.wiz.draft.rev.rate, 500); ok(appEl().querySelector("#rev-out").textContent.includes("timer om ugen"));
  act("wiz-next"); act("suggest-ass"); eq(Object.keys(DDP.state().view.wiz.draft.assumptions).length, 5);
  ok(!appEl().querySelector('[data-k^="a."][data-k$=".status"]'), "ingen statusfelter i forløbet");
  ok(appEl().textContent.includes("Test i denne rækkefølge"));
  act("wiz-next"); act("std-ms"); eq(Object.keys(DDP.state().view.wiz.draft.milestones).length, 4);
  ok(!appEl().querySelector(".gatebox"), "ingen beslutningspunkt i forløbet");
  const aid = Object.keys(DDP.state().view.wiz.draft.assumptions)[0], mid = Object.keys(DDP.state().view.wiz.draft.milestones)[0];
  const cb = appEl().querySelector(`[data-k="m.${mid}.tests.${aid}"]`); cb.checked = true; cb.dispatchEvent(new Event("change", {bubbles:true}));
  eq(DDP.state().view.wiz.draft.milestones[mid].tests[aid], true);
});
test("forløb: intet er skrevet før Opret projekt, og ét set skriver alt", async () => {
  window.__writes.length = 0; eq(Object.keys(DDP.state().projects).length, 0);
  act("wiz-finish"); await tick(); await tick();
  eq(window.__writes.length, 1); eq(window.__writes[0].op, "set");
  const p = window.__writes[0].p; eq(p.name, "Forløbstest"); eq(p.rev.rate, 500); eq(Object.keys(p.assumptions).length, 5); eq(Object.keys(p.milestones).length, 4); eq(p.feedback, {}); eq(p.createdBy, "me");
  eq(DDP.state().view.wiz, null); ok(DDP.state().view.pid, "projektsiden er åben"); ok(location.hash.startsWith("#p-"));
});
test("forløb: annullér og visningsskift skriver intet", async () => {
  DDP.readHashFrom("#nyt"); DDP.render(); setField("p.name", "Kasseret"); window.__writes.length = 0;
  act("wiz-cancel"); await tick(); eq(DDP.state().view.wiz, null); eq(window.__writes.length, 0); eq(DDP.state().view.pid, null);
  DDP.readHashFrom("#nyt"); DDP.render(); setField("p.name", "Kasseret 2"); DDP.setMode("demo"); await tick();
  eq(DDP.state().view.wiz, null); eq(window.__writes.length, 0); ok(!Object.values(DDP.state().projects).some(p => p.name === "Kasseret 2"));
  DDP.setMode("live");
});
test("forløb: læseadgang i live viser ikke Opret projekt", () => {
  DDP.setCanWrite(false); DDP.readHashFrom(""); DDP.render(); ok(!appEl().querySelector('[data-act="new-project"]')); DDP.setCanWrite(true);
});
```

Ret eksisterende tests: "forsiden viser projektlisten før Nyt projekt" → slet (dækket af første nye test). "design: Opret projekt står før projektlisten" → uændret. "I1: oprettelse i live …" → brug `DDP.readHashFrom("#nyt"); DDP.render(); setField("p.name","Rigtigt"); act("wiz-finish");` i stedet for `np-name`/`create`. "design: problembeskrivelsen er første felt i trin 1" og "design: resultatet står før tallene i trin 1" → slet (trin 1 er nu projektfelter; resultat-før-tal testes i trin-2-testen ovenfor). "design: samme navn for 'lav antagelser' begge steder" → sammenlign `#demo-p-demo-lager-gevinst` med `#demo-nyt` på trin 3.

- [ ] **Step 2: Kør testene, og se dem fejle**

- [ ] **Step 3: Implementér `view.wiz`, `applyPatch`, `cur`, splittene af `tabAss`/`tabMs`, `renderWizard`, handlere, hash og `setMode`**

`tabAss`/`tabMs` beholdes midlertidigt som sammensætninger af de nye dele (så de eksisterende fane-tests stadig består indtil Task 5).

- [ ] **Step 4: CSS**: `.step[aria-current]` får samme udseende som `.step[aria-selected=true]`; `.wiz-nav{justify-content:space-between;margin-top:20px}`.

- [ ] **Step 5: Kør alle tests, byg, commit**

```bash
git add src/app.js src/styles.css tests/tests.html dist/ddp-planlaegning.html
git commit -m "Opret projekt som guidet forløb i fire trin"
```

---

### Task 5: Projektsiden som opfølgning, og "Ret planen"

**Files:**
- Modify: `src/app.js`: `renderProject` (304-320), `tabRev`/`tabAss`/`tabMs` fjernes, `tabBuild`/`tabEval` bliver sektioner, `TABS`/`tabLabel` fjernes, `render` (document.title, scroll), `readHashFrom`/`setHash`, `open`/`open-build`/`tab`-handlere, `renderWizard` (edit-mode), `wiz-finish` (edit), `window.DDP`
- Modify: `src/styles.css` (`.sec`, `.planbox`, `.ms.next`, `.steps`-stilen må gerne blive til forløbet)
- Modify: `README.md` ("Sådan bruger du det", "Struktur", "Vigtige steder i app.js")
- Test: `tests/tests.html`

**Interfaces:**
- Produces: `view.scrollTo = null | "plan"|"antagelser"|"milepaele"|"bygget"|"evaluering"`; `render()` ruller efter rendering til `#sec-<navn>` med `scrollIntoView({block:"start"})` og nulstiller. `readHashFrom`: `p-<id>` → projektside; `p-<id>-<gammel fane>` → projektside med `view.scrollTo` (`gevinst` → `"plan"`); `p-<id>-plan` → `view.wiz={mode:"edit",pid:id,step:1,draft:null,orig:null}`. `readHashFrom` kalder `setHash()` til sidst, så en gammel fane-adresse erstattes af `p-<id>` i adresselinjen. `setHash` skriver altid `p-<id>` for projektsiden. `view.tab` fjernes.
- Produces: `renderProject()` → `fieldset(hoved + renderNotes("p", pid, p.notes, {open:true}) + planBox(p) + secAss(p) + secMs(p) + secBuild(p) + secEval(p) + danger-zone)`. Hoved som i dag (navn- og afdelingsinput, statuschip, oprettet af) plus `<div class="small muted">Næste milepæl: ${next ? esc(next.name) + " · " + fmtDate(next.date) : "ingen åben milepæl"}</div>`. Hver sektion er `<section class="sec" id="sec-<navn>"><h2>…</h2>…</section>`; `#view-title` er `h2` i planboksen? Nej: `<h1 id="view-title" class="sr-only" tabindex="-1">${p.name}</h1>` øverst, som fanerne havde.
- Produces: `planBox(p)` → `<section class="sec planbox" id="sec-plan"><h2>Planen</h2>` + `description` som `<p>` (eller `<p class="muted">Ingen problembeskrivelse endnu.</p>`) + `<table class="ledger">` med: krævet nettogevinst, tilladte omkostninger pr. år, løbende omkostninger pr. år, råderum pr. år, engangsudgift, tilbagebetalingstid, krævede sparede timer pr. bruger pr. uge + `.verdict` med teksten fra Task 1 + knappen `<button class="btn" data-act="edit-plan">Ret planen</button>` (kun når `canEdit()`). Ingen `[data-k^="rev."]` her.
- Produces: `secAss(p)` → overskrift "Antagelser · x af y testet", `assPrioPanel(p,{withStatus:true})`, og rækker med nummer, tekst som `<p>`, chips for kategori/betydning/usikkerhed, "Forventet: …", felterne `a.<id>.actual` og `a.<id>.status` (som i dag), `renderNotes("a", id, a.notes, {open: n>0})`. Ingen "Tilføj antagelse", ingen slet-knap, ingen tekst/kategori-felter.
- Produces: `secMs(p)` → `path` som i dag, derefter `details.ms` pr. milepæl: `open` = `view.msOpen[id]` hvis sat, ellers `id === nextMs(p).id`; den næste får klassen `next` og `<span class="pill info">Næste</span>` i `summary`. Indhold: beskrivelse, dato, budget som tekst; gatebox som i dag (testede antagelser med `actual`/`status`, resultat, beslutning, begrundelse, besluttet af, fortryd); `renderNotes("m", id, m.notes, {open:n>0})`. Ingen navn/dato/budget-felter, ingen tests-checkboxes, ingen slet-knap, ingen "Tilføj milepæl".
- Produces: `secBuild(p)` = `tabBuild` i en `section#sec-bygget` med `<h2>Sådan er det bygget</h2>`; `secEval(p)` = `tabEval` i `section#sec-evaluering` med `<h2>Evaluering</h2>` og linjen `<p class="small muted">Evalueringen er tænkt til, når I har truffet mindst én beslutning ved en milepæl.</p>` før formularen.
- Produces: `edit-plan` → `view.wiz={mode:"edit",pid:view.pid,step:1,draft:null,orig:null}; flushAll(); setHash(); render(); window.scrollTo(0,0); afterRoute()`.
- Produces: edit-draft i `renderWizard()` når `draft` er `null`: `orig=P()`; `draft={name,department,description,rev:rev(orig), assumptions: id→{text,cat,impact,uncertainty,expected,order} for listOf(orig.assumptions), milestones: id→{name,desc,date,budget,tests:clone(tests),order} for listOf(orig.milestones)}`. `locked(kind,id)` = antagelse med `orig.assumptions[id].status` ≠ ""/"ikke", eller milepæl med `orig.milestones[id].decision`. `assPlanList`/`msPlanList` tager imod `locked` og udelader slet-knappen med teksten `<span class="small muted">Testet, kan ikke fjernes</span>` / `Besluttet, kan ikke fjernes`.
- Produces: `wiz-finish` i `"edit"` → `planPatch(draft, orig)`: `{name, department, description, rev, assumptions:{…}, milestones:{…}}` hvor hver antagelse/milepæl i `draft` uden `deleted` skrives med sine plandele (kun nøglerne ovenfor); et id i `draft` med `deleted:true` skrives som `{deleted:true}` hvis det findes i `orig`, og udelades helt hvis det blev oprettet og fjernet i samme forløb; og hvert id i `listOf(orig.assumptions)`/`listOf(orig.milestones)` som ikke findes i `draft` skrives som `{deleted:true}`. (Slet-knapperne i forløbet sætter `deleted:true` i `draft` via `applyPatch`, som i dag.) `queuePatch(pid, planPatch, 0); flushAll(); view.wiz=null; view.pid=pid; setHash(); render(); toast("Planen er gemt.")`. Eksponér `planPatch` i `window.DDP`.
- `open-build` → `view.pid=id; view.scrollTo="bygget"`. `tab`-handleren fjernes.

- [ ] **Step 1: Skriv de fejlende tests**

```js
/* Projektsiden som opfølgning */
test("projektside: ingen faner, ingen plantal-felter, Ret planen findes", () => {
  openDemo("#demo-p-demo-retur"); ok(!appEl().querySelector('[data-act="tab"]'));
  ok(!appEl().querySelector('[data-k^="rev."]')); ok(appEl().querySelector('[data-act="edit-plan"]'));
  ["sec-plan","sec-antagelser","sec-milepaele","sec-bygget","sec-evaluering"].forEach(id => ok(document.getElementById(id), id));
  ok(appEl().querySelector("#sec-plan").textContent.includes(DDP_DEMO.projects["demo-retur"].description.slice(0,30)), "beskrivelsen i planboksen");
  ok(!appEl().querySelector('[data-act="add-ass"]') && !appEl().querySelector('[data-act="add-ms"]') && !appEl().querySelector('[data-act="del-ass"]'));
  ok(appEl().querySelector('[data-k^="a."][data-k$=".status"]'), "status kan sættes"); ok(appEl().querySelector(".gatebox"), "beslutningspunkt findes");
});
test("projektside: næste milepæl er åben og markeret, besluttede foldet sammen", () => {
  openDemo("#demo-p-demo-retur"); const d = [...appEl().querySelectorAll("details.ms")];
  eq(d.map(x => x.open), [false, false, true]); ok(d[2].classList.contains("next")); ok(d[2].querySelector("summary").textContent.includes("Næste"));
});
test("projektside: gamle fane-adresser ruller til sektionen", () => {
  DDP.setMode("demo"); DDP.readHashFrom("#demo-p-demo-retur-bygget"); eq(DDP.state().view.scrollTo, "bygget"); DDP.render();
  eq(DDP.state().view.scrollTo, null); eq(location.hash, "#demo-p-demo-retur");
  DDP.readHashFrom("#demo-p-demo-retur-gevinst"); eq(DDP.state().view.scrollTo, "plan");
});
test("projektside: hovedet viser næste milepæl, og evalueringen har hjælpetekst", () => {
  openDemo("#demo-p-demo-retur"); ok(appEl().textContent.includes("Næste milepæl:")); ok(appEl().textContent.includes("mindst én beslutning"));
});
test("ret planen: åbner forløbet med projektets tal, låste elementer uden slet-knap", () => {
  openDemo("#demo-p-demo-retur"); act("edit-plan");
  eq(DDP.state().view.wiz.mode, "edit"); eq(location.hash, "#demo-p-demo-retur-plan"); ok(document.title.startsWith("Ret planen"));
  eq(appEl().querySelector('[data-k="p.name"]').value, DDP_DEMO.projects["demo-retur"].name);
  act("wiz-next"); eq(appEl().querySelector('[data-k="rev.rate"]').value, String(DDP_DEMO.projects["demo-retur"].rev.rate));
  act("wiz-next"); const tested = Object.entries(DDP_DEMO.projects["demo-retur"].assumptions).filter(([,a]) => a.status && a.status !== "ikke").length;
  eq(appEl().querySelectorAll('[data-act="del-ass"]').length, Object.keys(DDP_DEMO.projects["demo-retur"].assumptions).length - tested);
  ok(appEl().textContent.includes("kan ikke fjernes"));
  act("wiz-next"); const decided = Object.values(DDP_DEMO.projects["demo-retur"].milestones).filter(m => m.decision).length;
  eq(appEl().querySelectorAll('[data-act="del-ms"]').length, Object.keys(DDP_DEMO.projects["demo-retur"].milestones).length - decided);
  act("wiz-cancel"); eq(DDP.state().view.wiz, null); eq(DDP.state().view.pid, "demo-retur"); DDP.setMode("live");
});
test("ret planen: patch indeholder kun plandelen", () => {
  const orig = {name:"A", rev:{rate:400}, assumptions:{a1:{text:"x", cat:"gevinst", impact:3, uncertainty:2, expected:"1", status:"holder", actual:"2", order:1, notes:{n:{text:"hej"}}}, a2:{text:"y", order:2}},
                milestones:{m1:{name:"M", desc:"d", date:"", budget:"", tests:{a1:true}, result:"r", decision:"fortsaet", order:1}}};
  const draft = {name:"A2", department:"", description:"", rev:{rate:450}, assumptions:{a1:{text:"x2", cat:"gevinst", impact:3, uncertainty:2, expected:"1", order:1}, a3:{text:"ny", cat:"brug", impact:2, uncertainty:2, expected:"", order:3}},
                 milestones:{m1:{name:"M", desc:"d", date:"", budget:"", tests:{a1:true}, order:1}}};
  const p = DDP.planPatch(draft, orig);
  eq(p.name, "A2"); eq(p.rev.rate, 450); eq(p.assumptions.a1, {text:"x2", cat:"gevinst", impact:3, uncertainty:2, expected:"1", order:1});
  eq(p.assumptions.a2, {deleted:true}); eq(p.assumptions.a3.text, "ny");
  eq(Object.keys(p.milestones.m1).sort(), ["budget","date","desc","name","order","tests"]);
  ["status","actual","notes"].forEach(k => ok(!(k in p.assumptions.a1), k)); ["result","decision"].forEach(k => ok(!(k in p.milestones.m1), k));
  ok(!("build" in p) && !("feedback" in p) && !("notes" in p));
});
test("ret planen: gem skriver ét update og bevarer status", async () => {
  DDP.setMode("live"); window.__snap({docs:[fakeDoc("e1",{name:"E", rev:{rate:400}, assumptions:{a1:{text:"x", status:"holder", actual:"2", order:1}}, milestones:{}})], size:1, metadata:{fromCache:false}});
  DDP.readHashFrom("#p-e1-plan"); DDP.render(); act("wiz-next"); setField("rev.rate", "450"); act("wiz-next"); act("wiz-next");
  window.__writes.length = 0; act("wiz-finish"); await tick(); await tick();
  eq(window.__writes.length, 1); eq(window.__writes[0].op, "update"); eq(window.__writes[0].p.rev.rate, 450); ok(!("status" in window.__writes[0].p.assumptions.a1));
  eq(DDP.state().projects.e1.assumptions.a1.status, "holder"); eq(DDP.state().view.wiz, null); eq(location.hash, "#p-e1");
});
test("ret planen: fjernet antagelse forsvinder fra milepælens testliste", () => {
  DDP.setMode("live"); window.__snap({docs:[fakeDoc("e2",{name:"E2", assumptions:{a1:{text:"x", order:1}, a2:{text:"y", order:2}}, milestones:{m1:{name:"M", tests:{a1:true, a2:true}, order:1}}})], size:1, metadata:{fromCache:false}});
  DDP.readHashFrom("#p-e2-plan"); DDP.render(); act("wiz-next"); act("wiz-next");
  const real = window.confirm; window.confirm = () => true; try { appEl().querySelector('[data-act="del-ass"][data-id="a1"]').click(); } finally { window.confirm = real; }
  act("wiz-next"); act("wiz-finish");
  DDP.readHashFrom("#p-e2"); DDP.render();
  const gates = [...appEl().querySelectorAll(".gate-a")]; eq(gates.length, 1); ok(gates[0].textContent.includes("y"), "kun den tilbageværende antagelse vises");
});
```

Ret eksisterende tests: alle `openDemo("#demo-p-…-antagelser")`/`-milepaele`/`-gevinst`/`-bygget` virker stadig som adresser (de ruller nu). "fanen bygget vises med felterne" → omdøb til "sektionen bygget …" (samme asserts). "I3: læseadgang kan skifte fane i et projekt" → erstat med: læseadgang viser projektsiden uden "Ret planen" (`ok(!appEl().querySelector('[data-act="edit-plan"]'))`). "design: projekthovedet har kun titel, status og afdeling" → `before` findes ved at gå bagud fra `#sec-plan` i stedet for `.steps`. "design: fanetitel og fokus følger visningen" → erstat med: `openDemo("#demo-p-demo-lager")` giver `document.title` = `"Automatisk lagerrapport · DDP-planlægning"`; derefter `act("edit-plan")` giver titlen `"Ret planen · Automatisk lagerrapport · DDP-planlægning"` og `document.activeElement.id === "view-title"`. "design: besluttede milepæle er foldet sammen …" → uændret (dækket igen af den nye test). "design: Antagelser bruger ingen fast kolonnebredde inline" og "design: matrix-chip …" → åbn `#demo-p-demo-retur` (matrixen er i `#sec-antagelser`). "design: sletning af antagelse kræver bekræftelse" → åbn `#demo-p-demo-retur-plan` og gå til trin 3. "design: alle felter på Antagelser/Milepæle har et navn" → kør på `#demo-p-demo-retur` (sektionerne) **og** på `-plan` trin 3 og 4. "design: samme navn for 'lav antagelser' begge steder" → planboksen har ikke knappen længere; sammenlign trin 2 og trin 3 i `#demo-nyt`.

- [ ] **Step 2: Kør testene, og se dem fejle**

- [ ] **Step 3: Implementér projektsiden** (`renderProject`, `planBox`, `secAss`, `secMs`, `secBuild`, `secEval`, `view.scrollTo`, hash, handlere) og fjern `TABS`, `tabLabel`, `tabRev`, `tabAss`, `tabMs`, `view.tab`.

- [ ] **Step 4: Implementér edit-mode** (`edit-plan`, lazy draft fra `orig`, `locked`, `planPatch`, `wiz-finish` for edit).

- [ ] **Step 5: CSS**: `.sec{margin-top:28px;padding-top:18px;border-top:1px solid var(--line)}`, `.sec>h2{margin:0 0 10px}`, `.planbox .ledger{max-width:520px}`, `.ms.next>.ms-head{border-color:var(--info)}`.

- [ ] **Step 6: README**: "Sådan bruger du det" skrives om efter spec afsnit 1-4 (opret i fire trin; projektsiden med planboks, antagelser, milepæle, bygget, evaluering; "Ret planen"; noter). "Struktur" og "Vigtige steder i app.js": `renderWizard`, `planBox`, `secAss`/`secMs`, `renderNotes`, `planPatch`; `tabRev/tabAss/tabMs` udgår. Statustabellen er rettet i Task 2.

- [ ] **Step 7: Kør alle tests, byg, commit**

```bash
git add src/app.js src/styles.css README.md tests/tests.html dist/ddp-planlaegning.html
git commit -m "Projektsiden som opfølgning på én side, og Ret planen"
```

---

### Task 6: Demodata med noter, og gennemgang i browseren

**Files:**
- Modify: `src/demo.js` (noter på to-tre projekter: ét projekt-niveau, én antagelse, én milepæl; `by` er et id fra `people`, `at` via `ts(...)`)
- Test: `tests/tests.html`

- [ ] **Step 1: Skriv den fejlende test**

```js
test("demo: mindst ét projekt har noter på projekt, antagelse og milepæl, og alle by findes", () => {
  const ps = Object.values(DDP_DEMO.projects); const all = [];
  ps.forEach(p => { Object.values(p.notes||{}).forEach(n => all.push(["p",n])); Object.values(p.assumptions).forEach(a => Object.values(a.notes||{}).forEach(n => all.push(["a",n]))); Object.values(p.milestones).forEach(m => Object.values(m.notes||{}).forEach(n => all.push(["m",n]))); });
  ["p","a","m"].forEach(k => ok(all.some(([kind]) => kind === k), "noter af typen " + k));
  all.forEach(([,n]) => { ok(n.text && n.at && n.order, "note er udfyldt"); ok(DDP_DEMO.people[n.by], n.by); });
});
```

- [ ] **Step 2: Kør, se den fejle; tilføj noterne i `demo.js`** (fx på "Hjælp til returhenvendelser": en projektnote om, at kundeservice har spidsbelastning i januar; en note på antagelsen om svartid; en note på en milepæl om, at testen blev udskudt en uge). Hjælper `N=(rows)=>Object.fromEntries(rows.map(([id,text,by,at],i)=>[id,{text,by,at:ts(at),order:i+1}]))`.

- [ ] **Step 3: Kør alle tests, byg**

- [ ] **Step 4: Gennemgang i browseren** (`powershell -ExecutionPolicy Bypass -File start.ps1`, http://localhost:8000): Demo → Opret projekt → alle fire trin → Opret; projektsiden; Ret planen → Gem; tilføj en note hvert af de tre steder; åbn `#demo-p-demo-retur-bygget` og se, at der rulles. Tjek ved 375 px bredde, at trinviseren og `wiz-nav` ikke går ud over kanten. Ret det, der ser forkert ud, uden at ændre adfærd.

- [ ] **Step 5: Commit**

```bash
git add src/demo.js src/styles.css tests/tests.html dist/ddp-planlaegning.html
git commit -m "Demodata med noter"
```

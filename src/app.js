(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf=new Intl.NumberFormat("da-DK",{maximumFractionDigits:0});
const nf1=new Intl.NumberFormat("da-DK",{maximumFractionDigits:1});
const kr=v=>isFinite(v)?nf.format(v)+" kr.":"–";
const newId=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const clone=o=>JSON.parse(JSON.stringify(o??{}));
const fmtDate=d=>{if(!d)return "Ingen dato";const x=new Date(d+"T12:00:00");return isNaN(x)?d:x.toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"})};
const fmtTs=t=>t?new Date(t).toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"}):"";
function deepMerge(t,s){for(const k in s){const v=s[k];if(v&&typeof v==="object"&&!Array.isArray(v)){if(!t[k]||typeof t[k]!=="object")t[k]={};deepMerge(t[k],v)}else t[k]=v}return t}

const CATS={gevinst:"Gevinst",brug:"Brug og adoption",omk:"Omkostning",teknisk:"Teknisk",org:"Organisatorisk"};
const LVL={1:"Lav",2:"Mellem",3:"Høj"};
const STATUS={ikke:"Ikke testet",holder:"Holder",delvist:"Holder delvist",holder_ikke:"Holder ikke"};
const DEC={fortsaet:"Fortsæt",juster:"Justér",stop:"Stop"};
const REV_DEFAULT={targetNet:100000,marginPct:50,rate:400,users:5,weeks:46,lifetime:2,devHours:40,oneTime:0,maintHours:4,runMonthly:200};
const FQ=[
  ["q1","Hjalp metoden dig med at se, hvad der skal være sandt, for at projektet er umagen værd?"],
  ["q2","Blev det lettere at beslutte, om projektet skulle fortsætte, justeres eller stoppes?"],
  ["q3","Var antagelserne og milepælene konkrete nok til at kunne testes?"],
  ["q4","Var værktøjet let at bruge?"]
];

let db=null,userCap=null,dl=null,meId=null,canWrite=true,localMode=false;
let projects={},loaded=false,loadErr="",staleNote="";
/* mode: "live" = fælles database, "demo" = opdigtede projekter kun i hukommelsen */
let mode="live",liveProjects=projects,demoProjects=null;
const DEMO=window.DDP_DEMO||{projects:{},people:{}};
const inMemory=()=>localMode||mode==="demo";
const canEdit=()=>mode==="demo"||canWrite;
const names=Object.assign({},DEMO.people);
const view={pid:null,tab:"gevinst",home:"projekter",filter:{dep:"",tech:"",q:""}};

/* ---------- writes: optimistic, coalesced, one at a time per doc ---------- */
const pend={},timers={},chains={};
function queuePatch(id,patch,delay=600){
  if(!canEdit())return;
  pend[id]=deepMerge(pend[id]||{},clone(patch));
  if(projects[id])deepMerge(projects[id],clone(patch));
  clearTimeout(timers[id]);
  timers[id]=setTimeout(()=>flush(id),delay);
}
function flush(id){
  const p=pend[id];if(!p)return;delete pend[id];
  p.updatedAt=Date.now();
  if(inMemory()){if(projects[id])projects[id].updatedAt=p.updatedAt;return}
  chains[id]=(chains[id]||Promise.resolve()).then(()=>doUpdate(id,p,true));
}
async function doUpdate(id,p,retry){
  try{await db.doc("projects/"+id).update(p)}
  catch(e){
    if(e&&e.code==="unavailable"&&retry){await new Promise(r=>setTimeout(r,500+Math.random()*800));return doUpdate(id,p,false)}
    if(e&&e.code==="invalid_argument"){canWrite=false;toast("Du har kun læseadgang til dette værktøj.");render();return}
    toast(e&&e.code==="quota_exceeded"?"Databasen er fuld. Slet gamle projekter for at fortsætte.":"Ændringen kunne ikke gemmes. Prøv igen.");
  }
}
function flushAll(){for(const id in pend){clearTimeout(timers[id]);flush(id)}}
window.addEventListener("pagehide",flushAll);

async function createProject(data){
  const id=newId();
  if(inMemory()){projects[id]=data;return id}
  try{await db.collection("projects").doc(id).set(data);liveProjects[id]=liveProjects[id]||data;return id}
  catch(e){toast(e&&e.code==="quota_exceeded"?"Databasen er fuld.":"Projektet kunne ikke oprettes.");return null}
}
async function deleteProject(id){
  if(inMemory()){delete projects[id];return}
  try{await db.doc("projects/"+id).delete();delete projects[id]}catch(e){toast("Projektet kunne ikke slettes.")}
}

/* ---------- helpers on project data ---------- */
const P=()=>projects[view.pid];
const rev=p=>Object.assign({},REV_DEFAULT,p.rev||{});
function listOf(obj){return Object.entries(obj||{}).filter(([,v])=>v&&!v.deleted).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>(a.order||0)-(b.order||0))}
function msSorted(p){return listOf(p.milestones).sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")||(a.order||0)-(b.order||0))}
function calc(r){
  const n=k=>Math.max(0,Number(r[k])||0);
  const targetNet=n("targetNet"),margin=Math.min(99,Math.max(1,n("marginPct")||1)),rate=n("rate")||1,users=n("users")||1,weeks=n("weeks")||1,life=n("lifetime")||1;
  const gross=targetNet/(margin/100);
  const allow=gross-targetNet;
  const hoursYear=gross/rate;
  const perUserWeek=hoursYear/users/weeks;
  const build=n("devHours")*rate+n("oneTime");
  const buildYear=build/life;
  const maintYear=n("maintHours")*12*rate;
  const runYear=n("runMonthly")*12;
  const est=buildYear+maintYear+runYear;
  const breakEvenMin=est/rate/users/weeks*60;
  return {targetNet,margin,rate,users,weeks,life,gross,allow,hoursYear,perUserWeek,build,buildYear,maintYear,runYear,est,slack:allow-est,breakEvenMin};
}
function status(p){
  const dec=listOf(p.milestones).filter(m=>m.decision&&m.decidedAt).sort((a,b)=>b.decidedAt-a.decidedAt);
  if(!dec.length)return listOf(p.assumptions).length?["I test","acc"]:["Under planlægning",""];
  const d=dec[0].decision;
  if(d==="fortsaet"&&p.build&&p.build.live)return ["I drift","ok"];
  return d==="stop"?["Stoppet","bad"]:d==="juster"?["Justeres","warn"]:["Fortsætter","ok"];
}
const stackOf=p=>(p.build&&Array.isArray(p.build.stack))?p.build.stack:[];
function allStackTags(obj){
  const seen=new Map();
  Object.values(obj||{}).forEach(p=>stackOf(p||{}).forEach(t=>{const k=String(t).toLowerCase();if(!seen.has(k))seen.set(k,t)}));
  return [...seen.values()].sort((a,b)=>a.localeCompare(b,"da"));
}
function addTag(pid,tag){
  const t=String(tag??"").trim(),p=projects[pid];if(!t||!p)return;
  const cur=stackOf(p);
  if(cur.some(x=>x.toLowerCase()===t.toLowerCase()))return;
  queuePatch(pid,{build:{stack:cur.concat(t)}},0);
}
function removeTag(pid,tag){
  const p=projects[pid];if(!p)return;
  queuePatch(pid,{build:{stack:stackOf(p).filter(x=>x!==tag)}},0);
}
function aNum(p){const m={};listOf(p.assumptions).forEach((a,i)=>m[a.id]="A"+(i+1));return m}

/* ---------- names ---------- */
async function resolveNames(){
  if(!userCap)return;
  const ids=new Set();
  for(const p of Object.values(projects)){
    if(p.createdBy)ids.add(p.createdBy);
    listOf(p.milestones).forEach(m=>m.decidedBy&&ids.add(m.decidedBy));
    Object.keys(p.feedback||{}).forEach(k=>ids.add(k));
  }
  const missing=[...ids].filter(i=>!(i in names));
  if(!missing.length)return;
  try{const ps=await userCap.profiles(missing);let ch=false;for(const id of missing){names[id]=(ps[id]&&ps[id].name)||"";ch=true}if(ch)render()}catch(e){}
}
const nameOf=id=>id===meId?"dig":(names[id]||"En kollega");

/* ---------- rendering ---------- */
function render(){
  const a=document.activeElement,key=a&&a.dataset?a.dataset.k:null;
  let sel=null;if(key)try{sel=[a.selectionStart,a.selectionEnd]}catch(e){}
  const val=key&&a.type!=="checkbox"&&a.type!=="radio"?a.value:null;
  const sy=window.scrollY;
  const app=$("#app");
  renderMode();
  if(!loaded&&!inMemory()){app.innerHTML=`<p class="muted">Indlæser projekter …</p>${staleNote?`<div class="banner info">${esc(staleNote)}</div>`:""}`;return}
  if(view.pid&&!projects[view.pid]){view.pid=null}
  const live=mode==="live";
  app.innerHTML=(mode==="demo"?`<div class="banner demo">Du ser demodata. Ændringer gemmes ikke.</div>`:"")
    +(live&&loadErr?`<div class="banner err">${esc(loadErr)}</div>`:"")
    +(live&&localMode?`<div class="banner info">Data gemmes ikke i denne visning. Åbn værktøjet via det publicerede link for at dele projekter med kolleger.</div>`:"")
    +(live&&!canWrite?`<div class="banner info">Du har læseadgang. Bed ejeren om adgang som Contributor for at redigere.</div>`:"")
    +(view.pid?renderProject():renderOverview());
  $("#crumb").textContent=view.pid?(P().name||"Uden navn"):"";
  if(key){
    const el=document.querySelector(`[data-k="${CSS.escape(key)}"]`);
    if(el){if(val!==null)el.value=val;el.focus({preventScroll:true});if(sel)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}}
  }
  window.scrollTo(0,sy);
}

function renderMode(){
  const el=$("#mode");if(!el)return;
  el.innerHTML=`<span class="seg" role="group" aria-label="Visning">${[["demo","Demo"],["live","Live"]].map(([k,l])=>`<button type="button" data-act="mode" data-mode="${k}" aria-pressed="${mode===k}">${l}</button>`).join("")}</span>`;
}
function applyMode(m){
  mode=m;
  if(m==="demo"&&!demoProjects)demoProjects=clone(DEMO.projects);
  projects=m==="demo"?demoProjects:liveProjects;
}
function setMode(m){
  flushAll();applyMode(m);view.pid=null;view.home="projekter";view.filter={dep:"",tech:"",q:""};setHash();render();
}

const fieldset=html=>`<fieldset class="all" ${canEdit()?"":"disabled"}>${html}</fieldset>`;

/* katalog: projekter med beskrivelse eller tech stack, filtreret */
function catalogItems(obj,f){
  f=f||{};
  const tech=String(f.tech||"").toLowerCase(),q=String(f.q||"").trim().toLowerCase();
  return Object.entries(obj||{}).map(([id,p])=>Object.assign({id},p))
    .filter(p=>{const b=p.build||{};return String(b.summary||"").trim()||stackOf(p).length})
    .filter(p=>!f.dep||p.department===f.dep)
    .filter(p=>!tech||stackOf(p).some(t=>t.toLowerCase()===tech))
    .filter(p=>{if(!q)return true;const b=p.build||{};return [p.name,p.department,b.summary,b.reusable,b.learnings].concat(stackOf(p)).some(x=>String(x||"").toLowerCase().includes(q))})
    .sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
}
function renderCatalog(){
  const all=catalogItems(projects,{}),items=catalogItems(projects,view.filter),f=view.filter;
  const deps=[...new Set(all.map(p=>p.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"da"));
  const techs=allStackTags(Object.fromEntries(all.map(p=>[p.id,p])));
  const opt=(v,l,cur)=>`<option value="${esc(v)}" ${cur===v?"selected":""}>${esc(l)}</option>`;
  const filters=`<div class="cat-filters">
      <select data-k="filter.dep" aria-label="Afdeling">${opt("","Alle afdelinger",f.dep)}${deps.map(d=>opt(d,d,f.dep)).join("")}</select>
      <select data-k="filter.tech" aria-label="Teknologi">${opt("","Alle teknologier",f.tech)}${techs.map(t=>opt(t,t,f.tech)).join("")}</select>
      <input type="search" data-k="filter.q" value="${esc(f.q)}" placeholder="Søg i værktøjer, læring og genbrug" aria-label="Søg">
    </div>`;
  const cards=items.map(p=>{const [st,cls]=status(p),b=p.build||{},stack=stackOf(p);
    return `<button class="cat-card" type="button" data-act="open-build" data-id="${p.id}">
      <div class="cat-top"><span class="name">${esc(p.name||"Uden navn")}</span><span class="pill ${cls}">${st}</span></div>
      <div class="small muted">${esc(p.department||"Ingen afdeling")}</div>
      ${b.summary?`<p class="cat-sum">${esc(b.summary)}</p>`:""}
      ${stack.length?`<div class="tags">${stack.slice(0,5).map(t=>`<span class="tag plain">${esc(t)}</span>`).join("")}${stack.length>5?`<span class="small muted">+${stack.length-5}</span>`:""}</div>`:""}
      ${b.reusable?`<div class="small"><span class="muted">Genbrugelig:</span> ${esc(b.reusable)}</div>`:""}
    </button>`}).join("");
  if(!all.length)return `<p class="empty">Der er ingen dokumenterede værktøjer endnu. Udfyld fanen Sådan er det bygget i et projekt, så det kommer med her.</p>`;
  return filters+(items.length?`<div class="cat-grid">${cards}</div>`:`<p class="empty">Ingen værktøjer matcher filtrene.</p>`);
}

function renderOverview(){
  const list=Object.entries(projects).map(([id,p])=>Object.assign({id},p)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  const rows=list.map(p=>{
    const [st,cls]=status(p);
    const as=listOf(p.assumptions),tested=as.filter(a=>a.status&&a.status!=="ikke").length;
    const next=msSorted(p).find(m=>!m.decision);
    return `<button class="proj-row" data-act="open" data-id="${p.id}">
      <div><div class="name">${esc(p.name||"Uden navn")}</div><div class="small muted">${esc(p.department||"Ingen afdeling")}${p.createdBy?` · oprettet af ${esc(nameOf(p.createdBy))}`:""}</div></div>
      <div><span class="pill ${cls}">${st}</span></div>
      <div class="small">${as.length?`${tested} af ${as.length} antagelser testet<div class="meter"><i style="width:${as.length?tested/as.length*100:0}%"></i></div>`:`<span class="muted">Ingen antagelser endnu</span>`}</div>
      <div class="small">${next?`<div>${esc(next.name||"Milepæl")}</div><div class="muted">${fmtDate(next.date)}</div>`:`<span class="muted">Ingen åben milepæl</span>`}</div>
    </button>`}).join("");
  return `<div class="row-actions" style="justify-content:space-between;align-items:flex-end">
      <div><h1>Interne udviklingsprojekter</h1><p class="muted" style="max-width:62ch;margin:0">Planlæg hvert projekt ud fra, hvad det skal give, test de antagelser det hviler på, og beslut ved hver milepæl om det skal fortsætte, justeres eller stoppes.</p></div>
      <div class="row-actions">${list.length?`<button class="btn" data-act="export-json" type="button">Eksportér alle data</button><button class="btn" data-act="export-csv" type="button">Beslutningslog (CSV)</button>`:""}</div>
    </div>
    <nav class="hometabs" role="tablist">${[["projekter","Projekter",list.length],["katalog","Værktøjskatalog",catalogItems(projects,{}).length]].map(([k,l,n])=>`<button type="button" role="tab" aria-selected="${view.home===k}" data-act="home-tab" data-home="${k}">${l} <span class="muted">(${n})</span></button>`).join("")}</nav>
    ${view.home==="katalog"?renderCatalog():`    ${list.length?`<div class="proj-list"><div class="proj-row proj-head"><div>Projekt</div><div>Status</div><div>Antagelser</div><div>Næste milepæl</div></div>${rows}</div>`
      :`<p class="empty">Der er ingen projekter endnu. Opret det første nedenfor.</p>`}
    ${fieldset(`<div class="panel" style="margin-top:28px">
      <h2>Nyt projekt</h2><p class="muted small">Et projekt er en idé til et internt værktøj fra en afdeling.</p>
      <div class="grid2">
        <div><label class="f" for="np-name">Projektnavn</label><input type="text" id="np-name" placeholder="Fx automatisk lagerrapport"></div>
        <div><label class="f" for="np-dep">Afdeling</label><input type="text" id="np-dep" placeholder="Fx Indkøb"></div>
      </div>
      <div style="margin-top:14px"><label class="f" for="np-desc">Hvilket problem skal værktøjet løse?</label><textarea id="np-desc" rows="2"></textarea></div>
      <div style="margin-top:14px"><button class="btn primary" data-act="create" type="button">Opret projekt</button></div>
    </div>`)}`}`;
}

function renderProject(){
  const p=P();
  const [st,cls]=status(p);
  const tabs=[["gevinst","Gevinstregnskab"],["antagelser","Antagelser"],["milepaele","Milepæle og beslutninger"],["bygget","Sådan er det bygget"],["evaluering","Evaluering"]];
  const body={gevinst:tabRev,antagelser:tabAss,milepaele:tabMs,bygget:tabBuild,evaluering:tabEval}[view.tab]||tabRev;
  return fieldset(`<div class="row-actions" style="justify-content:space-between;align-items:flex-start">
      <div style="flex:1;min-width:260px">
        <input type="text" data-k="p.name" value="${esc(p.name)}" aria-label="Projektnavn" style="font-size:26px;font-weight:700;border-color:transparent;padding:4px 6px;margin-left:-7px;background:transparent;letter-spacing:-.02em">
        <div class="row-actions small muted" style="margin-top:4px"><span class="pill ${cls}">${st}</span>
          <input type="text" data-k="p.department" value="${esc(p.department)}" placeholder="Afdeling" aria-label="Afdeling" style="width:180px;min-height:30px;padding:3px 8px">
          ${p.createdBy?`<span>Oprettet af ${esc(nameOf(p.createdBy))} ${fmtTs(p.createdAt)}</span>`:""}</div>
      </div>
      <button class="btn ghost danger" data-act="del-project" type="button">Slet projekt</button>
    </div>
    <div style="margin-top:12px;max-width:760px"><label class="f" for="p-desc">Problemet værktøjet skal løse</label><textarea id="p-desc" data-k="p.description" rows="2">${esc(p.description)}</textarea></div>
    `)+`<nav class="steps" role="tablist">${tabs.map(([k,l],i)=>`<button class="step" role="tab" type="button" aria-selected="${view.tab===k}" data-act="tab" data-tab="${k}"><b>${i+1}</b>${l}</button>`).join("")}</nav>
    `+fieldset(body(p));
}

function numField(k,label,val,unit){
  return `<div><label class="f" for="f-${k}">${label}</label><div style="display:flex;align-items:center;gap:6px"><input type="number" id="f-${k}" min="0" step="any" data-k="rev.${k}" data-num="1" data-r="rev" value="${esc(val)}"><span class="small muted" style="white-space:nowrap">${unit}</span></div></div>`;
}
function tabRev(p){
  const r=rev(p);
  return `<p class="lead">Start med, hvad projektet skal give, ikke med hvad det vil koste. Regn baglæns til, hvad der skal være sandt, og hvad projektet højst må koste. De tal bliver jeres første antagelser.</p>
  <div class="two">
    <div class="stack">
      <div class="panel"><h3>Krævet gevinst</h3><p class="small muted">Hvad skal projektet mindst give om året for at være umagen værd?</p>
        <div class="grid3">
          ${numField("targetNet","Krævet nettogevinst pr. år",r.targetNet,"kr.")}
          ${numField("marginPct","Krævet gevinstmargin",r.marginPct,"%")}
          ${numField("rate","Timepris",r.rate,"kr./t")}
          ${numField("users","Antal brugere",r.users,"pers.")}
          ${numField("weeks","Arbejdsuger pr. år",r.weeks,"uger")}
          ${numField("lifetime","Forventet levetid",r.lifetime,"år")}
        </div>
        <p class="small muted" style="margin:10px 0 0">Gevinstmarginen er den andel af bruttogevinsten, der skal være tilbage, når omkostningerne er trukket fra.</p>
      </div>
      <div class="panel"><h3>Forventede omkostninger</h3><p class="small muted">Jeres bedste bud på, hvad det koster at bygge og holde værktøjet kørende.</p>
        <div class="grid3">
          ${numField("devHours","Udviklingstid",r.devHours,"timer")}
          ${numField("oneTime","Andre engangsudgifter",r.oneTime,"kr.")}
          ${numField("maintHours","Vedligehold pr. måned",r.maintHours,"timer")}
          ${numField("runMonthly","Drift og licenser pr. måned",r.runMonthly,"kr.")}
        </div>
      </div>
    </div>
    <div id="rev-out">${revOut(r)}</div>
  </div>`;
}
function revOut(r){
  const c=calc(r);
  const mx=Math.max(c.allow,c.est,1);
  const ok=c.slack>=0;
  return `<div class="panel" style="position:sticky;top:calc(16px + env(safe-area-inset-top,0px))">
    <p class="statement">Hver bruger skal spare <strong>${nf1.format(c.perUserWeek)} timer om ugen</strong>, for at projektet er umagen værd.</p>
    <p class="small muted">Det svarer til ${nf.format(c.hoursYear)} sparede timer om året fordelt på ${nf.format(c.users)} brugere.</p>
    <table class="ledger" style="margin-top:14px">
      <tr><td>Krævet nettogevinst</td><td>${kr(c.targetNet)}</td></tr>
      <tr><td>Krævet bruttogevinst (÷ ${nf.format(c.margin)} %)</td><td>${kr(c.gross)}</td></tr>
      <tr class="sum"><td>Tilladte omkostninger pr. år</td><td>${kr(c.allow)}</td></tr>
    </table>
    <table class="ledger" style="margin-top:18px">
      <tr><td>Udvikling fordelt over ${nf1.format(c.life)} år</td><td>${kr(c.buildYear)}</td></tr>
      <tr><td>Vedligehold</td><td>${kr(c.maintYear)}</td></tr>
      <tr><td>Drift og licenser</td><td>${kr(c.runYear)}</td></tr>
      <tr class="sum"><td>Forventede omkostninger pr. år</td><td>${kr(c.est)}</td></tr>
    </table>
    <div class="cmp">
      <span>Tilladt</span><div class="bar"><i style="width:${c.allow/mx*100}%;background:var(--ink-2)"></i></div><span class="small">${kr(c.allow)}</span>
      <span>Forventet</span><div class="bar"><i style="width:${c.est/mx*100}%;background:${ok?"var(--ok)":"var(--bad)"}"></i></div><span class="small">${kr(c.est)}</span>
    </div>
    <div class="verdict ${ok?"ok":"bad"}">${ok
      ?`Omkostningerne ligger ${kr(c.slack)} under rammen. Projektet hviler nu på, at tidsbesparelsen faktisk opnås.`
      :`Omkostningerne overstiger rammen med ${kr(-c.slack)}. Sænk omkostningerne, find flere brugere, eller overvej om projektet skal startes.`}</div>
    <p class="small muted" style="margin:12px 0 0">Nulpunkt: hver bruger skal spare ${nf.format(c.breakEvenMin)} minutter om ugen, før værktøjet bare dækker sine egne omkostninger.</p>
    <div style="margin-top:14px"><button class="btn" type="button" data-act="suggest-ass">Gør tallene til antagelser</button></div>
  </div>`;
}

function tabAss(p){
  const as=listOf(p.assumptions),num=aNum(p);
  const prio=as.slice().sort((a,b)=>((b.impact||2)*(b.uncertainty||2))-((a.impact||2)*(a.uncertainty||2)));
  const cells=[];
  for(let imp=3;imp>=1;imp--){for(let un=1;un<=3;un++){
    const inCell=as.filter(a=>(a.impact||2)==imp&&(a.uncertainty||2)==un);
    cells.push(`<div class="cell ${imp>=2&&un>=2&&imp+un>=5?"hot":""}" aria-label="Betydning ${LVL[imp]}, usikkerhed ${LVL[un]}">${inCell.map(a=>`<span class="chip s-${a.status||"ikke"}" title="${esc(a.text)}">${num[a.id]}</span>`).join("")}</div>`)
  }}
  const matrix=`<div class="matrix">
    <div class="axis yl" style="grid-row:1/4">Betydning: lav til høj</div>
    ${cells.map((c,i)=>c.replace('class="cell','style="grid-column:'+(i%3+2)+';grid-row:'+(Math.floor(i/3)+1)+'" class="cell')).join("")}
    <div class="axis" style="grid-column:2/5;grid-row:4">Usikkerhed: lav til høj</div>
  </div>`;
  const rows=as.map(a=>`<div class="a-row" id="a-${a.id}">
      <div class="a-num">${num[a.id]}</div>
      <div>
        <div class="a-top"><textarea rows="2" data-k="a.${a.id}.text" aria-label="Antagelse" placeholder="Hvad skal være sandt?">${esc(a.text)}</textarea>
          <button class="btn ghost danger" type="button" data-act="del-ass" data-id="${a.id}" aria-label="Slet antagelse ${num[a.id]}">Slet</button></div>
        <div class="a-fields">
          <div><label class="f">Kategori</label><select data-k="a.${a.id}.cat">${Object.entries(CATS).map(([k,l])=>`<option value="${k}" ${a.cat===k?"selected":""}>${l}</option>`).join("")}</select></div>
          <div><label class="f">Betydning</label><select data-k="a.${a.id}.impact" data-num="1">${[3,2,1].map(v=>`<option value="${v}" ${(a.impact||2)==v?"selected":""}>${LVL[v]}</option>`).join("")}</select></div>
          <div><label class="f">Usikkerhed</label><select data-k="a.${a.id}.uncertainty" data-num="1">${[3,2,1].map(v=>`<option value="${v}" ${(a.uncertainty||2)==v?"selected":""}>${LVL[v]}</option>`).join("")}</select></div>
          <div><label class="f">Forventet værdi</label><input type="text" data-k="a.${a.id}.expected" value="${esc(a.expected)}" placeholder="Fx 1,5 t/uge"></div>
          <div><label class="f">Status</label><select data-k="a.${a.id}.status">${Object.entries(STATUS).map(([k,l])=>`<option value="${k}" ${(a.status||"ikke")===k?"selected":""}>${l}</option>`).join("")}</select></div>
          <div><label class="f">Faktisk værdi</label><input type="text" data-k="a.${a.id}.actual" value="${esc(a.actual)}" placeholder="Målt resultat"></div>
        </div>
      </div>
    </div>`).join("");
  return `<p class="lead">Skriv alt det, der skal være sandt, for at projektet lykkes. Antagelser med høj betydning og høj usikkerhed skal testes først, fordi de kan vælte projektet.</p>
  <div class="two" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)">
    <div>
      <div class="row-actions" style="margin-bottom:6px"><button class="btn primary" type="button" data-act="add-ass">Tilføj antagelse</button>
        <button class="btn" type="button" data-act="suggest-ass">Foreslå fra gevinstregnskabet</button></div>
      ${as.length?rows+`<div style="border-top:1px solid var(--line)"></div>`:`<p class="empty">Ingen antagelser endnu. Start med at gøre tallene fra gevinstregnskabet til antagelser.</p>`}
    </div>
    <div class="stack">
      <div class="panel"><h3>Prioritering</h3><p class="small muted">Farvede felter er antagelser, der bør testes tidligt.</p>${matrix}</div>
      ${prio.length?`<div class="panel"><h3>Test i denne rækkefølge</h3><ol style="margin:8px 0 0;padding-left:20px;font-size:14px">${prio.filter(a=>(a.status||"ikke")==="ikke").slice(0,5).map(a=>`<li style="margin-bottom:6px"><b>${num[a.id]}</b> ${esc(a.text||"Uden tekst")}</li>`).join("")||`<li class="muted" style="list-style:none;margin-left:-20px">Alle antagelser er testet.</li>`}</ol></div>`:""}
    </div>
  </div>`;
}

function tabMs(p){
  const ms=msSorted(p),as=listOf(p.assumptions),num=aNum(p);
  const path=ms.length?`<div class="panel" style="margin-bottom:8px"><div class="path"><div class="path-inner">${ms.map((m,i)=>`<button class="node" type="button" data-act="goto-ms" data-id="${m.id}"><div class="gate ${m.decision||""}"><span>${i+1}</span></div><div class="nm">${esc(m.name||"Milepæl")}</div><div class="dt">${m.decision?DEC[m.decision]:fmtDate(m.date)}</div></button>`).join("")}</div></div></div>`:"";
  const cards=ms.map((m,i)=>{
    const tests=as.filter(a=>m.tests&&m.tests[a.id]);
    return `<section class="ms" id="ms-${m.id}">
      <div class="ms-head"><span class="num">Milepæl ${i+1}</span>${m.decision?`<span class="pill ${m.decision==="fortsaet"?"ok":m.decision==="juster"?"warn":"bad"}">${DEC[m.decision]}</span>`:`<span class="pill">Afventer beslutning</span>`}<span class="spacer"></span><button class="btn ghost danger" type="button" data-act="del-ms" data-id="${m.id}">Slet</button></div>
      <div class="two">
        <div class="stack">
          <div><label class="f">Navn</label><input type="text" data-k="m.${m.id}.name" value="${esc(m.name)}" placeholder="Fx klikbar prototype testet med 3 brugere"></div>
          <div class="grid2"><div><label class="f">Planlagt dato</label><input type="date" data-k="m.${m.id}.date" data-full="1" value="${esc(m.date)}"></div>
            <div><label class="f">Budget til milepælen</label><div style="display:flex;gap:6px;align-items:center"><input type="number" min="0" step="any" data-k="m.${m.id}.budget" data-num="1" value="${esc(m.budget)}"><span class="small muted">timer</span></div></div></div>
          <div><label class="f">Hvad gør I, og hvordan måler I?</label><textarea data-k="m.${m.id}.desc" rows="3">${esc(m.desc)}</textarea></div>
        </div>
        <div><label class="f">Antagelser milepælen tester</label>
          ${as.length?`<div class="tests">${as.map(a=>`<label><input type="checkbox" data-k="m.${m.id}.tests.${a.id}" ${m.tests&&m.tests[a.id]?"checked":""}><span><b>${num[a.id]}</b> ${esc(a.text||"Uden tekst")}</span></label>`).join("")}</div>`:`<p class="small muted">Tilføj antagelser først.</p>`}
        </div>
      </div>
      <div class="gatebox">
        <h3>Beslutningspunkt</h3>
        <p class="small muted">Sammenlign resultatet med antagelserne, og beslut hvad der sker nu.</p>
        ${tests.length?`<div style="margin:6px 0 12px">${tests.map(a=>`<div class="gate-a"><span><b>${num[a.id]}</b> ${esc(a.text)}${a.expected?` <span class="muted">(forventet: ${esc(a.expected)})</span>`:""}</span>
          <input type="text" data-k="a.${a.id}.actual" value="${esc(a.actual)}" placeholder="Faktisk værdi" aria-label="Faktisk værdi for ${num[a.id]}">
          <select data-k="a.${a.id}.status" aria-label="Status for ${num[a.id]}">${Object.entries(STATUS).map(([k,l])=>`<option value="${k}" ${(a.status||"ikke")===k?"selected":""}>${l}</option>`).join("")}</select></div>`).join("")}</div>`:""}
        <label class="f">Resultat og læring</label><textarea data-k="m.${m.id}.result" rows="2" placeholder="Hvad viste testen?">${esc(m.result)}</textarea>
        <div class="choice" role="group" aria-label="Beslutning">${Object.entries(DEC).map(([k,l])=>`<button type="button" class="${k}" aria-pressed="${m.decision===k}" data-act="decide" data-id="${m.id}" data-dec="${k}">${l}</button>`).join("")}</div>
        <label class="f">Begrundelse</label><textarea data-k="m.${m.id}.rationale" rows="2" placeholder="Hvorfor denne beslutning?">${esc(m.rationale)}</textarea>
        ${m.decision?`<p class="small muted" style="margin:8px 0 0">Besluttet af ${esc(nameOf(m.decidedBy))} ${fmtTs(m.decidedAt)}. <button class="btn ghost small" type="button" data-act="undecide" data-id="${m.id}" style="padding:2px 6px">Fortryd beslutning</button></p>`:""}
      </div>
    </section>`}).join("");
  return `<p class="lead">Hver milepæl er et billigt eksperiment, der tester en eller flere antagelser. Når den er nået, sammenligner I resultatet med antagelserne og beslutter, om projektet fortsætter, justeres eller stoppes, før der bruges flere ressourcer.</p>
    ${path}
    <div class="row-actions" style="margin:14px 0 6px"><button class="btn primary" type="button" data-act="add-ms">Tilføj milepæl</button>${ms.length?"":`<button class="btn" type="button" data-act="std-ms">Brug standardforløb</button>`}</div>
    ${ms.length?cards:`<p class="empty">Ingen milepæle endnu. Standardforløbet går fra kortlægning af arbejdsgangen over prototype og MVP til pilot.</p>`}`;
}

function tabBuild(p){
  const b=p.build||{},stack=stackOf(p);
  const txt=(k,label,rows,ph)=>`<div><label class="f" for="b-${k}">${label}</label><textarea id="b-${k}" data-k="b.${k}" rows="${rows}" placeholder="${ph}">${esc(b[k])}</textarea></div>`;
  return `<p class="lead">Beskriv hvordan værktøjet er bygget, så andre kan lære af det og genbruge dele, når de skal lave noget lignende.</p>
  <div class="two">
    <div class="panel stack">
      ${txt("summary","Hvad værktøjet gør",3,"Fx henter lagertal fra Shopify hver morgen og lægger en rapport i et delt ark")}
      <div><label class="f" for="tag-in">Tech stack</label>
        <div class="tags">${stack.map(t=>`<span class="tag">${esc(t)}<button type="button" data-act="del-tag" data-tag="${esc(t)}" aria-label="Fjern ${esc(t)}">×</button></span>`).join("")}</div>
        <div style="display:flex;gap:6px"><input type="text" id="tag-in" data-tagin="1" list="tag-list" placeholder="Fx Python, Shopify API, Claude API" autocomplete="off">
          <button class="btn" type="button" data-act="add-tag">Tilføj</button></div>
        <datalist id="tag-list">${allStackTags(projects).filter(t=>!stack.some(x=>x.toLowerCase()===t.toLowerCase())).map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
        <p class="small muted" style="margin:6px 0 0">Tryk Enter eller komma for at tilføje.</p></div>
      <label class="check"><input type="checkbox" data-k="b.live" ${b.live?"checked":""}><span>Værktøjet er i drift</span></label>
    </div>
    <div class="panel stack">
      ${txt("reusable","Dele andre kan genbruge",2,"Fx Shopify-udtræk, prompt-skabelon")}
      ${txt("links","Links",2,"Kode, dokumentation eller demo")}
      ${txt("learnings","Læring og faldgruber",3,"Hvad skal man vide, hvis man bygger noget lignende?")}
      <div><label class="f" for="b-contact">Kontaktperson</label><input type="text" id="b-contact" data-k="b.contact" value="${esc(b.contact)}" placeholder="Fx Mette, Indkøb"></div>
    </div>
  </div>`;
}

function tabEval(p){
  const fb=p.feedback||{},mine=(meId&&fb[meId])||{};
  const all=Object.entries(fb).filter(([,v])=>v&&!v.deleted);
  const avg=q=>{const vs=all.map(([,v])=>Number(v[q])).filter(v=>v>=1);return vs.length?nf1.format(vs.reduce((s,v)=>s+v,0)/vs.length):"–"};
  const form=meId?`<div class="panel"><h3>Din vurdering af metoden</h3><p class="small muted">1 betyder slet ikke, 5 betyder i høj grad. ${mode==="demo"?"Demo: dine svar gemmes ikke og indgår ikke i evalueringen.":"Dine svar gemmes med det samme og kan ses af andre med adgang til værktøjet."}</p>
    ${FQ.map(([q,t])=>`<div class="lik"><span>${t}</span><div class="opts" role="radiogroup" aria-label="${esc(t)}">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="fb-${q}" value="${v}" data-k="f.${q}" data-num="1" ${Number(mine[q])===v?"checked":""}><span>${v}</span></label>`).join("")}</div></div>`).join("")}
    <div style="margin-top:14px"><label class="f" for="fb-c">Hvad ville du ændre ved metoden eller værktøjet?</label><textarea id="fb-c" data-k="f.comment" rows="3">${esc(mine.comment)}</textarea></div>
  </div>`:`<div class="banner info">Log ind for at give din vurdering.</div>`;
  const summary=`<div class="panel"><h3>Samlet vurdering</h3><p class="small muted">${all.length} ${all.length===1?"svar":"svar"} på dette projekt.</p>
    <table class="ledger">${FQ.map(([q,t])=>`<tr><td>${t}</td><td>${avg(q)}</td></tr>`).join("")}</table>
    ${all.filter(([,v])=>v.comment).map(([id,v])=>`<blockquote style="margin:14px 0 0;padding-left:12px;border-left:3px solid var(--line);font-size:14px">${esc(v.comment)}<div class="small muted">${esc(nameOf(id))}</div></blockquote>`).join("")}
  </div>`;
  return `<p class="lead">Når projektet har været igennem en eller flere milepæle, vurderer hver deltager, hvordan metoden fungerede. Svarene bruges til at forbedre beslutningsprocessen.</p><div class="two">${form}${summary}</div>`;
}

/* ---------- interactions ---------- */
function patchFromKey(k,v){
  const s=k.split(".");
  if(s[0]==="p")return {[s[1]]:v};
  if(s[0]==="rev")return {rev:{[s[1]]:v}};
  if(s[0]==="a")return {assumptions:{[s[1]]:{[s[2]]:v}}};
  if(s[0]==="m"){if(s[2]==="tests")return {milestones:{[s[1]]:{tests:{[s[3]]:v}}}};return {milestones:{[s[1]]:{[s[2]]:v}}}}
  if(s[0]==="b")return {build:{[s[1]]:v}};
  if(s[0]==="f"&&meId)return {feedback:{[meId]:{[s[1]]:v,at:Date.now()}}};
  return null;
}
function onField(e){
  const el=e.target;const k=el.dataset&&el.dataset.k;
  if(k&&k.startsWith("filter.")){
    if(e.type==="input"&&el.tagName==="SELECT")return;
    view.filter[k.slice(7)]=el.value;render();return;
  }
  if(!k||!view.pid)return;
  let v=el.type==="checkbox"?el.checked:el.value;
  if(el.dataset.num&&el.type!=="checkbox")v=v===""?"":Number(v);
  const patch=patchFromKey(k,v);if(!patch)return;
  const structural=el.tagName==="SELECT"||el.type==="checkbox"||el.type==="radio"||el.dataset.full;
  if(e.type==="input"&&structural)return;
  if(e.type==="change"&&!structural)return;
  queuePatch(view.pid,patch,structural?0:600);
  if(el.dataset.r==="rev"){const o=$("#rev-out");if(o)o.innerHTML=revOut(rev(P()))}
  if(structural)render();
}
document.addEventListener("input",onField);
document.addEventListener("change",onField);
document.addEventListener("keydown",e=>{
  const el=e.target;if(!el.dataset||!el.dataset.tagin||!view.pid)return;
  if(e.key!=="Enter"&&e.key!==",")return;
  e.preventDefault();addTag(view.pid,el.value.replace(/,/g,""));render();const n=$("#tag-in");if(n)n.focus();
});

function nextOrder(obj){return listOf(obj).reduce((m,x)=>Math.max(m,x.order||0),0)+1}
function addAssumption(p,a){
  const id=newId();const o=nextOrder(p.assumptions);
  queuePatch(view.pid,{assumptions:{[id]:Object.assign({text:"",cat:"gevinst",impact:2,uncertainty:2,status:"ikke",expected:"",actual:"",order:o},a)}},0);
  return id;
}

document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const act=b.dataset.act,p=P();
  if(act==="mode"){if(b.dataset.mode!==mode){setMode(b.dataset.mode);window.scrollTo(0,0)}return}
  if(act==="home-tab"){view.home=b.dataset.home;setHash();render();return}
  if(act==="open-build"){flushAll();view.pid=b.dataset.id;view.tab="bygget";setHash();render();window.scrollTo(0,0);return}
  if(act==="home"){flushAll();view.pid=null;setHash();render();return}
  if(act==="open"){view.pid=b.dataset.id;view.tab="gevinst";setHash();render();window.scrollTo(0,0);return}
  if(act==="tab"){flushAll();view.tab=b.dataset.tab;setHash();render();return}
  if(act==="export-json")return exportJson();
  if(act==="export-csv")return exportCsv();
  if(!canEdit())return;
  if(act==="create"){
    const name=$("#np-name").value.trim();
    if(!name){$("#np-name").focus();toast("Giv projektet et navn.");return}
    b.disabled=true;
    const now=Date.now();
    const m0=mode;
    const id=await createProject({name,department:$("#np-dep").value.trim(),description:$("#np-desc").value.trim(),createdBy:meId||null,createdAt:now,updatedAt:now,rev:Object.assign({},REV_DEFAULT),assumptions:{},milestones:{},feedback:{}});
    b.disabled=false;
    if(id&&mode===m0){view.pid=id;view.tab="gevinst";setHash();render();window.scrollTo(0,0)}
    return;
  }
  if(!p)return;
  if(act==="del-project"){if(!confirm(mode==="demo"?`Slet "${p.name||"projektet"}" fra demoen? Det kommer tilbage, når siden genindlæses.`:`Slet "${p.name||"projektet"}" for alle? Det kan ikke fortrydes.`))return;const id=view.pid;view.pid=null;setHash();await deleteProject(id);render();toast("Projektet er slettet.");return}
  if(act==="add-ass"){const id=addAssumption(p,{});render();const t=document.querySelector(`[data-k="a.${id}.text"]`);if(t)t.focus();return}
  if(act==="add-tag"){const i=$("#tag-in");addTag(view.pid,i.value.replace(/,/g,""));render();const n=$("#tag-in");if(n)n.focus();return}
  if(act==="del-tag"){removeTag(view.pid,b.dataset.tag);render();return}
  if(act==="del-ass"){queuePatch(view.pid,{assumptions:{[b.dataset.id]:{deleted:true}}},0);render();return}
  if(act==="suggest-ass"){
    const c=calc(rev(p));
    const sug=[
      {text:`Hver bruger sparer ${nf1.format(c.perUserWeek)} timer om ugen med værktøjet`,cat:"gevinst",impact:3,uncertainty:3,expected:`${nf1.format(c.perUserWeek)} t/uge`},
      {text:`${nf.format(c.users)} medarbejdere bruger værktøjet fast i deres arbejde`,cat:"brug",impact:3,uncertainty:2,expected:`${nf.format(c.users)} brugere`},
      {text:`Værktøjet kan bygges på ${nf.format(rev(p).devHours)} timer med AI-assistance`,cat:"omk",impact:2,uncertainty:3,expected:`${nf.format(rev(p).devHours)} timer`},
      {text:`Vedligehold kræver højst ${nf.format(rev(p).maintHours)} timer om måneden`,cat:"omk",impact:2,uncertainty:3,expected:`${nf.format(rev(p).maintHours)} t/md.`},
      {text:"Værktøjet kan arbejde sammen med de systemer, afdelingen bruger i dag",cat:"teknisk",impact:2,uncertainty:2,expected:""}
    ];
    const existing=new Set(listOf(p.assumptions).map(a=>a.text));
    let n=0;sug.forEach(s=>{if(!existing.has(s.text)){addAssumption(P(),s);n++}});
    view.tab="antagelser";setHash();render();toast(n?`${n} antagelser er tilføjet.`:"Antagelserne findes allerede.");return;
  }
  if(act==="add-ms"){const id=newId();queuePatch(view.pid,{milestones:{[id]:{name:"",desc:"",date:"",budget:"",tests:{},result:"",decision:"",rationale:"",order:nextOrder(p.milestones)}}},0);render();const t=document.querySelector(`[data-k="m.${id}.name"]`);if(t)t.focus();return}
  if(act==="std-ms"){
    const std=[["Kortlæg nuværende arbejdsgang","Observér og mål, hvor meget tid opgaven tager i dag."],["Klikbar prototype testet med 2-3 brugere","Test om brugerne forstår og vil bruge løsningen."],["MVP i brug i to uger","Mål faktisk brug og sparet tid."],["Pilot i hele afdelingen","Mål tidsbesparelse og vedligeholdelsesbehov over tid."]];
    let o=nextOrder(p.milestones);const patch={milestones:{}};
    std.forEach(([n,d])=>{patch.milestones[newId()]={name:n,desc:d,date:"",budget:"",tests:{},result:"",decision:"",rationale:"",order:o++}});
    queuePatch(view.pid,patch,0);render();return;
  }
  if(act==="del-ms"){if(!confirm("Slet milepælen?"))return;queuePatch(view.pid,{milestones:{[b.dataset.id]:{deleted:true}}},0);render();return}
  if(act==="goto-ms"){const el=document.getElementById("ms-"+b.dataset.id);if(el)el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});return}
  if(act==="decide"){const d=b.dataset.dec;queuePatch(view.pid,{milestones:{[b.dataset.id]:{decision:d,decidedBy:meId||null,decidedAt:Date.now()}}},0);render();toast(`Beslutning registreret: ${DEC[d]}.`);return}
  if(act==="undecide"){queuePatch(view.pid,{milestones:{[b.dataset.id]:{decision:"",decidedBy:null,decidedAt:null}}},0);render();return}
});

/* ---------- export ---------- */
async function save(filename,text,type){
  if(!dl){toast("Download er ikke tilgængelig i denne visning.");return}
  try{await dl.save({filename,data:new Blob([text],{type})});toast("Filen er gemt.")}
  catch(e){if(e&&e.code!=="declined")toast("Filen kunne ikke gemmes.")}
}
function exportJson(){
  const out=Object.entries(projects).map(([id,p])=>({id,navn:p.name,afdeling:p.department,beskrivelse:p.description,status:status(p)[0],oprettet:p.createdAt?new Date(p.createdAt).toISOString():null,
    gevinstregnskab:Object.assign({},rev(p),{beregnet:calc(rev(p))}),
    antagelser:listOf(p.assumptions).map((a,i)=>({nr:"A"+(i+1),tekst:a.text,kategori:CATS[a.cat]||a.cat,betydning:LVL[a.impact||2],usikkerhed:LVL[a.uncertainty||2],forventet:a.expected,faktisk:a.actual,status:STATUS[a.status||"ikke"]})),
    milepaele:msSorted(p).map((m,i)=>({nr:i+1,navn:m.name,dato:m.date,budget_timer:m.budget,beskrivelse:m.desc,tester:listOf(p.assumptions).filter(a=>m.tests&&m.tests[a.id]).map(a=>aNum(p)[a.id]),resultat:m.result,beslutning:DEC[m.decision]||null,begrundelse:m.rationale,besluttet_af:m.decidedBy?nameOf(m.decidedBy):null,besluttet:m.decidedAt?new Date(m.decidedAt).toISOString():null})),
    bygget:{beskrivelse:(p.build||{}).summary||"",tech_stack:stackOf(p),genbrug:(p.build||{}).reusable||"",links:(p.build||{}).links||"",laering:(p.build||{}).learnings||"",kontakt:(p.build||{}).contact||"",i_drift:!!(p.build||{}).live},
    evaluering:Object.entries(p.feedback||{}).map(([uid,v])=>({deltager:nameOf(uid),q1:v.q1,q2:v.q2,q3:v.q3,q4:v.q4,kommentar:v.comment}))
  }));
  save("ddp-projekter.json",JSON.stringify({eksporteret:new Date().toISOString(),spoergsmaal:Object.fromEntries(FQ),projekter:out},null,2),"application/json");
}
function exportCsv(){
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=[["Projekt","Afdeling","Milepæl","Planlagt dato","Testede antagelser","Resultat","Beslutning","Begrundelse","Besluttet af","Besluttet"]];
  for(const p of Object.values(projects)){const num=aNum(p);
    msSorted(p).forEach(m=>rows.push([p.name,p.department,m.name,m.date,listOf(p.assumptions).filter(a=>m.tests&&m.tests[a.id]).map(a=>num[a.id]+" "+a.text).join("; "),m.result,DEC[m.decision]||"Afventer",m.rationale,m.decidedBy?nameOf(m.decidedBy):"",m.decidedAt?new Date(m.decidedAt).toLocaleDateString("da-DK"):""]))}
  save("ddp-beslutningslog.csv","\ufeff"+rows.map(r=>r.map(q).join(";")).join("\r\n"),"text/csv");
}

/* ---------- misc ---------- */
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2600)}
/* hash: [demo-]p-<id>-<fane>; demo-visningen har præfikset "demo" */
function setHash(){
  const body=view.pid?`p-${view.pid}-${view.tab}`:view.home==="katalog"?"katalog":"";
  const h=[mode==="demo"?"demo":"",body].filter(Boolean).join("-");
  if(location.hash.slice(1)!==h)history.replaceState(null,"",h?"#"+h:location.pathname+location.search);
}
function readHashFrom(hash){
  let s=String(hash||"").replace(/^#/,""),m="live";
  if(/^demo(-|$)/.test(s)){m="demo";s=s.replace(/^demo-?/,"")}
  if(m!==mode){flushAll();applyMode(m)}
  const r=/^p-([a-z0-9-]+?)(?:-(gevinst|antagelser|milepaele|bygget|evaluering))?$/.exec(s);
  if(r){view.pid=r[1];view.tab=r[2]||"gevinst"}
  else{view.pid=null;view.home=s==="katalog"?"katalog":"projekter"}
}
const readHash=()=>readHashFrom(location.hash);
window.addEventListener("hashchange",()=>{readHash();render()});
readHash();

/* ---------- test hooks ---------- */
window.DDP={
  state:()=>({mode,projects,liveProjects,demoProjects,view,canWrite}),
  render,status,calc,allStackTags,addTag,removeTag,catalogItems,setMode,queuePatch,flushAll,readHashFrom,
  setCanWrite:b=>{canWrite=b;render()}
};

/* ---------- boot ---------- */
(async function boot(){
  const c=window.claude;
  if(!c||typeof c.use!=="function"){localMode=true;loaded=true;if(mode==="live")applyMode("demo");setHash();render();return}
  c.use("downloads").then(x=>{dl=x}).catch(()=>{});
  c.use("user").then(async u=>{
    userCap=u;if(!u)return;
    try{meId=await u.id()}catch(e){}
    try{const w=await u.can("data.write");if(w===false){canWrite=false;render()}}catch(e){}
    try{const me=await u.me();if(me&&me.name)$("#who").textContent=me.name}catch(e){}
    resolveNames();
  }).catch(()=>{});
  db=await c.use("db").catch(()=>null);
  if(!db){localMode=true;loaded=true;if(mode==="live")applyMode("demo");setHash();render();return}
  const timer=setTimeout(()=>{if(!loaded){staleNote="Projekterne kan ikke hentes endnu. Tjek forbindelsen; siden prøver fortsat.";render()}},10000);
  db.collection("projects").onSnapshot(snap=>{
    const next={};
    snap.docs.forEach(d=>{const data=clone(d.data());if(pend[d.id])deepMerge(data,clone(pend[d.id]));next[d.id]=data});
    liveProjects=next;if(mode==="live")projects=next;
    if(!snap.metadata.fromCache){loaded=true;clearTimeout(timer);staleNote=""}
    else if(!loaded&&snap.size){loaded=true}
    render();resolveNames();
  },err=>{clearTimeout(timer);loaded=true;loadErr=err&&err.code==="revoked"?"":"Projekterne kunne ikke hentes. Genindlæs siden senere.";render()});
})();
})();

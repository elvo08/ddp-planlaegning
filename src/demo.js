/* Demodata: opdigtede projekter, der viser værktøjet efter et stykke tid i brug.
   Indlæses før app.js og bruges kun i demo-visningen. Personer og tal er opdigtede. */
window.DDP_DEMO=(function(){
  const ts=d=>new Date(d+"T10:00:00").getTime();
  const people={
    "demo-mette":"Mette, Indkøb",
    "demo-jonas":"Jonas, Kundeservice",
    "demo-sara":"Sara, Marketing",
    "demo-anders":"Anders, Økonomi",
    "demo-kasper":"Kasper, Lager",
    "demo-line":"Line, HR",
    "demo-sofie":"Sofie, IT"
  };
  /* antagelse: id, tekst, kategori, betydning, usikkerhed, status, forventet, faktisk */
  const A=(rows)=>Object.fromEntries(rows.map(([id,text,cat,impact,uncertainty,status,expected,actual],i)=>
    [id,{text,cat,impact,uncertainty,status,expected,actual:actual||"",order:i+1}]));
  /* milepæl: id, navn, beskrivelse, dato, budget, testede antagelser, resultat, beslutning, begrundelse, af, dato for beslutning */
  const M=(rows)=>Object.fromEntries(rows.map(([id,name,desc,date,budget,tests,result,decision,rationale,by,at],i)=>
    [id,{name,desc,date,budget,tests:Object.fromEntries((tests||[]).map(t=>[t,true])),result:result||"",
      decision:decision||"",rationale:rationale||"",decidedBy:decision?by:null,decidedAt:decision?ts(at):null,order:i+1}]));
  const F=(q1,q2,q3,q4,comment,at)=>({q1,q2,q3,q4,comment,at:ts(at)});

  const projects={
    "demo-lager":{
      name:"Automatisk lagerrapport",department:"Indkøb",
      description:"Indkøb bruger hver mandag to-tre timer på at trække lagertal ud af Shopify og samle dem i et regneark, før der kan bestilles hjem.",
      createdBy:"demo-mette",createdAt:ts("2026-03-04"),updatedAt:ts("2026-10-22"),
      rev:{targetNet:50000,marginPct:50,rate:400,users:3,weeks:46,devHours:30,oneTime:0,maintHours:2,runMonthly:0},
      assumptions:A([
        ["a1","Hver indkøber sparer 1,8 timer om ugen med værktøjet","gevinst",3,3,"holder","1,8 t/uge","2,1 t/uge"],
        ["a2","3 indkøbere bruger rapporten hver uge","brug",3,2,"holder","3 brugere","3 brugere"],
        ["a3","Værktøjet kan bygges på 30 timer med AI-assistance","omk",2,3,"delvist","30 timer","38 timer"],
        ["a4","Shopify-API'et giver de lagertal, vi skal bruge","teknisk",3,2,"holder","Alle varenumre","Alle varenumre"],
        ["a5","Vedligehold kræver højst 2 timer om måneden","omk",2,2,"holder","2 t/md.","1 t/md."]
      ]),
      milestones:M([
        ["m1","Kortlæg nuværende arbejdsgang","Mål tidsforbruget tre mandage i træk.","2026-03-20",4,["a1"],
          "Opgaven tog i snit 2,4 timer pr. person pr. uge.","fortsaet","Tidsforbruget er større end antaget, så gevinsten ser realistisk ud.","demo-mette","2026-03-21"],
        ["m2","Prototype med udtræk fra Shopify","Hent lagertal for alle varer og læg dem i et ark.","2026-04-17",12,["a3","a4"],
          "Alle data kunne hentes, men API'et begrænser antal kald, så hentningen skulle deles op. Det kostede ekstra tid.","fortsaet","Den tekniske usikkerhed er væk. Overskridelsen af timer er lille i forhold til gevinsten.","demo-sofie","2026-04-20"],
        ["m3","Pilot i hele indkøbsteamet","Rapporten bruges i fire uger, og tidsforbruget måles igen.","2026-06-12",8,["a1","a2","a5"],
          "Alle tre indkøbere bruger rapporten. Den målte besparelse er 2,1 timer om ugen pr. person.","fortsaet","Antagelserne holder. Værktøjet sættes i drift.","demo-mette","2026-06-15"]
      ]),
      feedback:{
        "demo-mette":F(5,4,4,4,"Det hjalp at regne baglæns. Vi kunne se, at to timer om ugen var nok til at gøre det umagen værd.","2026-06-20"),
        "demo-sofie":F(4,5,3,4,"Milepælene gjorde det nemt at stoppe op og tjekke API'et, før vi byggede videre.","2026-06-22")
      },
      build:{
        summary:"Henter lagertal fra Shopify hver mandag kl. 6 og lægger en færdig genbestillingsrapport i et delt Google-ark.",
        stack:["Python","Shopify API","Google Sheets","Claude Code"],
        reusable:"Shopify-udtræk (modul der henter varer og lager i bidder), opsætning af planlagt kørsel",
        links:"Kode: intern Git under indkob/lagerrapport\nVejledning: Indkøbs fælles drev",
        learnings:"Shopify begrænser antal kald pr. sekund. Hent i bidder på 250 varer og vent mellem kaldene. Byg rapporten sammen med brugerne, de ville have andre kolonner end vi troede.",
        contact:"Mette, Indkøb (bruger) og Sofie, IT (kode)",
        live:true
      }
    },

    "demo-retur":{
      name:"Hjælp til returhenvendelser",department:"Kundeservice",
      description:"Kundeservice får mange ens spørgsmål om returnering. Et AI-udkast til svaret skal gøre det hurtigere at besvare dem.",
      createdBy:"demo-jonas",createdAt:ts("2026-04-08"),updatedAt:ts("2026-10-14"),
      rev:{targetNet:120000,marginPct:50,rate:350,users:8,weeks:46,devHours:60,oneTime:5000,maintHours:6,runMonthly:600},
      assumptions:A([
        ["a1","Hver medarbejder sparer 1,9 timer om ugen","gevinst",3,3,"delvist","1,9 t/uge","0,9 t/uge"],
        ["a2","8 medarbejdere bruger udkastene fast","brug",3,2,"delvist","8 brugere","5 brugere"],
        ["a3","Mindst 70 % af udkastene kan sendes med små rettelser","gevinst",3,3,"holder_ikke","70 %","45 %"],
        ["a4","Udkast kan laves direkte i Zendesk","teknisk",2,2,"holder","Virker i Zendesk","Virker via makro"],
        ["a5","API-forbruget holder sig under 600 kr. om måneden","omk",1,2,"holder","600 kr./md.","310 kr./md."]
      ]),
      milestones:M([
        ["m1","Kortlæg returhenvendelser","Gennemgå 200 henvendelser og del dem op i typer.","2026-04-24",6,["a1"],
          "60 % af henvendelserne handler om returnering, men de er mere forskellige end antaget.","fortsaet","Der er nok ens henvendelser til at teste udkast.","demo-jonas","2026-04-27"],
        ["m2","Prototype i Zendesk","Udkast laves med en makro og testes af to medarbejdere i to uger.","2026-06-05",20,["a3","a4","a5"],
          "Kun 45 % af udkastene kunne bruges med små rettelser. Udkast til ombytning var ofte forkerte.","juster","Vi begrænser værktøjet til rene returneringer og dropper ombytning. Gevinsten bliver mindre, men stadig over rammen.","demo-jonas","2026-06-10"],
        ["m3","Ny test kun med returneringer","Samme test som før, men kun på rene returneringer.","2026-11-20",10,["a1","a2","a3"],
          "","","","",""]
      ]),
      feedback:{
        "demo-jonas":F(4,5,3,3,"Beslutningspunktet gjorde det tydeligt, at vi skulle justere i stedet for at bygge videre på noget, der ikke virkede.","2026-06-15")
      },
      build:{
        summary:"Laver et udkast til svar på returhenvendelser direkte i Zendesk ud fra kundens ordre og returpolitikken.",
        stack:["Claude API","Zendesk","JavaScript"],
        reusable:"Zendesk-makro der sender en sag til Claude og indsætter svaret som kladde",
        links:"",
        learnings:"Giv modellen returpolitikken med i hvert kald. Udkast til ombytning kræver ordredata, som vi ikke har adgang til endnu.",
        contact:"Jonas, Kundeservice",
        live:false
      }
    },

    "demo-tekster":{
      name:"Produkttekster med AI",department:"Marketing",
      description:"Nye produkter ligger ofte i flere uger uden en ordentlig tekst, fordi Marketing ikke når at skrive dem.",
      createdBy:"demo-sara",createdAt:ts("2026-08-18"),updatedAt:ts("2026-10-28"),
      rev:{targetNet:80000,marginPct:50,rate:380,users:4,weeks:46,devHours:40,oneTime:0,maintHours:3,runMonthly:400},
      assumptions:A([
        ["a1","Hver tekstforfatter sparer 2,3 timer om ugen","gevinst",3,3,"delvist","2,3 t/uge","1,5 t/uge indtil videre"],
        ["a2","AI-teksterne passer til vores tone efter en kort rettelse","gevinst",3,3,"holder","Under 5 min. pr. tekst","Ca. 4 min. pr. tekst"],
        ["a3","4 medarbejdere bruger værktøjet fast","brug",2,2,"ikke","4 brugere",""],
        ["a4","Produktdata i Shopify er gode nok som grundlag","teknisk",2,3,"holder_ikke","Alle felter udfyldt","Mangler materiale og mål på 30 %"],
        ["a5","Værktøjet kan bygges på 40 timer","omk",2,2,"ikke","40 timer",""]
      ]),
      milestones:M([
        ["m1","Test af tone på 20 produkter","Lav tekster til 20 produkter og lad to tekstforfattere rette dem.","2026-09-26",8,["a2","a4"],
          "Tonen rammer godt, men manglende produktdata giver forkerte detaljer i nogle tekster.","","","",""],
        ["m2","Prototype med Shopify-data","Hent produktdata automatisk og lav tekst med et klik.","2026-11-13",20,["a1","a5"],"","","","",""],
        ["m3","Pilot i hele Marketing","Brug værktøjet på alle nye produkter i en måned.","2026-12-15",10,["a1","a3"],"","","","",""]
      ]),
      feedback:{},
      build:{
        summary:"Skriver et første udkast til produkttekster ud fra data i Shopify og en fast skabelon for tone.",
        stack:["Claude API","Shopify API","Python"],
        reusable:"Prompt-skabelon med Sinful-tone og eksempler",
        links:"",
        learnings:"Kvaliteten afhænger mere af produktdata end af prompten. Ret data i Shopify først.",
        contact:"Sara, Marketing",
        live:false
      }
    },

    "demo-bilag":{
      name:"Bilagsmatching",department:"Økonomi",
      description:"Økonomi matcher hver måned bilag med banktransaktioner i hånden. Et værktøj skulle foreslå matches automatisk.",
      createdBy:"demo-anders",createdAt:ts("2026-03-16"),updatedAt:ts("2026-07-03"),
      rev:{targetNet:90000,marginPct:50,rate:420,users:2,weeks:46,devHours:80,oneTime:10000,maintHours:8,runMonthly:900},
      assumptions:A([
        ["a1","Hver bogholder sparer 4,7 timer om ugen","gevinst",3,3,"holder_ikke","4,7 t/uge","1,2 t/uge"],
        ["a2","80 % af bilagene kan matches automatisk","gevinst",3,3,"holder_ikke","80 %","35 %"],
        ["a3","Data kan hentes fra økonomisystemet","teknisk",3,2,"delvist","Via API","Kun via eksport"],
        ["a4","Værktøjet kan bygges på 80 timer","omk",2,3,"ikke","80 timer",""]
      ]),
      milestones:M([
        ["m1","Kortlæg nuværende afstemning","Mål tiden på månedsafslutningen og gennemgå hvilke bilag der er svære.","2026-04-03",6,["a1"],
          "Afstemningen tager mindre tid end antaget, ca. 1,2 timer om ugen pr. person. Det svære er undtagelserne.","fortsaet","Vi tester alligevel matching, fordi undtagelserne måske kan løses.","demo-anders","2026-04-06"],
        ["m2","Test af automatisk matching","Kør matching på tre måneders bilag og mål træfsikkerheden.","2026-06-26",16,["a2","a3"],
          "Kun 35 % blev matchet sikkert. Data kan kun hentes via manuel eksport.","stop","Gevinsten kan ikke nå op på det krævede, og det tekniske grundlag mangler. Vi stopper, før der bruges flere timer.","demo-anders","2026-07-02"]
      ]),
      feedback:{
        "demo-anders":F(5,5,4,4,"Godt at kunne stoppe efter 22 timer i stedet for at opdage det efter 80.","2026-07-03"),
        "demo-sofie":F(4,4,4,3,"","2026-07-04")
      },
      build:{
        summary:"Prototype der foreslog match mellem bilag og banktransaktioner ud fra beløb, dato og tekst. Stoppet efter test.",
        stack:["Python","Excel","Claude API"],
        reusable:"Script til at læse og rense bankudtræk fra CSV",
        links:"",
        learnings:"Mål tidsforbruget før I bygger. Gevinsten var meget mindre end antaget, og økonomisystemet har intet åbent API. Undtagelserne er det svære, ikke de almindelige bilag.",
        contact:"Anders, Økonomi",
        live:false
      }
    },

    "demo-pluk":{
      name:"Pluklister til lageret",department:"Lager",
      description:"Lageret printer pluklister i ordrens rækkefølge, så medarbejderne går de samme gange flere gange. Listerne skal sorteres efter placering.",
      createdBy:"demo-kasper",createdAt:ts("2026-05-05"),updatedAt:ts("2026-10-08"),
      rev:{targetNet:70000,marginPct:50,rate:300,users:6,weeks:46,devHours:25,oneTime:0,maintHours:2,runMonthly:0},
      assumptions:A([
        ["a1","Hver plukker sparer 1,7 timer om ugen","gevinst",3,3,"holder","1,7 t/uge","1,9 t/uge"],
        ["a2","6 plukkere bruger de nye lister","brug",2,1,"holder","6 brugere","6 brugere"],
        ["a3","Lagerplaceringer i Shopify er opdaterede","teknisk",3,3,"delvist","Alle varer","92 % af varerne"],
        ["a4","Værktøjet kan bygges på 25 timer","omk",1,2,"holder","25 timer","22 timer"]
      ]),
      milestones:M([
        ["m1","Test sorteret liste en dag","Print sorterede lister for én vagt og mål gåtid.","2026-05-22",6,["a1","a3"],
          "Plukketiden faldt med ca. 20 %. 8 % af varerne manglede placering.","fortsaet","Gevinsten er tydelig. Manglende placeringer rettes løbende.","demo-kasper","2026-05-25"],
        ["m2","Brug i hele lageret i tre uger","Alle plukkere bruger de nye lister.","2026-07-10",10,["a1","a2","a4"],
          "Alle bruger listerne. Besparelsen holder over tid.","fortsaet","Sættes i drift.","demo-kasper","2026-07-13"]
      ]),
      feedback:{
        "demo-kasper":F(4,4,5,5,"Simpelt projekt, men godt at have tallene til at vise ledelsen.","2026-07-15")
      },
      build:{
        summary:"Henter dagens ordrer fra Shopify og printer pluklister sorteret efter lagerplacering.",
        stack:["Python","Shopify API","PDF"],
        reusable:"Shopify-udtræk fra lagerrapporten blev genbrugt direkte",
        links:"Kode: intern Git under lager/pluklister",
        learnings:"Genbrug af Shopify-udtrækket sparede ca. 8 timer. Sørg for at alle varer har en placering, ellers havner de nederst på listen.",
        contact:"Kasper, Lager",
        live:true
      }
    },

    "demo-vagt":{
      name:"Vagtplan-påmindelser",department:"HR",
      description:"Medarbejdere glemmer bytte af vagter, og HR bruger tid på at ringe rundt. Automatiske påmindelser på SMS skal hjælpe.",
      createdBy:"demo-line",createdAt:ts("2026-10-20"),updatedAt:ts("2026-10-27"),
      rev:{targetNet:40000,marginPct:50,rate:350,users:2,weeks:46,devHours:20,oneTime:0,maintHours:2,runMonthly:250},
      assumptions:{},milestones:{},feedback:{}
    }
  };
  /* note: id, tekst, af, dato. Viser hvordan kontekst skrives ned, hvor den hører til */
  const N=(rows)=>Object.fromEntries(rows.map(([id,text,by,at],i)=>[id,{text,by,at:ts(at),order:i+1}]));
  projects["demo-retur"].notes=N([
    ["n1","Kundeservice har spidsbelastning i januar, så en pilot i hele teamet kan tidligst starte i februar.","demo-jonas","2026-10-14"]
  ]);
  projects["demo-retur"].assumptions.a1.notes=N([
    ["n1","Målt på to medarbejdere i uge 24-25. Tallet er lavere end forventet, fordi ombytninger stadig skrives manuelt.","demo-jonas","2026-06-10"]
  ]);
  projects["demo-retur"].milestones.m3.notes=N([
    ["n1","Testen er udskudt en uge, fordi Zendesk-makroen skulle opdateres først.","demo-sofie","2026-11-02"],
    ["n2","Husk at måle på alle tre, ikke kun de to fra sidst.","demo-jonas","2026-11-03"]
  ]);
  projects["demo-lager"].notes=N([
    ["n1","Rapporten kører nu også for lageret i Aarhus. Ingen ekstra vedligehold indtil videre.","demo-mette","2026-10-22"]
  ]);
  return {projects,people};
})();

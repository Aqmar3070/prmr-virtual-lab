import {DEFAULT_PARAMS,PARAMS,evaluate,scenarioEnvelope} from "./model.mjs";
import {EXAMPLES,SYSTEMS,enumerateStructures,similarity,loadRDKit,analyzeSmiles} from "./chemistry.mjs";
import {findPubChem,searchChEMBLTargets} from "./connectors.mjs";
import {initCloud} from "./cloud.mjs";

const $=id=>document.getElementById(id);
const format=(n,d=2)=>(n!==null&&n!==undefined&&n!==""&&Number.isFinite(Number(n)))?Number(n).toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d}):"n.d.";
const library=EXAMPLES.map((m,i)=>({...m,id:"example-"+i}));
const state={kit:null,rdkit:"loading",pk:{...DEFAULT_PARAMS},latestMolecule:null,latestExternal:null};
const newEl=(tag,className,text)=>{const x=document.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;};
const clear=id=>$(id).replaceChildren();
const feedback=(id,msg,type="")=>{const x=$(id);x.textContent=msg;x.className="feedback"+(type?" "+type:"");};
const headings={overview:"Parcours de recherche",molecules:"Atelier moléculaire",library:"Bibliothèque",combinations:"Comparaison",pkpd:"Simulation PK/PD",systems:"Atlas physiologique",data:"Connecteurs",cloud:"Espace privé",quality:"Traçabilité"};

function navigate(id){
 if(!headings[id])return;
 for(const name of Object.keys(headings))$("view-"+name).hidden=name!==id;
 document.querySelectorAll(".navitem").forEach(b=>b.classList.toggle("selected",b.dataset.view===id));
 $("current-crumb").textContent=headings[id];
 $("sidebar").classList.remove("open");
 window.scrollTo({top:0,behavior:"auto"});
 if(id==="library")renderLibrary();
 if(id==="combinations")renderSelectors();
 if(id==="pkpd")renderPK();
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.jump)));
$("menu-toggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));

function setRdkitStatus(status,detail=""){
 state.rdkit=status;
 const good=status==="ready",bad=status==="failed";
 const text=good?"RDKit · opérationnel":bad?"RDKit · indisponible":"RDKit · chargement";
 $("rdkit-status").textContent=text;
 $("rdkit-status").className="engine-pill"+(good?" ready":bad?" failed":"");
 $("kpi-rdkit").textContent=good?"En service":bad?"Indisponible":"Initialisation";
 $("engine-rdkit").textContent=good?"Disponible dans le navigateur":bad?"Non chargé":"Chargement…";
 $("connector-rdkit").textContent=good?"Moteur local prêt":bad?"Indisponible":"En cours";
 if(bad)feedback("mol-feedback",detail||"RDKit non disponible; vérifiez la connexion réseau.","bad");
 if(good)feedback("mol-feedback","Moteur RDKit prêt. Les analyses sont exécutées dans votre navigateur.","good");
}

function syncLibraryCounters(){
 $("kpi-library").textContent=String(library.length);
 $("library-count").textContent=library.length+" structure"+(library.length>1?"s":"");
}
function populateExamples(){
 clear("example-chips");
 for(const example of EXAMPLES){
  const btn=newEl("button","chip",example.name);btn.type="button";
  btn.addEventListener("click",()=>{ $("mol-name").value=example.name;$("mol-smiles").value=example.smiles;feedback("mol-feedback","Exemple sélectionné. Lancer l'analyse RDKit."); });
  $("example-chips").append(btn);
 }
}
function descriptor(label,value,unit=""){
 const c=newEl("div","descriptor");c.append(newEl("label","",label),newEl("strong","",value),newEl("small","",unit));return c;
}
function fillMoleculeAnalysis(name,analysis){
 state.latestMolecule={name,smiles:analysis.smiles,source:"analyse RDKit.js"};
 const canvas=$("molecule-canvas");
 // Seul RDKit produit ce SVG moléculaire; la saisie utilisateur n'est jamais injectée en HTML.
 canvas.innerHTML=analysis.svg;
 $("mol-canonical").textContent=analysis.smiles;
 $("mol-provenance").textContent="Calcul RDKit local";
 const d=analysis.descriptors;
 $("mol-descriptors").replaceChildren(
  descriptor("Masse moléculaire",format(d.mass,2),"g/mol"),
  descriptor("logP (Crippen)",format(d.logp,2),"calcul RDKit"),
  descriptor("Surface polaire TPSA",format(d.tpsa,1),"Å²"),
  descriptor("Accepteurs H",d.hba===null?"n.d.":String(d.hba),"descripteur"),
  descriptor("Donneurs H",d.hbd===null?"n.d.":String(d.hbd),"descripteur"),
  descriptor("Atomes",String(analysis.numAtoms),"RDKit"),
  descriptor("Liaisons",String(analysis.numBonds),"RDKit")
 );
 feedback("mol-feedback","Structure interprétée par RDKit; propriétés calculées, sans prédiction biologique.","good");
}
function analyzeCurrent(){
 if(!state.kit){feedback("mol-feedback","RDKit n'est pas disponible. Aucun descripteur n'est inventé.","bad");return null}
 try {
  const name=$("mol-name").value.trim()||"Structure sans nom";
  const result=analyzeSmiles(state.kit,$("mol-smiles").value);
  fillMoleculeAnalysis(name,result);return result;
 } catch(e){
  state.latestMolecule=null;
  feedback("mol-feedback",e.message,"bad");
  $("mol-canonical").textContent="Structure non validée";
  clear("mol-descriptors");$("molecule-canvas").replaceChildren(newEl("div","placeholder","Structure non validée par RDKit."));
  return null;
 }
}
$("analyze-mol").addEventListener("click",analyzeCurrent);
$("save-mol").addEventListener("click",()=>{
 const r=analyzeCurrent();if(!r)return;
 const name=$("mol-name").value.trim()||"Candidat sans nom";
 const item={id:"custom-"+Date.now()+"-"+Math.floor(Math.random()*1000),name,smiles:r.smiles,source:"saisie utilisateur · validation structurale RDKit"};
 library.push(item);syncLibraryCounters();feedback("mol-feedback","Structure ajoutée à la bibliothèque de session. Validité thérapeutique non évaluée.","good");
});
$("generate").addEventListener("click",()=>{
 if(!state.kit){feedback("mol-feedback","Génération impossible sans RDKit : attendre son chargement.","bad");return}
 clear("generated-list");let count=0;
 for(const item of enumerateStructures(16)){
  try{
   const a=analyzeSmiles(state.kit,item.smiles);
   if(!a)continue;
   const card=newEl("div","candidate");const label=newEl("div");
   label.append(newEl("b","",item.name),newEl("code","",item.smiles));
   const choose=newEl("button","", "Étudier");
   choose.addEventListener("click",()=>{$("mol-name").value=item.name;$("mol-smiles").value=item.smiles;analyzeCurrent();window.scrollTo({top:0,behavior:"smooth"})});
   card.append(label,choose);$("generated-list").append(card);count++;
  }catch(e){ /* structures invalides exclues après contrôle RDKit */ }
 }
 feedback("mol-feedback",count+" variantes interprétées par RDKit. Il ne s'agit pas de nouvelles molécules démontrées.","good");
});
function renderLibrary(){
 syncLibraryCounters();clear("library-list");
 for(const m of library){
  const card=newEl("div","library-card");card.append(newEl("h3","",m.name),newEl("code","",m.smiles),newEl("p","",m.source));
  const btn=newEl("button","btn secondary","Ouvrir dans l'atelier");
  btn.addEventListener("click",()=>{$("mol-name").value=m.name;$("mol-smiles").value=m.smiles;navigate("molecules");analyzeCurrent()});
  card.append(btn);$("library-list").append(card);
 }
}
function saveJSON(filename,obj){
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
$("export-library").addEventListener("click",()=>saveJSON("prmr-library-2.0.json",{version:"2.0",dataNature:"structures de travail, pas des candidats thérapeutiques validés",library}));
$("export-session").addEventListener("click",()=>saveJSON("prmr-research-session.json",{version:"2.0",exportedAt:new Date().toISOString(),scientificStatus:"exploratoire non clinique",rdkit:state.rdkit,library,pkpd:{hypotheticalParameters:state.pk,predictions:safePK()},publicData:state.latestExternal,limitations:["Aucune prédiction d'efficacité, d'interaction ou de sécurité","Paramètres PKPD non calibrés","Atlas organes non simulé"]}));
function safePK(){try{return evaluate(state.pk)}catch(e){return {error:e.message}}}

function renderSelectors(){
 for(const id of ["comb-a","comb-b"]){
  const sel=$(id),prev=sel.value;sel.replaceChildren();
  for(const item of library){const opt=newEl("option","",item.name);opt.value=item.id;sel.append(opt)}
  if(library.some(m=>m.id===prev))sel.value=prev;
 }
 if(!$("comb-b").value || $("comb-a").value===$("comb-b").value){const second=library[1];if(second)$("comb-b").value=second.id}
}
$("compare").addEventListener("click",()=>{
 if(!state.kit){feedback("combo-feedback","RDKit indisponible. La comparaison structurale ne peut pas être calculée.","bad");return}
 const a=library.find(x=>x.id===$("comb-a").value),b=library.find(x=>x.id===$("comb-b").value);
 if(!a||!b){feedback("combo-feedback","Sélectionner deux structures.","bad");return}
 try{
  const ra=analyzeSmiles(state.kit,a.smiles),rb=analyzeSmiles(state.kit,b.smiles);
  const sim=similarity(ra.fingerprint,rb.fingerprint);
  $("combo-similarity").textContent=sim===null?"Non disponible":format(100*sim,1)+" %";
  clear("combo-properties");
  const line=(label,x,y)=>{
   const row=newEl("div","engine-line");row.append(newEl("span","",label),newEl("b","",x+" / "+y));$("combo-properties").append(row);
  };
  line("Structures",a.name,b.name);
  line("Masses (g/mol)",format(ra.descriptors.mass,1),format(rb.descriptors.mass,1));
  line("logP",format(ra.descriptors.logp),format(rb.descriptors.logp));
  line("TPSA (Å²)",format(ra.descriptors.tpsa,1),format(rb.descriptors.tpsa,1));
  feedback("combo-feedback","Comparaison structurale calculée. Aucune interaction pharmacologique n'est déduite.","good");
 }catch(e){feedback("combo-feedback",e.message,"bad");$("combo-similarity").textContent="—"}
});

function renderSystems(){
 clear("systems-list");
 SYSTEMS.forEach((sys,i)=>{
  const card=newEl("div","atlas-card");card.append(newEl("div","atlas-code","DOMAINE / "+String(i+1).padStart(2,"0")),newEl("h3","",sys.name),newEl("p","",sys.area),newEl("small","",sys.status));$("systems-list").append(card);
 });
}
$("target-search").addEventListener("click",async()=>{
 feedback("target-feedback","Interrogation ChEMBL en cours…");$("connector-chembl").textContent="Interrogation…";clear("target-results");
 try{
  const results=await searchChEMBLTargets($("target-query").value);
  if(!results.length){feedback("target-feedback","Aucune cible renvoyée par ChEMBL.");$("connector-chembl").textContent="Aucun résultat";return}
  for(const t of results){
   const card=newEl("div","target-card");
   const link=newEl("a","",t.id+" · Consulter ChEMBL");link.href=t.url;link.target="_blank";link.rel="noopener noreferrer";
   card.append(newEl("strong","",t.name),newEl("small","",t.organism+" · "+t.type),link);$("target-results").append(card);
  }
  feedback("target-feedback",results.length+" cibles issues de ChEMBL. Leur pertinence pharmacologique n'est pas validée ici.","good");
  $("connector-chembl").textContent="Dernière requête réussie";
 }catch(e){feedback("target-feedback","ChEMBL indisponible : "+e.message,"bad");$("connector-chembl").textContent="Échec de connexion"}
});
$("pubchem-search").addEventListener("click",async()=>{
 feedback("pubchem-feedback","Consultation PubChem en cours…");$("connector-pubchem").textContent="Interrogation…";clear("pubchem-result");
 try{
  const data=await findPubChem($("pubchem-query").value);state.latestExternal=data;
  const result=$("pubchem-result");const table=newEl("div","result-table");
  for(const [label,value] of [["PubChem CID",data.cid],["Formule",data.formula],["Masse",data.mass+" g/mol"],["logP",data.logp??"n.d."],["TPSA",data.tpsa??"n.d."],["InChIKey",data.inchikey]]){
   const cell=newEl("div","result-cell");cell.append(newEl("small","",label),newEl("strong","",String(value??"n.d.")));table.append(cell);
  }
  const source=newEl("a","","Ouvrir l'enregistrement officiel PubChem");source.href=data.url;source.target="_blank";source.rel="noopener noreferrer";
  result.append(table,source,newEl("div","structure-caption",data.smiles||"SMILES non communiqué"));
  if(data.smiles){
   const add=newEl("button","btn secondary","Importer dans la bibliothèque");add.style.marginTop="15px";
   add.addEventListener("click",()=>{library.push({id:"pubchem-"+data.cid+"-"+Date.now(),name:data.name,smiles:data.smiles,source:"PubChem CID "+data.cid});syncLibraryCounters();feedback("pubchem-feedback","Structure PubChem ajoutée à la session.","good")});
   result.append(add);
  }
  feedback("pubchem-feedback","Réponse PubChem obtenue; propriétés de la base externe, non résultats de PRMR.","good");
  $("connector-pubchem").textContent="Dernière requête réussie";
 }catch(e){feedback("pubchem-feedback","PubChem indisponible : "+e.message,"bad");$("connector-pubchem").textContent="Échec de connexion"}
});

// PK/PD analytique: le résultat ne dépend PAS des structures sélectionnées.
function initializePKControls(){
 clear("pk-controls");
 for(const [key,spec] of Object.entries(PARAMS)){
  const div=newEl("div","pk-control"),head=newEl("div","pk-control-head");
  const label=newEl("label","",spec.label),out=newEl("output");
  const slider=document.createElement("input");slider.type="range";slider.id="pk-"+key;slider.min=spec.min;slider.max=spec.max;slider.step=spec.step;slider.value=state.pk[key];label.htmlFor=slider.id;
  const display=()=>out.textContent=format(state.pk[key],key==="V"||key==="dose"?0:2)+(spec.unit==="fraction"||spec.unit==="sans unité"?"":" "+spec.unit);
  display();slider.addEventListener("input",()=>{state.pk[key]=Number(slider.value);display();renderPK()});
  head.append(label,out);div.append(head,slider);$("pk-controls").append(div);
 }
}
function metric(label,value,unit){
 const div=newEl("div","metric-card");div.append(newEl("label","",label),newEl("strong","",value),newEl("small","",unit));return div;
}
function plotProfile(profile,horizon){
 const W=770,H=275,L=53,R=20,T=17,B=35,high=Math.max(0.01,...profile.map(x=>x.c))*1.13;
 const x=t=>L+t/horizon*(W-L-R),y=c=>T+(1-c/high)*(H-T-B);
 const pts=profile.map(p=>[x(p.t),y(p.c)]);
 const path=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(2)+" "+p[1].toFixed(2)).join(" ");
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("preserveAspectRatio","none");
 const add=(name,attrs,txt)=>{
  const el=document.createElementNS(svg.namespaceURI,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
  if(txt!==undefined)el.textContent=txt;svg.append(el);return el;
 };
 for(let i=0;i<=4;i++){const yy=T+i*(H-T-B)/4;add("line",{x1:L,x2:W-R,y1:yy,y2:yy});add("text",{x:L-7,y:yy+4,"text-anchor":"end"},format(high*(1-i/4),1))}
 for(let i=0;i<=6;i++){const xx=L+i*(W-L-R)/6;add("text",{x:xx,y:H-10,"text-anchor":"middle"},format(horizon*i/6,0))}
 add("path",{d:path+" L "+x(horizon)+" "+y(0)+" L "+x(0)+" "+y(0)+" Z",class:"area"});
 add("path",{d:path,class:"curve"});$("pk-plot").replaceChildren(svg);
 $("pk-horizon").textContent="0 – "+format(horizon,0)+" heures | Profil analytique fictif";
}
function renderPK(){
 try{
  const r=evaluate(state.pk),env=scenarioEnvelope(state.pk);
  $("pk-metrics").replaceChildren(
   metric("Cmax",format(r.Cmax,3),"mg/L"),metric("Tmax",format(r.Tmax,2),"h"),
   metric("AUC₀–∞",format(r.AUC,2),"mg·h/L"),metric("Demi-vie",format(r.halfLife,2),"h"),
   metric("Clairance totale",format(r.CL,2),"L/h"),metric("Constante kₑ",format(r.ke,4),"h⁻¹"),
   metric("CL rénale effective",format(r.CLrEff,2),"L/h"),metric("Indice Emax",format(r.effect,1)+" %","théorique"));
  plotProfile(r.profile,r.horizon);
  clear("pk-envelope");
  for(const [key,label,unit] of [["Cmax","Cmax","mg/L"],["AUC","AUC₀–∞","mg·h/L"]]){
   const row=newEl("div","envelope-row");row.append(newEl("span","",label),newEl("strong","",format(env[key][0],2)+" – "+format(env[key][1],2)+" "+unit));$("pk-envelope").append(row);
  }
 }catch(e){$("pk-metrics").textContent="Paramètres non valides : "+e.message;clear("pk-plot");clear("pk-envelope")}
}
$("pk-reset").addEventListener("click",()=>{state.pk={...DEFAULT_PARAMS};initializePKControls();renderPK()});
$("pk-export").addEventListener("click",()=>saveJSON("prmr-pkpd-hypothetical.json",{parameters:state.pk,predictions:safePK(),scenarioEnvelope:(()=>{try{return scenarioEnvelope(state.pk)}catch(e){return {error:e.message}}})(),dataProvenance:"hypothèses illustratives; pas de mesure",scope:"un compartiment; non clinique"}));

async function startChemistry(){
 try{
  const kit=await loadRDKit();state.kit=kit;setRdkitStatus("ready");analyzeCurrent();
 }catch(e){setRdkitStatus("failed",e.message)}
}
populateExamples();initializePKControls();renderPK();renderLibrary();renderSelectors();renderSystems();setRdkitStatus("loading");startChemistry();
initCloud({
 getMolecule:()=>{
  const analysis=analyzeCurrent();
  if(!analysis)return null;
  return {name:$("mol-name").value.trim()||"Structure sans nom",smiles:analysis.smiles,descriptors:analysis.descriptors};
 },
 getSimulation:()=>({
  parameters:{...state.pk},
  prediction:evaluate(state.pk),
  uncertainty:scenarioEnvelope(state.pk)
 })
});


const initialView = new URLSearchParams(window.location.search).get("view");
if (initialView && Object.prototype.hasOwnProperty.call(headings,initialView)) navigate(initialView);

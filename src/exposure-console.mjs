import {initialiserAssistant} from "./exposure-assistant.mjs";
import {doseAt,evaluateDay,fold} from "./exposure-evidence.mjs";
const $=id=>document.getElementById(id);
const node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const svg=(tag,attributes,text)=>{
 const el=document.createElementNS("http://www.w3.org/2000/svg",tag);
 for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));
 if(text!==undefined)el.textContent=text;
 return el;
};
const families=["Médicaments","Molécules","Substances naturelles","Aliments","Boissons"];
const published=[
 {id:"ibuprofene",name:"Ibuprofène oral",family:0,unit:"mg"},
 {id:"paracetamol",name:"Paracétamol",family:0,unit:"mg"},
 {id:"metformine",name:"Metformine",family:0,unit:"mg"},
 {id:"cafeine",name:"Caféine",family:1,unit:"mg"},
 {id:"the",name:"Thé noir",family:2,unit:"tasse"},
 {id:"cafe",name:"Café filtre",family:3,unit:"tasse"},
 {id:"chocolat",name:"Chocolat noir",family:3,unit:"portion"}
];
const names={colon:"Côlon",esophagus:"Œsophage",liver:"Foie",small_intestine:"Intestin",calf_l:"Mollet gauche",foot_l:"Pied gauche",heart:"Système cardiovasculaire",brain:"Sommeil",kidney_l:"Reins"};
const anchors={"male": {"foot_l": [370.2, 945.2], "calf_l": [366.0, 820.6], "heart": [322.3, 241.4], "liver": [304.6, 309.1], "small_intestine": [315.9, 400.8]}, "female": {"foot_l": [391.6, 942.4], "calf_l": [384.3, 805.6], "heart": [323.1, 254.9], "liver": [303.8, 306.8], "small_intestine": [313.5, 381.1]}};
const entry=(id,qty=1)=>({id,qty,after:qty/2,start:0,reduce:14,end:28});
const rows=[];
const products=new Map(published.map(s=>[s.id,s]));
const lookup=id=>products.get(id);
let sex="male",family=0,selected,editing=null,compare=true,timer,request=0;
const day=()=>Number($("xp-day").value),duration=()=>Number($("xp-day").max);
const fmt=x=>Number(x.toFixed(2)).toLocaleString("fr-FR");
Object.assign(anchors.male,{brain:[310,56],kidney_l:[308,342]});
Object.assign(anchors.female,{brain:[310,57],kidney_l:[309,343]});
function stop(){clearInterval(timer);timer=null;$("xp-play").textContent="▶";$("xp-play").ariaLabel="Lire la chronologie";}
function setDay(t){$("xp-day").value=t;render();}
function renderChart(active){
 const plot=$("xp-plot");plot.replaceChildren();
 const days=duration(),current=day(),id=$("xp-chart-item").value,product=lookup(id);
 const items=rows.filter(r=>r.id===id);
 const at=(t,reduced)=>items.reduce((sum,r)=>sum+doseAt(r,t,reduced),0);
 $("xp-chart-title").textContent=product?product.name+" · quantité saisie ("+product.unit+"/j)":"Ajouter une prise pour tracer son exposition.";
 const top=Math.max(1,...Array.from({length:days+1},(_,t)=>Math.max(at(t,true),compare?at(t,false):0)));
 const x=t=>38+360*t/days,y=v=>163-v/top*130;
 for(let i=0;i<=4;i++){
  const v=top*i/4,dt=Math.round(days*i/4);
  plot.append(svg("path",{d:"M38 "+y(v)+"H398",stroke:"#25465b"}),svg("text",{x:33,y:y(v)+3,"text-anchor":"end",fill:"#b4d4df","font-size":10},Number(v.toFixed(2)).toLocaleString("fr-FR")),svg("text",{x:x(dt),y:181,fill:"#bad9e4","font-size":11,"text-anchor":"middle"},"J"+dt));
 }
 for(const reduced of (compare?[false,true]:[true])){
  let path="";for(let t=0;t<=days;t++){if(t>0)path+=" H"+x(t);path+=(t?" L":"M")+x(t)+" "+y(at(t,reduced));}
  plot.append(svg("path",{d:path,fill:"none",stroke:reduced?"#45e1e5":"#ffab55","stroke-width":reduced?2.3:4}));
 }
 plot.append(svg("path",{d:"M"+x(current)+" 16V163",stroke:"#68c7d7","stroke-dasharray":"3 4"}),svg("circle",{cx:x(current),cy:y(at(current,true)),r:4,fill:"#9dffff"}));
 $("xp-legend").firstChild.textContent=compare?"━ Prise maintenue ":"";
}
function render(){
 const t=day(),result=evaluateDay(rows,t,Number($("xp-age").value),lookup),all=result.signals;
 document.dispatchEvent(new CustomEvent("xp-atlas",{detail:{sex,signals:all}}));
 const display={ethanolMl:"Alcool pur (mL)",ethanolG:"Alcool pur (g)",sugarG:"Sucres (g)",caffeineMg:"Caféine (mg)"};
 $("xp-totals").textContent=[...result.available].map(key=>display[key]+" : "+fmt(result.totals[key])).join(" · ");
 const weight=$("xp-weight");
 if(result.available.has("caffeineMg")&&weight.value&&weight.checkValidity())$("xp-totals").append(node("small"," · "+fmt(result.totals.caffeineMg/Number(weight.value))+" mg de caféine/kg"));
 if(result.available.size)$("xp-totals").append(node("small"," · apports quantifiables à J"+t+" ; teneurs manquantes exclues."));
 const traced=lookup($("xp-chart-item").value);
 if(traced){let sum=0;for(const r of rows.filter(r=>r.id===traced.id))for(let d=r.start;d<=Math.min(t,r.end-1);d++)sum+=doseAt(r,d);
 $("xp-totals").append(node("p","Quantité cumulée de "+traced.name+" de J0 à J"+t+" inclus : "+fmt(sum)+" "+traced.unit+"."));}
 const active=all.find(s=>s.zone===selected)||all[0];selected=active?.zone;
 $("xp-day-tag").value=$("xp-time-label").value="J"+t;
 $("xp-body-image").setAttribute("href","./assets/exposure/"+sex+".webp");
 const marks=$("xp-marks"),cards=$("xp-signals"),why=$("xp-reason");marks.replaceChildren();cards.replaceChildren();why.replaceChildren();
 for(const signal of all){
  const position=anchors[sex][signal.zone];
  const [cx,cy]=position||[0,0],left=["liver","small_intestine"].includes(signal.zone),ex=left?65:535;
  const adverse=signal.sign<0,shade=adverse?"bad":"good";
  const group=svg("g",{});group.append(svg("ellipse",{cx,cy,rx:signal.zone==="small_intestine"?55:32,ry:signal.zone==="calf_l"?48:31,fill:"url(#xp-"+shade+")"}),svg("path",{class:"xp-leader",d:"M"+cx+" "+cy+" L"+(left?ex+78:ex-78)+" "+(cy-25)+" H"+ex}),svg("text",{x:ex,y:cy-30,"text-anchor":left?"start":"end"},names[signal.zone]));if(position)marks.append(group);
  const b=node("button","");b.type="button";b.setAttribute("aria-pressed",String(signal===active));b.append(node("b",names[signal.zone]),Object.assign(node("span",adverse?"− Défavorable":"+ Favorable"),{className:adverse?"minus":"plus"}));
  const select=()=>{selected=signal.zone;render();document.dispatchEvent(new CustomEvent("xp-focus",{detail:signal.zone}))};b.onclick=select;group.onclick=select;cards.append(b);
 }
 if(active){
  why.append(node("h4",(active.sign<0?"Pourquoi ce signal est défavorable":"Pourquoi ce signal est favorable")+" · "+names[active.zone]),node("p",active.reason));
  if(active.url){const source=node("a",active.source);source.href=active.url;why.append(source)}else why.append(node("small",active.source));
 }else cards.append(node("p",rows.length?"Aucun repère défavorable ou favorable établi par les règles disponibles pour ces paramètres.":"Ajouter une prise pour consulter les repères documentés."));
 why.append(node("small","Carte : risque documenté à l’échelle d’une population. Aucune estimation de lésion, de guérison ou de probabilité personnelle. Une zone vide peut manquer de données."));
 renderChart(active);
}
function renderList(){
 const list=$("xp-list");list.replaceChildren();
 for(const [i,row] of rows.entries()){
  const s=lookup(row.id),box=node("div","");box.className="xp-row";
  const label=node("div",s.name);label.append(node("small",row.qty+" "+s.unit+"/j · J"+row.start+" à J"+row.end));
  if(row.label||row.caf!=null||row.abv!=null||row.sug!=null)label.append(node("small",[row.label,row.abv!=null?fmt(row.abv)+" % vol.":"",row.caf!=null?fmt(row.caf)+" mg caféine/100 mL":"",row.sug!=null?fmt(row.sug)+" g sucres/100 mL":""].filter(Boolean).join(" · ")));
  const edit=node("button","✎"),del=node("button","×");edit.ariaLabel="Modifier "+s.name;del.ariaLabel="Retirer "+s.name;
  edit.onclick=()=>openEditor(i);del.onclick=()=>{rows.splice(i,1);closeEditor();renderList();render();};box.append(label,edit,del);list.append(box);
 }
 if(!rows.length)list.append(node("p","Aucune prise dans ce scénario."));
 const previous=$("xp-chart-item").value;
 const ids=[...new Set(rows.map(r=>r.id))];$("xp-chart-item").replaceChildren(...ids.map(id=>new Option(lookup(id).name,id)));
 if(ids.includes(previous))$("xp-chart-item").value=previous;

}
function categories(){
 const host=$("xp-categories");host.replaceChildren();
 families.forEach((f,i)=>{const b=node("button","");const icone=svg("svg",{viewBox:"0 0 24 24","aria-hidden":"true"});
  const traces=["M7 18a5 5 0 0 1-1-8l5-5a5 5 0 1 1 7 7l-5 5a5 5 0 0 1-6 1z M8 8l7 7","M4 8l6-4 7 4v8l-7 4-6-4z M17 8l5-3 M17 16l5 3 M7 9v6","M3 19C2 7 11 4 21 3c0 11-6 17-15 15 M4 21L16 9","M3 11h18a9 9 0 0 1-18 0z M7 20h10 M8 8c-3-3 2-3 0-6 M14 8c-3-3 2-3 0-6","M6 6h12l-2 15H8z M6 10h11 M12 10l3-8h4"];
  icone.append(svg("path",{d:traces[i]}));const cadre=node("b","");cadre.append(icone);b.append(cadre,node("span",f));b.setAttribute("aria-pressed",String(i===family));b.onclick=()=>{family=i;categories();openEditor(null)};host.append(b)});
}
function closeEditor(){$("xp-editor").hidden=true;editing=null;$("xp-error").textContent="";}
function unit(){
 const s=lookup($("xp-substance").value);
 if(!s){$("xp-unit").textContent="";$("xp-item-source").textContent="";return;}
 $("xp-unit").textContent="("+s.unit+"/j)";
 $("xp-item-source").textContent=[s.source,...(s.active||[]).map(id=>lookup("sa"+id)?.name)].filter(Boolean).join(" · ");
 $("xp-composition").hidden=s.unit!=="mL";$("xp-bed-field").hidden=!(s.unit==="mL"||s.id==="cafeine"||fold(s.name)==="cafeine");$("xp-long-field").hidden=!(s.unit==="mL"||s.nutrients?.[1]>0);
}
function search(prefer){
 const term=fold($("xp-search").value.trim()),matches=[];
 for(const s of products.values()){
  if(s.family!==family)continue;
  if(!term||s.search.includes(term))matches.push(s);
 }
 const options=matches.slice(0,90);
 if(prefer&&lookup(prefer)&&!options.some(s=>s.id===prefer))options.unshift(lookup(prefer));
 $("xp-substance").replaceChildren(...options.map(s=>new Option(s.name,s.id)));
 if(prefer)$("xp-substance").value=prefer;
 $("xp-search-status").textContent=matches.length+" références"+(matches.length>90?" · 90 affichées, préciser le nom":"");
 unit();
}
function openEditor(i){
 editing=i;const row=i===null?null:rows[i];if(row)family=lookup(row.id).family;
 categories();$("xp-search").value="";request++;search(row?.id);
 const val=row||entry($("xp-substance").value,0);
 if(!row){val.reduce=Math.floor(duration()/2);val.end=duration();}
 for(const k of ["abv","caf","sug","label"])$("xp-"+k).value=row?.[k]??"";
 $("xp-bed").checked=!!row?.bed;$("xp-long").checked=!!row?.long;
 $("xp-substance").value=val.id;unit();
 for(const k of ["start","reduce","after","end"])$("xp-"+k).value=(!row&&k==="after")?"":val[k];
 $("xp-dose").value=val.qty||"";$("xp-error").textContent="";$("xp-editor").hidden=false;$("xp-substance").focus();
}
$("xp-editor").onsubmit=e=>{
 e.preventDefault();
 const value=id=>Number($("xp-"+id).value);
 const row={id:$("xp-substance").value,qty:value("dose"),after:value("after"),start:value("start"),reduce:value("reduce"),end:value("end")};
 if(!lookup(row.id)){$("xp-error").textContent="Choisir une référence.";return;}
 if(lookup(row.id).unit==="mL"){
  for(const k of ["abv","caf","sug"])row[k]=$("xp-"+k).value===""?null:Number($("xp-"+k).value);
  row.label=$("xp-label").value.trim();
  if([row.abv,row.caf,row.sug].some(v=>v!=null)&&!row.label){$("xp-error").textContent="Préciser le produit ou la source de la teneur.";return;}
 }
 row.bed=!$("xp-bed-field").hidden&&$("xp-bed").checked;row.long=!$("xp-long-field").hidden&&$("xp-long").checked;
 if(row.start>row.reduce||row.reduce>row.end||row.end<=row.start||row.after>row.qty){$("xp-error").textContent="La réduction doit se situer entre le début et l’arrêt. La quantité réduite doit être inférieure ou égale à la quantité initiale.";return;}
 if(editing===null)rows.push(row);else rows[editing]=row;
 closeEditor();renderList();render();
};
$("xp-substance").onchange=()=>{for(const k of ["abv","caf","sug","label"])$("xp-"+k).value="";$("xp-bed").checked=$("xp-long").checked=false;unit();};
$("xp-chart-item").onchange=render;
$("xp-search").oninput=()=>{request++;search();for(const k of ["abv","caf","sug","label"])$("xp-"+k).value="";$("xp-bed").checked=$("xp-long").checked=false;};
$("xp-add").onclick=()=>openEditor(null);$("xp-cancel").onclick=closeEditor;
$("xp-day").oninput=render;$("xp-duration").onchange=()=>{const el=$("xp-duration");if(!el.value||!el.checkValidity()){el.value=duration();return;}$("xp-day").max=el.value;render();};
$("xp-play").onclick=()=>{if(timer){stop();return;}if(day()===duration())setDay(0);$("xp-play").textContent="Ⅱ";$("xp-play").ariaLabel="Suspendre la chronologie";timer=setInterval(()=>{setDay(day()+1);if(day()>=duration())stop();},400);};
$("xp-compare").onclick=()=>{compare=!compare;$("xp-compare").setAttribute("aria-pressed",String(compare));render();};
for(const b of $("sex-choice").querySelectorAll("button"))b.onclick=()=>{sex=b.dataset.sex;for(const other of b.parentNode.children)other.setAttribute("aria-pressed",String(other===b));render();};
$("xp-age").oninput=$("xp-weight").oninput=render;
document.querySelector(".xp-head a:last-child").onclick=()=>{$("registre").open=true;};
const route=document.querySelector(".prmr-routebar");if(route)document.body.append(route);
categories();renderList();render();
function index(s){
 const ingredients=(s.active||[]).map(k=>lookup("sa"+k)?.name||"").join(" ");
 s.search=fold([s.name,s.id,s.source,ingredients].join(" "));products.set(s.id,s);
}
for(const s of published)index(s);
async function loadReferences(){
 try{
  const res=await fetch("./research-data/exposure-catalog.json.gz");if(!res.ok)throw Error();
  const bytes=await res.arrayBuffer(),compressed=new Uint8Array(bytes)[0]===31;
  const data=compressed?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).json():JSON.parse(new TextDecoder().decode(bytes));
  const refs=data.map(([id,name,family,unit,source,extra,ibuMg])=>({id,name,family,unit,source,active:id.startsWith("cis")?extra:undefined,nutrients:id.startsWith("al")?extra:undefined,ibuMg}));
  for(const s of refs)products.set(s.id,s);
  for(const s of refs)index(s);
  $("xp-catalog-status").textContent=products.size.toLocaleString("fr-FR")+" références locales · BDPM (France), Ciqual 2025 (Anses) et types de produits.";
  if(!$("xp-editor").hidden)search($("xp-substance").value);
 }catch{$("xp-catalog-status").textContent="Catalogue étendu indisponible. Recherche en ligne et saisie personnelle accessibles.";}
}
$("xp-online").onclick=async()=>{
 const term=$("xp-search").value.trim(),seq=++request,cat=family;
 if(term.length<3){$("xp-search-status").textContent="Saisir au moins trois caractères.";return;}
 $("xp-search-status").textContent="Recherche en cours…";
 try{
  let url,parse;
  if(cat===0){
   url="https://rxnav.nlm.nih.gov/REST/drugs.json?name="+encodeURIComponent(term);
   parse=d=>(d.drugGroup?.conceptGroup||[]).flatMap(g=>g.conceptProperties||[]).map(v=>({id:"rx"+v.rxcui,name:v.name,unit:"unité déclarée",source:"RxNorm · "+v.rxcui}));
  }else if(cat===1||cat===2){
   url="https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/"+encodeURIComponent(term)+"/json?limit=40";
   parse=d=>(d.dictionary_terms?.compound||[]).map(n=>({id:"pc"+cat+":"+n,name:n,unit:"mg",source:"PubChem · nom de composé"}));
  }else{
   const query=new URLSearchParams({search_terms:term,search_simple:"1",action:"process",json:"1",page_size:"35",fields:"code,product_name,brands,quantity"});
   url="https://world.openfoodfacts.org/cgi/search.pl?"+query;
   parse=d=>(d.products||[]).filter(v=>v.code&&v.product_name).map(v=>({id:"off"+cat+":"+v.code,name:[v.brands,v.product_name,v.quantity].filter(Boolean).join(" · "),unit:cat===4?"mL":"g",source:"Open Food Facts · code "+v.code}));
  }
  const res=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error();
  const refs=parse(await res.json());if(seq!==request||cat!==family||$("xp-editor").hidden)return;
  for(const s of refs)index({...s,family:cat});
  if(refs.length){for(const k of ["abv","caf","sug","label"])$("xp-"+k).value="";$("xp-bed").checked=$("xp-long").checked=false;$("xp-substance").replaceChildren(...refs.map(s=>new Option(s.name,s.id)));unit();}
  $("xp-search-status").textContent=refs.length+" résultats externes · vérifier la composition sur l’étiquette.";
 }catch{if(seq===request)$("xp-search-status").textContent="Source externe indisponible. Les références locales restent accessibles.";}
};
$("xp-custom").onclick=()=>{
 const name=$("xp-search").value.trim();if(!name){$("xp-search-status").textContent="Saisir le nom précis du produit dans le champ de recherche.";return;}
 const id="perso:"+family+":"+name,unit=["unité déclarée","mg","g","g","mL"][family];index({id,name,family,unit,source:"Référence personnelle · composition à vérifier"});search(id);$("xp-substance").onchange();
};
document.addEventListener("xp-atlas-ready",render);
loadReferences().then(()=>initialiserAssistant({
 produits:products,
 proposer(produit,prise){
  family=produit.family;openEditor(null);search(produit.id);
  for(const [champ,cle] of [["dose","quantite"],["start","debut"],["reduce","reduction"],["after","apres"],["end","arret"]]){
   $("xp-"+champ).value=prise[cle]??"";
  }
  $("xp-editor").scrollIntoView({block:"nearest"});
 },
 bilan(){return [$("xp-totals").textContent,...evaluateDay(rows,day(),Number($("xp-age").value),lookup).signals.map(s=>s.reason)].filter(Boolean).join(" ");},
 scenario(){
  const resultat=evaluateDay(rows,day(),Number($("xp-age").value),lookup);
  return {parametres:{jour:day(),duree:duration(),sexe:sex,age:$("xp-age").value,poids:$("xp-weight").value,taille:$("xp-height").value,
   prises:rows.map(r=>({...r,nom:lookup(r.id).name,unite:lookup(r.id).unit}))},
   resultats:{apports:Object.fromEntries([...resultat.available].map(k=>[k,resultat.totals[k]])),reperes:resultat.signals}};
 }
}));

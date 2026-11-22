import {themeProduit,connaissances,quantiteDefaut,DUREE_DEFAUT} from "./exposure-narrative.mjs";
import {initialiserAssistant} from "./exposure-assistant.mjs";
import {doseAt,evaluateDay,fold} from "./exposure-evidence.mjs";
import {analyserAlcool,reperesAtlas,alcoolemie,arrondi,libelleCategorie,equivalencesAlcool} from "./exposure-risk.mjs";
import {analyserAgents,teneurLibelle} from "./exposure-agents.mjs";
import {BOISSONS,NATURELLES} from "./exposure-boissons.mjs";
import {ficheSymptomes} from "./exposure-symptomes.mjs";
let symptomes=[];
import {chargerNotices,fichesNotices} from "./exposure-notices.mjs";
let notices=null,noticesDemandees=false;
import {chargerMonographies,fichesMonographies,nomFrancais} from "./exposure-monographies.mjs";
let monographies=null,monographiesDemandees=false;
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
 {id:"chocolat",name:"Chocolat noir",family:3,unit:"portion"},
 {id:"redbull",name:"Red Bull, boisson énergisante",family:4,unit:"mL",compo:{caf:32,sug:11,label:"Red Bull · composition officielle (80 mg de caféine, 27 g de sucres par 250 mL)"}}
];
const names={colon:"Côlon",esophagus:"Œsophage",liver:"Foie",small_intestine:"Intestin",calf_l:"Mollet gauche",foot_l:"Pied gauche",heart:"Système cardiovasculaire",brain:"Sommeil",kidney_l:"Reins"};
const anchors={"male": {"foot_l": [370.2, 945.2], "calf_l": [366.0, 820.6], "heart": [322.3, 241.4], "liver": [304.6, 309.1], "small_intestine": [315.9, 400.8]}, "female": {"foot_l": [391.6, 942.4], "calf_l": [384.3, 805.6], "heart": [323.1, 254.9], "liver": [303.8, 306.8], "small_intestine": [313.5, 381.1]}};
// Valeurs de départ : 1 000 mg, 100 g ou 100 mL par jour, du jour 0 au jour 30, sans réduction.
const entry=(id,qty)=>{const s=products?.get?.(id);const q=qty??(s?quantiteDefaut(s):1);return {id,qty:q,after:q,start:0,reduce:DUREE_DEFAUT,end:DUREE_DEFAUT};};
const rows=[];
let registre=[];
published.push(...BOISSONS,...NATURELLES);
const products=new Map(published.map(s=>[s.id,s]));
const lookup=id=>products.get(id);
let sex="male",family=0,selected,editing=null,ajoutAuto=false,precedent=null,compare=true,timer,request=0;
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
 const mesure=$("xp-measure").value,cumul=$("xp-cumul").checked;
 const libelles={ethanolMl:"Alcool pur (mL)",caffeineMg:"Caféine (mg)",sugarG:"Sucres (g)",ethanolG:"Alcool pur (g)"};
 function serie(reduite){
  let somme=0,incomplet=false;
  const moitie=!reduite&&$("xp-alternative").value==="moitie";
  const scenario=reduite?rows:rows.map(r=>moitie?{...r,qty:r.qty/2,after:r.after/2}:{...r,after:r.qty});
  return Array.from({length:days+1},(_,t)=>{
   let valeur;
   if(mesure==="prise")valeur=items.reduce((s,r)=>s+doseAt(r,t,reduite||moitie)*(moitie ? 0.5 : 1),0);
   else{
    const valeurs=evaluateDay(scenario,t,Number($("xp-age").value),lookup);
    valeur=valeurs.available.has(mesure)?valeurs.totals[mesure]:scenario.some(r=>doseAt(r,t)>0)?null:0;
   }
   if(valeur===null)incomplet=true;else somme+=valeur;
   return cumul?(incomplet?null:somme):valeur;
  });
 }
 const parametree=serie(true),maintenue=serie(false),at=(t,reduite)=>(reduite?parametree:maintenue)[t];
 const titre=mesure==="prise"?(product?product.name+" ("+product.unit+")":"Quantité de produit"):libelles[mesure]+" · toutes les prises quantifiables";
 $("xp-chart-title").textContent=titre+" · "+(cumul?"cumul depuis J0":"par jour")+" · J"+current+" : "+(at(current,true)==null?"donnée manquante":fmt(at(current,true)));
 $("xp-legend").hidden=!rows.length;
 $("xp-alternative").disabled=!compare;
 if(!rows.length||!parametree.some(v=>v!=null&&v>0)&&parametree.includes(null)){
  $("xp-chart-title").textContent=rows.length?titre+" · teneur manquante pour tracer cet apport.":"Ajoutez une prise ou décrivez-la dans l’assistant pour obtenir la courbe.";
  return;
 }
 if(compare&&at(current,false)!=null&&at(current,true)!=null)$("xp-chart-title").textContent+=" · scénario comparé : "+fmt(at(current,false));
 const top=Math.max(1,...parametree,...(compare?maintenue:[]));
 const x=t=>38+360*t/days,y=v=>163-v/top*130;
 for(let i=0;i<=4;i++){
  const v=top*i/4,dt=Math.round(days*i/4);
  plot.append(svg("path",{d:"M38 "+y(v)+"H398",stroke:"#25465b"}),svg("text",{x:33,y:y(v)+3,"text-anchor":"end",fill:"#b4d4df","font-size":10},Number(v.toFixed(2)).toLocaleString("fr-FR")),svg("text",{x:x(dt),y:181,fill:"#bad9e4","font-size":11,"text-anchor":"middle"},"J"+dt));
 }
 for(const reduced of (compare?[false,true]:[true])){
  let path="",precedent=null;for(let t=0;t<=days;t++){const valeur=at(t,reduced);if(valeur!=null){if(precedent!=null)path+=" H"+x(t);path+=(precedent==null?" M":" L")+x(t)+" "+y(valeur);}precedent=valeur;}
  plot.append(svg("path",{d:path,fill:"none",stroke:reduced?"#45e1e5":"#ffab55","stroke-width":reduced?2.3:4}));
 }
 plot.append(svg("path",{d:"M"+x(current)+" 16V163",stroke:"#68c7d7","stroke-dasharray":"3 4"}),svg("circle",{cx:x(current),cy:y(at(current,true)),r:at(current,true)==null?0:4,fill:"#9dffff"}));
 $("xp-legend").firstChild.textContent=compare?($("xp-alternative").value==="moitie"?"━ Quantités divisées par deux ":"━ Prise maintenue "):"";
}
function profil(){return {sexe:sex,age:Number($("xp-age").value),poids:Number($("xp-weight").value),taille:Number($("xp-height").value)};}
const couleurs={eleve:"#ff5a48",modere:"#ff9a3c",faible:"#ffd166",favorable:"#3fe6b0",non_chiffre:"#a9b8c2"};
const nature={association_observee:"Association observée",reglementaire:"Calcul + seuil officiel",non_documente:"Décrit, non chiffré"};
function ficheAlcool(a){
 if(!a)return null;
 return {id:"alcool",titre:"Alcool",unite:"g/j",moyenne:a.moyenne,nbJours:a.nbJours,total:a.total,resultats:a.resultats,
  entete:[a.nbJours+" jour"+(a.nbJours>1?"s":"")+" de consommation · "+arrondi(a.total,0)+" g au total · catégorie "+libelleCategorie(a.categorie)+".",a.domaine==="extrapole"?"Durée inférieure à un an : les effets à long terme sont extrapolés (consommation supposée durable).":"Durée d’au moins un an : dans le domaine des études de consommation habituelle."],
  equivalences:equivalencesAlcool(a.moyenne).map(e=>"≈ "+arrondi(e.nombre)+" "+e.nom+" ("+e.detail+", soit "+arrondi(e.parUnite)+" g chacun)")};
}
function equivalences(g){
 const ul=document.createElement("ul");ul.className="xr-equiv";
 for(const e of equivalencesAlcool(g))ul.append(node("li","≈ "+arrondi(e.nombre)+" "+e.nom+" ("+e.detail+", soit "+arrondi(e.parUnite)+" g chacun)"));
 return ul;
}
const libNiveau={eleve:"Élevé",modere:"Modéré",faible:"Faible",favorable:"Favorable",non_chiffre:"Décrit"};
// Liste latérale en accordéon : une ligne fine par effet, du plus grave (rouge) au moins grave (blanc).
function accordeon(fiches,teneurInconnue){
 const boite=document.createElement("div");boite.className="xr-acc";
 const rang={eleve:0,modere:1,faible:2,non_chiffre:3,favorable:4};
 for(const f of fiches){
  const tete=node("details","");tete.className="xr-resume";tete.open=fiches.length<3;
  const entete=node("summary","");entete.append(node("span",f.titre+(f.unite?" · "+arrondi(f.moyenne)+" "+f.unite.replace("/j"," par jour"):"")));tete.append(entete);
  for(const l of f.entete||(f.nbJours?[f.nbJours+" jour"+(f.nbJours>1?"s":"")+" de prise · dose la plus forte : "+arrondi(f.max??f.moyenne)+" "+f.unite.replace("/j","")+"."]:[]))tete.append(node("p",l));
  if(f.equivalences?.length){tete.append(node("p","Ce que cela représente :"));const ul=document.createElement("ul");ul.className="xr-equiv";for(const e of f.equivalences)ul.append(node("li",e));tete.append(ul);}
  boite.append(tete);
  for(const r of [...f.resultats].sort((x,y)=>rang[x.niveau]-rang[y.niveau]||(y.rr??0)-(x.rr??0))){
   const d=node("details","");d.className="xr-item";d.dataset.niveau=r.niveau;
   const chiffre=r.badge??(r.rr!=null?"× "+arrondi(r.rr,2):libNiveau[r.niveau]);
   const resume=node("summary","");resume.append(node("span",r.titre),node("b",chiffre));d.append(resume);
   d.append(node("p",r.constat));
   if(r.rr!=null)d.append(node("p","Chiffre : × "+arrondi(r.rr,2)+(r.bas!=null?" (IC 95 % "+arrondi(r.bas,2)+" à "+arrondi(r.haut,2)+")":" (intervalle non publié)")+", soit "+(r.rr>=1?"+":"")+arrondi((r.rr-1)*100,0)+" % par rapport à une personne non exposée."));
   d.append(node("p","Pourquoi : "+r.pourquoi));
   const etiq=node("p","");etiq.className="xr-etiq";
   etiq.textContent=({association_observee:"Association observée",reglementaire:"Seuil officiel",toxique_etabli:"Toxicité établie",non_documente:"Décrit, non chiffré",pharmacovigilance:"Notice officielle · pharmacovigilance",analyse:"Analyse pharmacologique"})[r.statut]+" · "+(r.domaine==="extrapole"&&r.statut!=="reglementaire"?"extrapolé (durée)":"calculé");d.append(etiq);
   if(r.url){const lien=node("a",r.source);lien.href=r.url;lien.target="_blank";lien.rel="noopener";d.append(lien);}
   if(r.source2){const l2=node("a",r.source2.source);l2.href=r.source2.url;l2.target="_blank";l2.rel="noopener";d.append(node("br",""),l2);}
   d.ontoggle=()=>{if(d.open&&r.zones.length)document.dispatchEvent(new CustomEvent("xp-focus",{detail:r.zones[0]}));};
   boite.append(d);
  }
 }
 if(teneurInconnue?.length)boite.append(Object.assign(node("p","Teneur inconnue pour : "+teneurInconnue.join(", ")+". Ajoutez la substance active en mg (famille Molécules) pour la calculer."),{className:"xr-etiq"}));
 return boite;
}
function renderRecherche(fiches,a){
 const zone=$("xp-research");zone.hidden=!fiches.length;if(!fiches.length)return;
 const lignes=fiches.flatMap(f=>f.resultats.map(r=>({...r,titre:(fiches.length>1?f.titre+" · ":"")+r.titre}))).sort((x,y)=>(y.rr??0)-(x.rr??0));
 // Forêt des risques relatifs, échelle logarithmique.
 const f=$("xr-forest"),chiffres=lignes.filter(r=>r.rr!=null&&r.bas!=null);f.replaceChildren();
 const h=26+chiffres.length*22,lo=Math.log(0.5),hi=Math.log(Math.max(4,...chiffres.map(r=>r.haut))*1.1);
 f.setAttribute("viewBox","0 0 560 "+h);
 const X=v=>215+330*(Math.log(v)-lo)/(hi-lo);
 for(const v of [0.5,1,2,5,10,20,50].filter(v=>Math.log(v)<=hi)){f.append(svg("path",{d:"M"+X(v)+" 6V"+(h-16),stroke:v===1?"#9fe9f1":"#23485a","stroke-dasharray":v===1?"":"2 3"}),svg("text",{x:X(v),y:h-3,"text-anchor":"middle"},String(v).replace(".",",")));}
 chiffres.forEach((r,i)=>{const y=18+i*22,c=couleurs[r.niveau];
  f.append(svg("text",{x:208,y:y+4,"text-anchor":"end"},r.titre.length>34?r.titre.slice(0,33)+"…":r.titre),svg("path",{d:"M"+X(r.bas)+" "+y+"H"+X(r.haut),stroke:c,"stroke-width":2}),svg("rect",{x:X(r.rr)-4,y:y-4,width:8,height:8,fill:c}),svg("text",{x:Math.min(552,X(r.haut)+5),y:y+4,fill:c},arrondi(r.rr,2)));});
 // Alcoolémie maximale par jour (Widmark), bande d'incertitude et seuil de 0,5 g/L.
 const b=$("xr-bac");b.replaceChildren();b.closest("figure").hidden=!a;if(!a)return;
 const valeurs=a.jours.map(g=>alcoolemie(g,profil()));
 const n=a.jours.length-1||1,top=Math.max(0.6,...valeurs.map(v=>v?v.haut:0))*1.08;
 const bx=t=>44+460*t/n,by=v=>182-v/top*165;
 for(let i=0;i<=4;i++){const v=top*i/4;b.append(svg("path",{d:"M44 "+by(v)+"H504",stroke:"#1e4152"}),svg("text",{x:39,y:by(v)+4,"text-anchor":"end"},arrondi(v,2)));}
 for(let i=0;i<=4;i++){const t=Math.round(n*i/4);b.append(svg("text",{x:bx(t),y:200,"text-anchor":"middle"},"J"+t));}
 let bande="",haut="",bas="",ligne="";
 valeurs.forEach((v,t)=>{const p=v||{pic:0,bas:0,haut:0};haut+=(t?" L":"M")+bx(t)+" "+by(p.haut);bas=" L"+bx(t)+" "+by(p.bas)+bas;ligne+=(t?" L":"M")+bx(t)+" "+by(p.pic);});
 bande=haut+bas+" Z";
 b.append(svg("path",{d:bande,fill:"#ff9a3c33",stroke:"none"}),svg("path",{d:ligne,fill:"none",stroke:"#ff9a3c","stroke-width":2}),
  svg("path",{d:"M44 "+by(0.5)+"H504",stroke:"#ff5a48","stroke-dasharray":"5 4"}),svg("text",{x:500,y:by(0.5)-4,"text-anchor":"end",fill:"#ff8b7d"},"0,5 g/L · seuil légal de conduite"),
  svg("path",{d:"M"+bx(day())+" 14V182",stroke:"#68c7d7","stroke-dasharray":"3 4"}));
}
function render(){
 const t=day(),result=evaluateDay(rows,t,Number($("xp-age").value),lookup);
 const analyse=analyserAlcool(rows,lookup,profil(),duration());
 const agents=analyserAgents(rows,lookup,profil(),duration(),registre);
 // Notices officielles : chargées seulement quand une spécialité ou une molécule est dans le scénario.
 if(!noticesDemandees&&rows.some(r=>/^(cis|sa)/.test(r.id)||["paracetamol","ibuprofene","metformine"].includes(r.id))){noticesDemandees=true;chargerNotices().then(d=>{notices=d;render();}).catch(()=>{});}
 if(!monographiesDemandees&&rows.some(r=>lookup(r.id)?.family===2||r.id.startsWith("ema:"))){monographiesDemandees=true;chargerMonographies().then(d=>{monographies=d;ajouterPlantes(d);render();}).catch(()=>{});}
 const fiches=[ficheAlcool(analyse),...agents.fiches,...fichesNotices(rows,lookup,products,notices,duration()),...fichesMonographies(rows,lookup,monographies,duration())].filter(Boolean);
 // Symptômes décrits dans le récit : rapprochés des effets enregistrés, affichés en tête.
 const parSymptome=ficheSymptomes(symptomes,fiches);if(parSymptome)fiches.unshift(parSymptome);
 // Les fiches de recherche remplacent les repères génériques (NCI, EFSA sommeil reste affiché).
 const all=fiches.length?[...fiches.flatMap(f=>reperesAtlas(f)),...result.signals.filter(s=>!s.source.startsWith("National Cancer Institute"))]:result.signals;
 for(const s of all)s.cle??=s.recherche?s.title:s.zone;
 renderRecherche(fiches,analyse);
 document.dispatchEvent(new CustomEvent("xp-atlas",{detail:{sex,signals:all}}));
 const display={ethanolMl:"Alcool pur (mL)",ethanolG:"Alcool pur (g)",sugarG:"Sucres (g)",caffeineMg:"Caféine (mg)"};
 $("xp-totals").textContent=[...result.available].map(key=>display[key]+" : "+fmt(result.totals[key])).join(" · ");
 const tableau=$("xp-day-table");tableau.replaceChildren();
 for(const cle of Object.keys(display)){
  const ligne=node("div","");ligne.className="xp-metric";ligne.append(node("span",display[cle]),node("b",result.available.has(cle)?fmt(result.totals[cle]):"Non renseigné"));tableau.append(ligne);
 }
 const weight=$("xp-weight");
 if(result.available.has("caffeineMg")&&weight.value&&weight.checkValidity())$("xp-totals").append(node("small"," · "+fmt(result.totals.caffeineMg/Number(weight.value))+" mg de caféine/kg"));
 if(result.available.size)$("xp-totals").append(node("small"," · apports quantifiables à J"+t+" ; teneurs manquantes exclues."));
 const traced=lookup($("xp-chart-item").value);
 if(traced){let sum=0;for(const r of rows.filter(r=>r.id===traced.id))for(let d=r.start;d<=Math.min(t,r.end-1);d++)sum+=doseAt(r,d);
 $("xp-totals").append(node("p","Quantité cumulée de "+traced.name+" de J0 à J"+t+" inclus : "+fmt(sum)+" "+traced.unit+"."));}
 const autres=all.filter(s=>!s.recherche);
 const active=autres.find(s=>s.cle===selected)||autres[0];if(active)selected=active.cle;
 $("xp-day-tag").value=$("xp-time-label").value="J"+t;
 $("xp-body-image").setAttribute("href","./assets/exposure/"+sex+".webp");
 const marks=$("xp-marks"),cards=$("xp-signals"),why=$("xp-reason");marks.replaceChildren();cards.replaceChildren();why.replaceChildren();
 if(fiches.length)cards.append(accordeon(fiches,agents.teneurInconnue));
 for(const signal of autres){
  const position=anchors[sex][signal.zone];
  const [cx,cy]=position||[0,0],left=["liver","small_intestine"].includes(signal.zone),ex=left?65:535;
  const adverse=signal.sign<0,shade=adverse?"bad":"good";
  const group=svg("g",{});group.append(svg("ellipse",{cx,cy,rx:signal.zone==="small_intestine"?55:32,ry:signal.zone==="calf_l"?48:31,fill:"url(#xp-"+shade+")"}),svg("path",{class:"xp-leader",d:"M"+cx+" "+cy+" L"+(left?ex+78:ex-78)+" "+(cy-25)+" H"+ex}),svg("text",{x:ex,y:cy-30,"text-anchor":left?"start":"end"},names[signal.zone]));if(position)marks.append(group);
  const b=node("button","");b.type="button";b.setAttribute("aria-pressed",String(signal===active));b.append(node("b",signal.recherche?signal.title:names[signal.zone]),Object.assign(node("span",adverse?"− Défavorable":"+ Favorable"),{className:adverse?"minus":"plus"}));
  const select=()=>{selected=signal.cle;render();document.dispatchEvent(new CustomEvent("xp-focus",{detail:signal.zone}))};b.onclick=select;group.onclick=select;cards.append(b);
 }
 if(active){
  why.append(node("h4",(active.sign<0?"Pourquoi ce signal est défavorable":"Pourquoi ce signal est favorable")+" · "+(active.recherche?active.title:names[active.zone])),node("p",active.reason));
  if(active.url){const source=node("a",active.source);source.href=active.url;why.append(source)}else why.append(node("small",active.source));
 }else if(!fiches.length)cards.append(node("p",rows.length?"Aucun repère défavorable ou favorable établi par les règles disponibles pour ces paramètres.":"Ajouter une prise pour consulter les repères documentés."));
  if(active||fiches.length)why.append(node("small","Carte : couleur selon le risque relatif calculé pour la dose saisie, mesuré dans des populations. Ce n’est pas un diagnostic. Une zone vide peut manquer de données."));
 const themes=new Set(rows.filter(r=>doseAt(r,t)>0).map(r=>r.abv===0?null:themeProduit(lookup(r.id)?.name||"")).filter(Boolean));
 for(const theme of themes)if(!(analyse&&theme==="alcool"))for(const [titre,detail,source,url] of connaissances[theme]){
  const boite=node("details",""),lien=node("a",source);lien.href=url;
  boite.append(node("summary",titre),node("p",detail),lien);cards.append(boite);
 }
 const cles=new Set();
 for(const r of rows.filter(r=>doseAt(r,t)>0)){
  const p=lookup(r.id);cles.add(fold(p.name));cles.add(p.id);
  for(const id of p.active||[])cles.add(fold(lookup("sa"+id)?.name||""));
 }
 const couvertes=new Set(fiches.map(f=>f.id));
 for(const fiche of registre.filter(f=>cles.has(f.id)&&!couvertes.has(f.id))){
  const bloc=node("details","");bloc.append(node("summary","Fiche de recherche · "+fiche.label),node("p",fiche.horizon_note||""));
  for(const repere of [...fiche.thresholds,...(fiche.renal_note?[fiche.renal_note]:[])]){
   const titre=node("strong",repere.title),lien=node("a",repere.source);lien.href=repere.url;
   bloc.append(titre,node("p",repere.detail),lien);
  }
  cards.append(bloc);
 }
 renderChart(active);
}
function renderList(){
 const list=$("xp-list");list.replaceChildren();
 for(const [i,row] of rows.entries()){
  const s=lookup(row.id),box=node("div","");box.className="xp-row";
  const label=node("div",s.name);label.append(node("small",quantiteTexte(s,row.qty)+" · J"+row.start+" à J"+row.end));
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
function closeEditor(){$("xp-editor").hidden=true;editing=null;ajoutAuto=false;precedent=null;$("xp-error").textContent="";}
function unit(){
 const s=lookup($("xp-substance").value);
 if(!s){$("xp-unit").textContent="";$("xp-item-source").textContent="";return;}
 const t=uniteMg(s);
 $("xp-unit").textContent=s.id.startsWith("cis")?"("+forme(s)+"/j"+(t?" · 1 = "+fmt(t)+" mg · "+fmt(Number($("xp-dose").value||0)*t)+" mg/j":"")+")":"("+s.unit+"/j)";
 $("xp-item-source").textContent=[s.source,...(s.active||[]).map(id=>lookup("sa"+id)?.name)].filter(Boolean).join(" · ");
 $("xp-composition").hidden=s.unit!=="mL";$("xp-bed-field").hidden=!(s.unit==="mL"||s.id==="cafeine"||fold(s.name)==="cafeine");$("xp-long-field").hidden=!(s.unit==="mL"||s.nutrients?.[1]>0);
}
// Recherche par mots : chaque mot saisi doit figurer dans le nom, la substance active ou le code.
// « ciprofloxacine 750 » trouve « CIPROFLOXACINE ARROW 750 mg ». Les noms qui commencent par la saisie passent en tête.
const LIMITE=400;
function search(prefer){
 const saisie=fold($("xp-search").value.trim()),mots=saisie.split(/\s+/).filter(Boolean),matches=[];
 for(const s of products.values()){
  if(s.family!==family)continue;
  if(mots.every(m=>s.search.includes(m)))matches.push(s);
 }
 const rang=s=>{const n=fold(s.name);return (n.startsWith(saisie)?0:mots[0]&&n.startsWith(mots[0])?1:2);};
 matches.sort((a,b)=>rang(a)-rang(b)||a.name.localeCompare(b.name,"fr"));
 const options=matches.slice(0,LIMITE);
 if(prefer&&lookup(prefer)&&!options.some(s=>s.id===prefer))options.unshift(lookup(prefer));
 $("xp-substance").replaceChildren(...options.map(s=>new Option(libelle(s),s.id)));
 if(prefer)$("xp-substance").value=prefer;
 $("xp-search-status").textContent=matches.length.toLocaleString("fr-FR")+" références"+(matches.length>LIMITE?" · "+LIMITE+" affichées : ajoutez un mot (marque, dosage, laboratoire) pour préciser":"");
 unit();
}
// Libellé d'une spécialité avec sa teneur quand le nom l'indique.
function libelle(s){const t=uniteMg(s);return t?s.name+" · "+fmt(t)+" mg par unité":s.name;}
function uniteMg(s){return s?.id?.startsWith("cis")?teneurLibelle(s):null;}
function forme(s){const n=fold(s.name);return /gelule/.test(n)?"gélule(s)":/comprime/.test(n)?"comprimé(s)":/sachet/.test(n)?"sachet(s)":/capsule/.test(n)?"capsule(s)":/suppositoire/.test(n)?"suppositoire(s)":"unité(s)";}
function quantiteTexte(s,qty){
 if(!s.id.startsWith("cis"))return qty+" "+s.unit+"/j";
 const t=uniteMg(s);return qty+" "+forme(s)+"/j"+(t?" · "+fmt(qty*t)+" mg/j":"");
}
function openEditor(i){
 editing=i;const row=i===null?null:rows[i];if(row)family=lookup(row.id).family;
 categories();$("xp-search").value="";request++;search(row?.id);
 const val=row||entry($("xp-substance").value);
 for(const k of ["abv","caf","sug","label"])$("xp-"+k).value=row?.[k]??"";
 $("xp-bed").checked=!!row?.bed;$("xp-long").checked=!!row?.long;
 $("xp-substance").value=val.id;unit();
 for(const k of ["start","reduce","after","end"])$("xp-"+k).value=val[k];
 $("xp-dose").value=val.qty||"";$("xp-error").textContent="";$("xp-editor").hidden=false;$("xp-substance").focus();
 precedent={dose:val.qty,end:val.end};

}
// Lecture du formulaire : renvoie la prise ou un message d'erreur.
function lireFormulaire(){
 const value=id=>Number($("xp-"+id).value);
 const row={id:$("xp-substance").value,qty:value("dose"),after:value("after"),start:value("start"),reduce:value("reduce"),end:value("end")};
 if(!lookup(row.id))return "Choisir une référence.";
 if(!(row.qty>0))return "Indiquer une quantité journalière.";
 if(lookup(row.id).unit==="mL"){
  for(const k of ["abv","caf","sug"])row[k]=$("xp-"+k).value===""?null:Number($("xp-"+k).value);
  row.label=$("xp-label").value.trim();
  if([row.abv,row.caf,row.sug].some(v=>v!=null)&&!row.label)return "Préciser le produit ou la source de la teneur.";
 }
 row.bed=!$("xp-bed-field").hidden&&$("xp-bed").checked;row.long=!$("xp-long-field").hidden&&$("xp-long").checked;
 if(row.start>row.reduce||row.reduce>row.end||row.end<=row.start||row.after>row.qty)return "La réduction doit se situer entre le début et l’arrêt. La quantité réduite doit être inférieure ou égale à la quantité initiale.";
 return row;
}
// Calcul immédiat : la prise en cours d'édition est appliquée dès qu'elle est valide.
function calculer(){
 const row=lireFormulaire();
 if(typeof row==="string"){$("xp-error").textContent=row;return false;}
 $("xp-error").textContent="";
 if(editing===null){rows.push(row);editing=rows.length-1;ajoutAuto=true;}else rows[editing]=row;
 // L'horizon du graphique couvre toujours la prise la plus longue.
 const fin=Math.min(730,Math.max(...rows.map(r=>r.end)));if(fin>duration())$("xp-duration").value=$("xp-day").max=String(fin);
 renderList();render();return true;
}
// Sans réduction choisie, la quantité après réduction et le jour de réduction suivent la dose et l'arrêt.
function suivre(){
 if(precedent){
  if(Number($("xp-after").value)===precedent.dose)$("xp-after").value=$("xp-dose").value;
  if(Number($("xp-reduce").value)===precedent.end)$("xp-reduce").value=$("xp-end").value;
 }
 precedent={dose:Number($("xp-dose").value),end:Number($("xp-end").value)};
 unit();calculer();
}
for(const k of ["dose","start","reduce","after","end","abv","caf","sug","label"])$("xp-"+k).addEventListener("input",suivre);
$("xp-bed").addEventListener("change",calculer);$("xp-long").addEventListener("change",calculer);
$("xp-editor").onsubmit=e=>{
 e.preventDefault();
 if(calculer())closeEditor();
};
$("xp-substance").onchange=()=>{$("xp-bed").checked=$("xp-long").checked=false;unit();changerSubstance();};
// Nouvelle substance : quantité de départ de cette unité, puis calcul immédiat.
function changerSubstance(){
 const s=lookup($("xp-substance").value);if(!s)return;
 // Produit dont la composition est connue : teneurs préremplies, modifiables.
 for(const k of ["abv","caf","sug","label"])$("xp-"+k).value=s.compo?.[k]??"";
 unit();
 if(ajoutAuto||editing===null){const q=quantiteDefaut(s);if(Number($("xp-after").value)===Number($("xp-dose").value))$("xp-after").value=q;$("xp-dose").value=q;precedent={dose:q,end:Number($("xp-end").value)};}
 calculer();
}
$("xp-alternative").onchange=$("xp-chart-item").onchange=$("xp-measure").onchange=$("xp-cumul").onchange=render;
let attente;
$("xp-search").oninput=()=>{request++;search();for(const k of ["abv","caf","sug","label"])$("xp-"+k).value="";$("xp-bed").checked=$("xp-long").checked=false;clearTimeout(attente);attente=setTimeout(changerSubstance,300);};
$("xp-add").onclick=()=>openEditor(null);
// Annuler retire la prise ajoutée automatiquement pendant cette édition.
$("xp-cancel").onclick=()=>{if(ajoutAuto&&editing!==null){rows.splice(editing,1);renderList();render();}closeEditor();};
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
// Plantes des monographies européennes ajoutées aux substances naturelles (100 g par jour par défaut).
function ajouterPlantes(d){
 (d?.plantes||[]).forEach((pl,i)=>{if(!pl.latin&&!pl.commun)return;const id="ema:"+i;if(products.has(id))return;
  const s={id,name:[nomFrancais(pl),pl.commun,pl.latin].filter(Boolean).join(" · "),family:2,unit:"g",source:"EMA · monographie de plante"};products.set(id,s);index(s);});
}
async function loadReferences(){
 try{
  const res=await fetch("./research-data/exposure-catalog.json.gz");if(!res.ok)throw Error();
  const bytes=await res.arrayBuffer(),compressed=new Uint8Array(bytes)[0]===31;
  const data=compressed?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).json():JSON.parse(new TextDecoder().decode(bytes));
  const refs=data.map(([id,name,family,unit,source,extra,ibuMg])=>({id,name,family,unit,source,active:id.startsWith("cis")?extra:undefined,nutrients:id.startsWith("al")?extra:undefined,ibuMg}));
  for(const s of refs)products.set(s.id,s);
  for(const s of refs)index(s);
  chargerMonographies().then(d=>{monographies=d;monographiesDemandees=true;ajouterPlantes(d);if(!$("xp-editor").hidden&&family===2)search($("xp-substance").value);}).catch(()=>{});
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
fetch("./research-data/r13_exposures.json").then(r=>r.json()).then(d=>{registre=d.substances;render();}).catch(()=>{});
loadReferences().then(()=>initialiserAssistant({
 produits:products,
 definirProfil(p){
  if(p.sexe){sex=p.sexe;for(const b of $("sex-choice").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.sex===sex));}
  if(p.age)$("xp-age").value=p.age;if(p.poids)$("xp-weight").value=p.poids;if(p.taille)$("xp-height").value=p.taille;
  render();
 },
 definirSymptomes(liste){symptomes=liste;render();},
 appliquer(prises){
  // Une relecture remplace les prises du récit, tout en conservant les saisies manuelles.
  for(let i=rows.length-1;i>=0;i--)if(rows[i].origine==="recit")rows.splice(i,1);
  for(const {produit,row} of prises){if(!lookup(produit.id))index(produit);rows.push({...row,origine:"recit"});}
  if(prises.length){
   const fin=Math.max(...prises.map(p=>p.row.end));$("xp-duration").value=$("xp-day").max=String(Math.max(fin,...rows.map(r=>Math.min(730,r.end))));
   $("xp-day").value=String(fin-1);
   $("xp-measure").value=prises.some(p=>p.row.abv!=null)?"ethanolMl":prises.some(p=>p.produit.id==="cafeine")?"caffeineMg":"prise";
   $("xp-cumul").checked=fin>1;
  }
  renderList();render();
 },
 restaurer(parametres){
  if(!parametres||!Array.isArray(parametres.prises))throw Error("Scénario illisible.");
  const nouvelles=[];
  for(const r of parametres.prises){
   if(!r.id||!Number.isFinite(r.qty)||!Number.isFinite(r.after)||![r.start,r.reduce,r.end].every(Number.isInteger)||r.start<0||r.reduce<r.start||r.end<r.reduce||r.end<=r.start||r.end>731||r.qty<=0||r.after<0||r.after>r.qty)throw Error("Les dates ou quantités enregistrées sont incomplètes.");
   if(!lookup(r.id)){
    if(!r.nom||!r.unite)throw Error("La référence manque dans le scénario sauvegardé.");
    index({id:r.id,name:r.nom,unit:r.unite,family:r.famille??(r.unite==="mL"?4:3),source:"Référence du scénario enregistré"});
   }
   nouvelles.push({...r,origine:"projet"});
  }
  stop();closeEditor();rows.splice(0,rows.length,...nouvelles);
  const horizon=Math.max(1,Math.min(730,Number(parametres.duree)||28));$("xp-duration").value=$("xp-day").max=horizon;
  for(const [champ,cle] of [["age","age"],["weight","poids"],["height","taille"]])if(parametres[cle]!=null)$("xp-"+champ).value=parametres[cle];
  sex=parametres.sexe==="female"?"female":"male";for(const b of $("sex-choice").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.sex===sex));
  renderList();setDay(Math.min(horizon,Math.max(0,Number(parametres.jour)||0)));
 },
 proposer(produit,prise){
  if(!lookup(produit.id))index(produit);
  const i=prise?rows.findIndex(r=>r.origine==="recit"&&r.id===produit.id&&r.qty===prise.qty):-1;
  family=produit.family;openEditor(i<0?null:i);search(produit.id);
  $("xp-editor").scrollIntoView({block:"nearest"});
 },
 bilan(){return [$("xp-totals").textContent,...evaluateDay(rows,day(),Number($("xp-age").value),lookup).signals.map(s=>s.reason)].filter(Boolean).join(" ");},
 scenario(){
  const resultat=evaluateDay(rows,day(),Number($("xp-age").value),lookup);
  return {parametres:{jour:day(),duree:duration(),sexe:sex,age:$("xp-age").value,poids:$("xp-weight").value,taille:$("xp-height").value,
   prises:rows.map(r=>({...r,nom:lookup(r.id).name,unite:lookup(r.id).unit,famille:lookup(r.id).family}))},
   resultats:{apports:Object.fromEntries([...resultat.available].map(k=>[k,resultat.totals[k]])),reperes:resultat.signals}};
 }
}));

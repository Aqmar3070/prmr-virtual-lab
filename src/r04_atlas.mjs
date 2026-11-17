// PRMR-R04 — Integrated scientific workbench, replacing external animal photos / poster galleries.
// All six animal assets are standalone SVG illustrations; no poster cropping and no embedded text.
// Scientific values remain live HTML/SVG outputs, never inferred from artwork.
import {SPECIES_R04,MOLECULES_R04,OPTIONS,DEFAULT_R04,computeR04} from "./r04_engine.mjs";
import {create3D} from "./r04_visuals.mjs";
import {createAnatomyViewer,ORGAN_MODES} from "./r08_anatomy.mjs?v=r08-anatomy-polish-20261117";
export const ANIMAL_ART=Object.fromEntries(SPECIES_R04.map(species=>[species.id,"./assets/animals/"+species.id+".svg"]));
const $=id=>document.getElementById(id);
const n=(tag,txt,cls)=>{let x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
const num=(v,d=2)=>Number(v).toLocaleString("fr-FR",{maximumFractionDigits:d,minimumFractionDigits:d});
const MASS=v=>v<1?num(v*1000,0)+" g":num(v,2)+" kg";
const LABS={
 mouse:{title:"Modèle mécanistique",remark:"Génétique et mécanismes rénaux : un rein unipapillaire, pas un modèle humain miniaturisé",terms:["Modèles génétiques","Mesures de fibrose","Différences métaboliques"],palette:"teal"},
 rat:{title:"Physiologie longitudinale",remark:"Mesures rénales et hémodynamiques ; la PK reste spécifique du rat",terms:["Suivi de la fonction","Pression & perfusion","Transporteurs"],palette:"blue"},
 pig:{title:"Anatomie translationnelle",remark:"Rein multipapillaire, architecture plus comparable à l’humain ; PK du triple inconnue",terms:["Rein multipapillaire","Perfusion & imagerie","Mesures translationnelles"],palette:"pink"},
 dog:{title:"Toxicologie non-rongeur",remark:"Intérêt de certaines mesures de tolérance, mais physiologie non interchangeable",terms:["Exposition systémique","Toxicité d’organe","Choix justifié"],palette:"gold"},
 nhp:{title:"Pertinence ciblée",remark:"Certaines cibles proches de l’humain ; justification scientifique et éthique exceptionnelle",terms:["Cibles spécialisées","Alternatives prioritaires","Éthique renforcée"],palette:"purple"},
 rabbit:{title:"Modèle complémentaire",remark:"Alternative pour une question ciblée ; aucune supériorité universelle",terms:["Physiologie distincte","Critères spécifiques","Alternatives 3R"],palette:"rose"}
};
const REGIMEN_LABEL={"R02-DUO":"Irbesartan + Dapagliflozine","R02-A":"Doublet + Pirfénidone","R02-B":"Doublet + Pentoxifylline"};
function make(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function atomFetch(){
 return fetch("./research-data/r04_molecular_3d.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Structures moléculaires indisponibles");return r.json()});
}
function compactSelect(id,caption,choices,current,onChange){
 const lab=make("label","r4-st-control");
 const small=make("span",null,caption);
 const sel=make("select");sel.id=id;
 for(const [value,text] of Object.entries(choices)){
  const opt=make("option",null,text);opt.value=value;sel.append(opt)
 }
 sel.value=current;sel.addEventListener("change",()=>onChange(sel.value));lab.append(small,sel);return lab;
}
function statCard(label,value,suffix){
 const card=make("div","r4-st-stat");card.append(make("span",null,label),make("strong",null,value),make("small",null,suffix));return card;
}
function drawTrend(svg,result){
 const sets=result.regimens.map((r,i)=>({id:r.id,y:r.renal?.median||0,color:["#5feacb","#ffc184","#fe8893"][i]}));
 const m=Math.max(2,...sets.map(x=>x.y))*1.18;
 const width=640,height=220,pad=58,base=166;
 svg.setAttribute("viewBox","0 0 640 220");svg.setAttribute("role","img");svg.setAttribute("aria-label","Indicateurs conditionnels d'exposition AUC de trois analytes différents, non toxicité");
 let a='<title>Expositions relatives sous un modèle de sensibilité non calibré</title>';
 for(let k=0;k<=4;k++){const y=base-k*35;const val=m*k/4;
  a+='<line x1="56" x2="605" y1="'+y+'" y2="'+y+'" stroke="#2b6c75" stroke-width=".8"/><text x="47" y="'+(y+4)+'" font-size="11" fill="#c0dce0" text-anchor="end">'+num(val,1)+'×</text>'
 }
 sets.forEach((x,i)=>{
  const left=95+i*170,h=x.y/m*139;
  a+='<rect x="'+left+'" y="'+(base-h)+'" width="91" height="'+h+'" rx="8" fill="'+x.color+'"/><text x="'+(left+45)+'" y="'+Math.max(base-h-11,14)+'" fill="#f1fffc" font-size="15" font-weight="800" text-anchor="middle">'+num(x.y)+'×</text><text x="'+(left+45)+'" y="190" fill="#bfe8e6" text-anchor="middle" font-size="12">'+x.id+'</text>';
 });
 a+='<text x="330" y="213" fill="#95bcc6" font-size="11" text-anchor="middle">Marqueurs distincts — les hauteurs ne sont pas des risques comparables</text>';
 svg.innerHTML=a;
}
export function createVisualAtlas({onChoose,getResult,onEdit=null,onOrganChange=null,hostId="r4-visual-atlas",compact=false}){
 const root=$(hostId);if(!root)throw Error("Conteneur de laboratoire absent : "+hostId);
 let last=null,animal=null,renal=null,molecules=[],activeMol="irbesartan",initializing=false;
 const choose=id=>onChoose(id);
 root.replaceChildren();
 const shell=make("div","r4-st-workbench"+(compact?" r4-st-home":""));
 const heading=make("div","r4-st-heading");
 const title=make("div");title.append(make("span","r4-st-eyebrow","PRMR · RECHERCHE RÉNALE / WORKBENCH R04"),make("h2",null,"Un modèle vivant. Une étude transparente."));
 const kicker=make("span","r4-st-verification","CALCULS IN SILICO · NON VALIDÉS BIOLOGIQUEMENT");
 heading.append(title,kicker);shell.append(heading);
 const chooser=make("div","r4-st-species");
 chooser.setAttribute("role","group");chooser.setAttribute("aria-label","Sélectionnez une espèce pour recalculer son profil");
 for(const sp of SPECIES_R04){
  const btn=make("button","r4-st-species-card");btn.type="button";btn.dataset.stageSpecies=sp.id;
  const art=make("div","r4-st-art");art.dataset.species=sp.id;
  const picture=make("img","r5-animal-asset");
  picture.src="./assets/animals-photo/"+sp.id+".webp";
  picture.addEventListener("error",()=>{picture.onerror=null;picture.src="./assets/animals/"+sp.id+".svg"},{once:true});
  picture.alt="Texture réaliste de "+sp.label+" ; représentation artistique, non anatomique";picture.loading="lazy";
  picture.width=840;picture.height=560;art.append(picture);
  const caption=make("span");caption.append(make("strong",null,sp.label),make("small",null,sp.latin));
  btn.append(art,caption);btn.addEventListener("click",()=>choose(sp.id));chooser.append(btn)
 }
 shell.append(chooser);
 const stats=make("div","r4-st-stats");
 stats.append(statCard("ARCHITECTURE","Rein","Comparaison anatomique"),
 statCard("AXES MOLÉCULAIRES","3 régimes","Hypothèses R02"),
 statCard("TECHNOLOGIE","3D interactive","RDKit + organes conceptuels"),
 statCard("TOXICITÉ / GUÉRISON","Indéterminées","Aucune probabilité calculée"));shell.append(stats);
 const grid=make("div","r4-st-main-grid");shell.append(grid);
 const large=make("div","r4-st-panel r4-st-profile");grid.append(large);
 const largeTop=make("div","r4-st-paneltop");
 largeTop.append(make("h3",null,"Profil de l’espèce — paramètres modifiables"),make("span","r4-st-chip","Espèce sélectionnée"));
 large.append(largeTop);
 const profileGrid=make("div","r4-st-profile-body");large.append(profileGrid);
 const portraitPanel=make("div","r5-animal-profile-panel");
 const portrait=make("div","r4-st-portrait");portrait.dataset.species="mouse";portrait.dataset.mode="anatomy";portrait.classList.add("r5-webgl-active");
 // Canvas2D anatomy replaces the previous GLB viewer. SVG fallback prevents a blank box.
 const fallbackSvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 fallbackSvg.setAttribute("class","r8-anatomy-fallback");
 fallbackSvg.setAttribute("viewBox","0 0 480 300");
 fallbackSvg.setAttribute("role","img");
 fallbackSvg.setAttribute("aria-label","Silhouette transparente schématique avec reins, cœur et foie");
 fallbackSvg.innerHTML='<g fill="none" stroke="#55cfe3" stroke-width="2.4" opacity=".72"><ellipse cx="256" cy="155" rx="141" ry="67"/><ellipse cx="105" cy="139" rx="48" ry="42"/><path d="M147 148 Q167 132 174 113 M177 203 L171 264 M331 205 L337 263 M392 154 Q427 137 443 171"/><path d="M118 154 Q240 83 376 156 M121 164 Q245 214 389 158"/></g><g fill="#4bd6b8" stroke="#c4fff0" stroke-width="2"><ellipse cx="284" cy="169" rx="18" ry="23"/><ellipse cx="332" cy="169" rx="18" ry="23"/></g><path d="M210 130 C183 98 170 135 210 166 C251 130 236 98 210 130Z" fill="#ff728b"/><ellipse cx="257" cy="181" rx="37" ry="20" fill="#edb36c" opacity=".75"/>';
 portrait.append(fallbackSvg);
 const animalCanvas=make("canvas","r5-animal-sculpture r8-anatomy-canvas");
 animalCanvas.setAttribute("aria-label","Atlas anatomique 3D transparent : silhouette filaire et organes internes ; flèches pour orienter, molette pour agrandir");
 portrait.append(animalCanvas);
 const sceneLabel=make("span","r5-scene-hint","MAILLAGE TRANSPARENT · GLISSER POUR ORIENTER · MOLETTE POUR ZOOMER");
 portrait.append(sceneLabel);
 let anatomy=null,organFocus="kidneys";
 const organToolbar=make("div","r8-organ-switch");
 organToolbar.setAttribute("role","group");organToolbar.setAttribute("aria-label","Organe interne à mettre en évidence");
 const organButtons={};
 const organDescription=make("p","r8-anatomy-note","Reins bilatéraux : repères schématiques à l'intérieur du corps transparent. Proportions non calibrées.");
 const organCopy={
  kidneys:"Reins bilatéraux et trajets urinaires indicatifs. Aucune lésion ou toxicité n'est visualisée.",
  heart:"Cœur : position conceptuelle mise en évidence dans le thorax. Pas d'imagerie cardiaque.",
  liver:"Foie : volume indicatif au sein du tronc, sans mesure biologique.",
  lungs:"Poumons : deux volumes thoraciques simplifiés, sans exploration respiratoire réelle.",
  all:"Reins, cœur, foie et poumons simultanément. Positions et proportions approximatives."
 };
 for(const [id,details] of Object.entries(ORGAN_MODES)){
  const button=make("button","r8-organ-button",details.label);button.type="button";
  button.dataset.organ=id;button.setAttribute("aria-pressed",String(id==="kidneys"));
  button.style.setProperty("--r8-organ-accent",details.color);
  button.addEventListener("click",()=>{
   organFocus=id;root.dataset.focusOrgan=id;
   for(const [key,b] of Object.entries(organButtons))b.setAttribute("aria-pressed",String(key===id));
   organDescription.textContent=organCopy[id];
   anatomy?.setOrgan(id);
   onOrganChange?.(id);
  });
  organButtons[id]=button;organToolbar.append(button);
 }
 portrait.dataset.mode="anatomy";root.dataset.focusOrgan="kidneys";
 const portraitOverlay=make("div","r4-st-portrait-label");portraitOverlay.append(make("strong","r4-st-species-name","Souris"),make("small","r4-st-latin","Mus musculus"));
 portraitPanel.append(portrait,organToolbar,organDescription,portraitOverlay);profileGrid.append(portraitPanel);
 const info=make("div","r4-st-props");profileGrid.append(info);
 const decision=make("div","r4-st-insight");decision.append(make("span",null,"AXE SCIENTIFIQUE"),make("strong","r4-st-decision","Approche mécanistique"),make("p","r4-st-remark","La réponse dépend de l'espèce et de la maladie."));
 info.append(decision);
 const meta=make("div","r4-st-annotations");info.append(meta);
 const controls=make("div","r4-st-mini-controls");
 const selections={};
 function setControls(result){
  for(const [id,sel] of Object.entries(selections))if(sel.value!==result.inputs[id])sel.value=result.inputs[id];
 }
 for(const [key,label] of [["age","Âge"],["sex","Sexe"],["disease","Maladie"],["renal","État rénal"]]){
  const labelElem=compactSelect("r4-stage-"+key+"-"+hostId,label,OPTIONS[key],getResult().inputs[key],value=>{
   if(onEdit)onEdit({[key]:value});
   else {const inp={...getResult().inputs,[key]:value};render(computeR04(inp))}
  });
  selections[key]=labelElem.querySelector("select");
  controls.append(labelElem);
 }
 info.append(controls);
 // Advanced experimental variables remain connected to exactly the same R04 state.
 const advanced=make("details","r5-advanced-controls");
 const advancedTitle=make("summary",null,"Paramètres avancés : masse, constitution, foie, hydratation, association et cible");
 advanced.append(advancedTitle);
 const advanceFields=make("div","r4-st-mini-controls r5-advanced-grid");
 const r05Regimens={"R02-DUO":"Irbesartan + Dapagliflozine","R02-A":"Doublet + Pirfénidone","R02-B":"Doublet + Pentoxifylline"};
 for(const [key,label,options] of [["constitution","Constitution",OPTIONS.constitution],["hepatic","Fonction hépatique",OPTIONS.hepatic],["hydration","Hydratation",OPTIONS.hydration],["regimen","Association",r05Regimens]]){
  const lab=compactSelect("r5-"+key+"-"+hostId,label,options,getResult().inputs[key],value=>{
   if(onEdit)onEdit({[key]:value});else render(computeR04({...getResult().inputs,[key]:value}))
  });
  selections[key]=lab.querySelector("select");advanceFields.append(lab)
 }
 const makeRange=(key,label)=>{
  const wrap=make("label","r4-st-control r5-range-control");
  const title=make("span",null,label),value=make("strong","r5-range-value","—");
  const range=make("input");range.type="range";range.id="r5-"+key+"-"+hostId;
  range.addEventListener("input",()=>{
   const number=Number(range.value);
   if(onEdit)onEdit({[key]:number});else render(computeR04({...getResult().inputs,[key]:number}))
  });
  wrap.append(title,value,range);advanceFields.append(wrap);
  return {range,value}
 };
 const massControl=makeRange("mass_kg","Masse corporelle");
 const freeControl=makeRange("free_nM","Concentration libre de référence, illustrative");
 const disclaimer=make("p","r5-advanced-disclaimer","Âge, sexe et constitution : aucune variation numérique de toxicité n’est produite sans données calibrées par espèce. Seuls les paramètres réellement pris en charge changent les chiffres.");
 advanceFields.append(disclaimer);
 advanced.append(advanceFields);info.append(advanced);
 const right=make("div","r4-st-panel r4-st-organ");grid.append(right);
 const organTop=make("div","r4-st-paneltop");organTop.append(make("h3",null,"Rein / système physiologique"),make("span","r4-st-chip","ROTATION 3D · DRAG"));
 right.append(organTop);
 const organWrap=make("div","r4-st-organbox");
 const organCanvas=make("canvas");organCanvas.setAttribute("aria-label","Rein conceptuel en 3D, faire pivoter au toucher ou avec le pointeur");organWrap.append(organCanvas);
 const organsNotice=make("div","r4-st-3d-label","Vue pédagogique, non issue d'une imagerie réelle");organWrap.append(organsNotice);right.append(organWrap);
 const renalNote=make("div","r4-st-renal-note");renalNote.append(make("strong",null,"Structure rénale"),make("p","r4-st-renal-details","Comparaison anatomique"));right.append(renalNote);
 const callouts=make("div","r4-st-notes");right.append(callouts);
 const panels=make("div","r4-st-bottom-grid");shell.append(panels);
 const pk=make("section","r4-st-panel r4-st-kinetics");pk.append(make("h3",null,"Expositions PK · évolution du scénario"),make("p",null,"Rapports relatifs issus d'un transfert exploratoire d'AUC humaines ; chaque barre représente un analyte différent."));
 const chart=document.createElementNS("http://www.w3.org/2000/svg","svg");chart.classList.add("r4-st-chart");pk.append(chart);
 const ratio=make("div","r4-st-current-ratio");pk.append(ratio);panels.append(pk);
 const pd=make("section","r4-st-panel r4-st-pharmacology");pd.append(make("h3",null,"Pharmacodynamie / pertinence"));
 const pdVal=make("div","r4-st-pd-value");pd.append(pdVal);
 const marker=make("p","r4-st-target","Cible biologique à confirmer");pd.append(marker);
 const tr=make("div","r4-st-true-note","Ce panneau n'est pas un résultat de guérison.");pd.append(tr);panels.append(pd);
 const moleculePanel=make("section","r4-st-panel r4-st-molecules");
 const moleculesTop=make("div","r4-st-paneltop");moleculesTop.append(make("h3",null,"Molécules — conformères 3D manipulables"),make("span","r4-st-chip","STRUCTURES RDKit"));
 moleculePanel.append(moleculesTop);
 const deck=make("div","r4-st-molecule-grid");moleculePanel.append(deck);
 for(const mol of MOLECULES_R04){
  const btn=make("button","r4-st-molecule-card");btn.dataset.stageMol=mol.id;btn.type="button";
  const canvas=make("canvas");canvas.setAttribute("aria-label","Molécule "+mol.name+" en trois dimensions, orientation manipulable");
  btn.append(canvas,make("strong",null,mol.name),make("small",null,mol.axis));
  btn.addEventListener("click",()=>{activeMol=mol.id;for(const b of deck.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.stageMol===mol.id));});
  btn.setAttribute("aria-pressed",String(activeMol===mol.id));deck.append(btn);
 }
 const citations=make("div","r4-st-safety-caption",
  "Molécules : conformères RDKit. Animaux : vues 3D pédagogiques filaires avec organes internes schématiques, sans atlas anatomique validé ni imagerie réelle. Les images ne prouvent ni toxicité ni guérison.");
 moleculePanel.append(citations);shell.append(moleculePanel);
 root.append(shell);
 renal=create3D(organCanvas,{kind:"kidney"});
 anatomy=createAnatomyViewer(animalCanvas,{species:"mouse",organ:"kidneys",
  onRender:({species,organ,count})=>{
   portrait.dataset.mode="anatomy";portrait.dataset.rendered=String(count);
   sceneLabel.textContent="ATLAS FILAIRE · "+ORGAN_MODES[organ].label.toUpperCase()+" · ROTATION / ZOOM · ANATOMIE SCHÉMATIQUE";
  }
 });
 if(!anatomy.supported){
  portrait.dataset.mode="static";
  sceneLabel.textContent="Schéma anatomique fixe · affichage 3D indisponible";
 }
 atomFetch().then(data=>{
  if(!root.isConnected)return;
  for(const mol of MOLECULES_R04){
   const con=data[mol.id],btn=deck.querySelector('[data-stage-mol="'+mol.id+'"]');
   if(con&&btn){const viewer=create3D(btn.querySelector("canvas"),{kind:"molecule",model:con});molecules.push(viewer)}
  }
 }).catch(e=>{citations.textContent="Visualisation 3D moléculaire indisponible : "+e.message});
 function render(result){
  if(!result)return;
  last=result;const id=result.species.id,metaData=LABS[id];
  portrait.dataset.species=id;
  anatomy.set({species:id,organ:organFocus});
  portraitOverlay.querySelector("strong").textContent=result.species.label;
  portraitOverlay.querySelector("small").textContent=result.species.latin+" · "+MASS(result.inputs.mass_kg);
  for(const btn of chooser.querySelectorAll("button"))btn.setAttribute("aria-pressed",String(btn.dataset.stageSpecies===id));
  decision.querySelector("strong").textContent=metaData.title;
  decision.querySelector("p").textContent=metaData.remark;
  meta.replaceChildren();
  const labels=[
   ["Maladie",OPTIONS.disease[result.inputs.disease]],
   ["Sexe",OPTIONS.sex[result.inputs.sex]],
   ["Âge",OPTIONS.age[result.inputs.age]],
   ["Masse",MASS(result.inputs.mass_kg)],
   ["État rénal",OPTIONS.renal[result.inputs.renal]],
   ["État hépatique",OPTIONS.hepatic[result.inputs.hepatic]]
  ];
  for(const [a,b] of labels){const row=make("div","r4-st-field");row.append(make("span",null,a),make("strong",null,b));meta.append(row)}
  setControls(result);
  const sp=result.species;
  massControl.range.min=String(sp.min_kg);massControl.range.max=String(sp.max_kg);
  massControl.range.step=sp.ref_kg<.1?"0.001":sp.ref_kg<1?"0.005":"0.1";
  massControl.range.value=String(result.inputs.mass_kg);
  massControl.value.textContent=MASS(result.inputs.mass_kg);
  freeControl.range.min="0";freeControl.range.max="10";freeControl.range.step="0.25";
  freeControl.range.value=String(result.inputs.free_nM);
  freeControl.value.textContent=num(result.inputs.free_nM,2)+" nM";
  renalNote.querySelector("p").textContent=result.species.anatomy+" · "+result.species.focus;
  callouts.replaceChildren();
  for(const item of metaData.terms){const span=make("div",null,item);callouts.append(span)}
  drawTrend(chart,result);
  ratio.textContent="Association "+result.active.id+" · marqueur rénal : ×"+num(result.active.renal.median)+" (stress-test, pas toxicité)";
  if(result.sglt2_occupancy===null){
   pdVal.textContent="Cible non calibrée";
   marker.textContent="Aucune IC50 SGLT2 pour "+result.species.label+" dans le jeu PRMR : aucune inhibition inventée.";
  }else{
   pdVal.textContent=num(100*result.sglt2_occupancy,1)+" %";
   marker.textContent="Inhibition SGLT2 théorique à "+num(result.inputs.free_nM,2)+" nM libres, pas une mesure de protection du rein.";
  }
  tr.textContent="Bénéfice net : indéterminé. "+result.indication.markers+". Pas de dose–lésion calibrée.";
 }
 render(getResult());
 return {render,destroy(){anatomy?.destroy();renal?.destroy();for(const viewer of molecules)viewer.destroy();root.replaceChildren()},get current(){return last},setOrgan(id){if(organButtons[id])organButtons[id].click()}};
}

// R04 visual atlas — high-contrast illustrated species cards, linked to existing live model.
import {SPECIES_R04,OPTIONS} from "./r04_engine.mjs";
const LABELS={
 mouse:{architecture:["Différente","limited"],experimental:["Mécanismes","strong"],ethics:["Encadrement","medium"]},
 rat:{architecture:["Différente","limited"],experimental:["Physiologie","strong"],ethics:["Encadrement","medium"]},
 pig:{architecture:["Proche sur la structure","strong"],experimental:["Procédures ciblées","medium"],ethics:["Exigence importante","strong"]},
 dog:{architecture:["Différente","limited"],experimental:["Toxicologie ciblée","medium"],ethics:["Exigence importante","strong"]},
 nhp:{architecture:["Proche sur certains aspects","strong"],experimental:["Usage exceptionnel","limited"],ethics:["Exigence majeure","strong"]},
 rabbit:{architecture:["Variable selon la question","medium"],experimental:["Usage ciblé","medium"],ethics:["Encadrement","medium"]}
};
const WIDTHS={limited:27,medium:56,strong:86,none:0};
const ORIGINAL_POSTERS={
 mouse:"comparaison-especes.png",
 rat:"comparaison-especes.png",
 pig:"porc.png",
 dog:"chien.png",
 nhp:"primate.png",
 rabbit:"lapin.png"
};
const POSTER_DIR="./assets/illustrations/r04/";
function attachOriginalPoster(wrap,speciesId){
 const filename=ORIGINAL_POSTERS[speciesId];
 if(!filename)return;
 const url=POSTER_DIR+filename;
 const section=node("section",undefined,"r4-original-poster");
 section.setAttribute("aria-label","Illustration PRMR originale de l'espèce");
 section.hidden=true;
 const heading=node("div",undefined,"r4-original-poster-header");
 const label=node("div");
 label.append(node("strong","Illustration PRMR — maquette originale"),node("small","Image exacte lorsque le PNG est présent dans le dépôt"));
 const link=node("a","Voir en plein écran");
 link.href=url;link.target="_blank";link.rel="noopener noreferrer";
 heading.append(label,link);
 const image=node("img");
 image.alt="Maquette graphique originale PRMR — "+speciesId+". Image éducative et illustrative, sans résultats expérimentaux.";
 image.loading="eager";image.decoding="async";
 image.addEventListener("load",()=>{section.hidden=false});
 image.addEventListener("error",()=>{section.remove()});
 image.src=url;
 const warning=node("p","IMPORTANT : les valeurs et barres affichées dans cette image sont des illustrations graphiques, non des mesures ou scores scientifiques. Pour les analyses, utiliser les résultats du simulateur interactif ci-dessous.","r4-original-poster-warning");
 section.append(heading,image,warning);
 const anchor=wrap.querySelector(".r4-atlas-main-grid");
 if(anchor)wrap.insertBefore(section,anchor);
 else wrap.append(section);
}

const EFFECT={
 mouse:["Génétique","Modèles de maladie rénale","Transporteurs et métabolisme non identiques à l'humain"],
 rat:["Physiologie","Hémodynamique et suivi longitudinal","Métabolisme et architecture spécifiques au rat"],
 pig:["Anatomie","Rein multipapillaire et calices","Perfusion, imagerie et procédures translationnelles"],
 dog:["Toxicologie","Modèle non-rongeur si indispensable","Rein unipapillaire et métabolisme non universel"],
 nhp:["Spécificité","Cibles propres aux primates","Éthique renforcée et priorité aux alternatives"],
 rabbit:["Alternative","Études mécanistiques ciblées","Physiologie et excrétion propres à l'espèce"]
};
const $=id=>document.getElementById(id);
function node(tag,txt,cls){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n}
function makeKidneys(sp){
 const many=sp.id==="pig"||sp.id==="nhp";
 const branch=many?
 '<path d="M58 139 L78 117 L87 82 M58 139 L65 109 L48 72 M58 139 L40 112 L29 87 M58 139 L74 154 L89 168" stroke="#ffc28c" stroke-width="8" fill="none" stroke-linecap="round"/>'+
 '<path d="M58 139 L78 117 L87 82 M58 139 L65 109 L48 72 M58 139 L40 112 L29 87" stroke="#fff8d1" stroke-width="2" fill="none" stroke-linecap="round"/>':
 '<path d="M58 139 Q77 113 68 84 M58 139 Q50 117 43 98" stroke="#ffbb8b" stroke-width="11" fill="none" stroke-linecap="round"/>'+
 '<path d="M58 139 Q77 113 68 84 M58 139 Q50 117 43 98" stroke="#fff1c9" stroke-width="2" fill="none" stroke-linecap="round"/>';
 const kidneyShape='<path d="M80 30 C21 10 -4 48 12 113 C20 157 34 175 52 183 C77 192 88 168 74 151 C62 137 72 124 86 124 C111 125 121 74 99 45 C94 39 87 34 80 30Z" fill="url(#r4Organ)" stroke="#ff8c9e" stroke-width="3"/>';
 const renalArt=kidneyShape+'<path d="M75 42 C29 24 12 54 22 109 C26 133 41 162 51 167 C60 168 68 155 61 143 C55 122 74 110 83 104 C99 90 94 51 75 42Z" fill="none" stroke="#ffc9a2" opacity=".7" stroke-width="4"/>'+branch+
 '<path d="M61 140 C80 133 100 138 114 129" stroke="#42c1fa" fill="none" stroke-width="8"/><path d="M59 147 C84 153 104 155 116 145" stroke="#fe676c" fill="none" stroke-width="7"/>';
 const art='<g transform="translate(63 9) scale(1.00)">'+renalArt+'</g>';
 const human='<g transform="translate(334 14) scale(.96)">'+
 kidneyShape+'<path d="M58 139 L75 115 L82 83 M58 139 L47 102 L33 75 M58 139 L73 160" stroke="#ffdc9c" stroke-width="7" fill="none" stroke-linecap="round"/>'+
 '<path d="M61 140 L117 128" stroke="#41c3ef" stroke-width="7"/><path d="M60 148 L115 143" stroke="#ff7277" stroke-width="7"/></g>';
 return '<svg viewBox="0 0 535 218" role="img" aria-label="Schéma éducatif du rein '+sp.label+' comparé à un rein humain, non issu d’une imagerie médicale">'+
 '<defs><radialGradient id="r4Organ" cx="35%" cy="35%" r="75%"><stop stop-color="#ffbca9"/><stop offset=".28" stop-color="#e26c80"/><stop offset=".75" stop-color="#7d385e"/><stop offset="1" stop-color="#351a38"/></radialGradient></defs>'+
 art+human+
 '<path d="M266 118 L317 118" stroke="#72f6ea" stroke-width="3"/><path d="M272 112 L265 118 L272 124 M310 112 L317 118 L310 124" fill="none" stroke="#72f6ea" stroke-width="3"/>'+
 '<text x="144" y="209" font-size="13" font-weight="700" fill="#d4fef4" text-anchor="middle">Rein : '+sp.label+'</text>'+
 '<text x="413" y="209" font-size="13" font-weight="700" fill="#d4fef4" text-anchor="middle">Rein humain</text>'+
 '</svg>';
}
function addBar(container,label,value,level){
 const item=node("div",undefined,"r4-atlas-meta-row");
 const head=node("div",undefined,"r4-atlas-meta-row-label");
 head.append(node("span",label),node("strong",value));
 const bar=node("div",undefined,"r4-atlas-meta-row-track");
 const fill=node("span");fill.style.width=String(WIDTHS[level]??0)+"%";
 if(level==="none")fill.style.background="#798e9d";
 bar.append(fill);item.append(head,bar);container.append(item);
}
function makeDOM(container,profile,onChoose){
 container.replaceChildren();
 const wrap=node("div",undefined,"r4-atlas-wrap");container.append(wrap);
 const top=node("div",undefined,"r4-atlas-top");
 top.append(node("div","ATLAS VISUEL PRMR-R04 · 6 ESPÈCES","r4-atlas-brand"),node("span","Profils documentaires et modèles éducatifs","r4-tag"));wrap.append(top);
 const heading=node("h2","Comparaison animale · "+profile.name,"r4-atlas-heading");heading.id="r4-atlas-heading";wrap.append(heading);
 const sub=node("p","Photographies réelles sourcées · schémas rénaux conceptuels · calculs R04 manipulables ci-dessous","r4-atlas-subtitle");wrap.append(sub);
 const selector=node("div",undefined,"r4-atlas-species-strip");selector.id="r4-atlas-strip";
 for(const s of SPECIES_R04){
  const doc=profile.all[s.id];
  const btn=node("button",undefined,"r4-atlas-species-button");btn.type="button";btn.dataset.species=s.id;
  const img=node("img");img.src=doc.src;img.alt="Portrait "+s.label;img.loading="lazy";
  img.onerror=()=>{img.style.display="none"};
  const text=node("div");text.append(node("b",s.label),node("small",s.latin));
  btn.append(img,text);btn.setAttribute("aria-pressed",String(s.id===profile.sp.id));
  btn.addEventListener("click",()=>onChoose(s.id));
  selector.append(btn);
 }
 wrap.append(selector);
 const kpis=node("div",undefined,"r4-atlas-kpis");
 for(const [a,b] of [["Espèce étudiée",profile.name],["Architecture rénale",profile.anatomySummary],["Domaine expérimental",profile.sp.focus.split(",")[0]],["Validité PK/PD du triple","Non mesurée"]]){
  const c=node("div",undefined,"r4-atlas-kpi");c.append(node("small",a),node("b",b));kpis.append(c)
 }
 wrap.append(kpis);
 if(!document.getElementById("r4-original-gallery"))attachOriginalPoster(wrap,profile.sp.id);
 const grid=node("div",undefined,"r4-atlas-main-grid");wrap.append(grid);
 const left=node("article",undefined,"r4-atlas-pane");grid.append(left);
 left.append(node("h3","Profil visuel — "+profile.name),node("p","Anatomie · pertinence expérimentale · contraintes de transposition"));
 const leftgrid=node("div",undefined,"r4-atlas-left");left.append(leftgrid);
 const figure=node("div",undefined,"r4-atlas-portrait");
 const big=node("img");big.src=profile.src;big.alt="Photo : "+profile.name+", auteur "+profile.credit;big.loading="eager";
 big.onerror=()=>{big.style.display="none";figure.style.background="linear-gradient(150deg,#174a62,#071e2f)"};
 figure.append(big,node("div",profile.sp.label+" · "+profile.sp.latin));
 leftgrid.append(figure);
 const bars=node("div",undefined,"r4-atlas-meta-rows");leftgrid.append(bars);
 const levels=LABELS[profile.sp.id];
 addBar(bars,"Structure du rein",...levels.architecture);
 addBar(bars,"Modèle expérimental",...levels.experimental);
 addBar(bars,"PK triple dans PRMR","Non mesurée","none");
 addBar(bars,"Exigences éthiques",...levels.ethics);
 bars.append(node("div","Barres qualitatives de présentation : catégories éditoriales, sans score numérique ni probabilité biologique.","r4-atlas-meta-disclaimer"));
 const right=node("article",undefined,"r4-atlas-pane");grid.append(right);
 const insight=node("div",undefined,"r4-atlas-insight");insight.append(node("strong","Ce qui change avec l'espèce"),node("p",profile.sp.anatomy+". "+profile.note+"."));right.append(insight);
 right.append(node("h3","Visualisation anatomique comparative"));
 const renal=node("div",undefined,"r4-atlas-kidney");renal.innerHTML=makeKidneys(profile.sp);
 const cap=node("span",profile.sp.id==="pig"?"Multipapillaire":profile.sp.anatomy,"r4-atlas-kidney-caption");renal.append(cap);right.append(renal);
 const clues=node("div",undefined,"r4-atlas-kidney-comparison");
 clues.append(node("span","Rein de "+profile.sp.label),node("span","Comparaison structurelle ≠ identité physiologique"),node("span","Modèle éducatif"));
 right.append(clues);
 const bottom=node("div",undefined,"r4-atlas-bottom");wrap.append(bottom);
 const strategy=node("article",undefined,"r4-atlas-pane");strategy.append(node("h3","Pourquoi étudier cette espèce ?"));
 const callouts=node("div",undefined,"r4-atlas-callouts");
 const facts=EFFECT[profile.sp.id];
 for(const [i,title] of ["Domaine","Intérêt","Limite"].entries()){const c=node("div",undefined,"r4-atlas-callout");c.append(node("b",title),node("span",facts[i]));callouts.append(c)}
 strategy.append(callouts);bottom.append(strategy);
 const conclusion=node("div",undefined,"r4-atlas-summary");
 conclusion.append(node("strong","À retenir"),node("p",profile.anatomy+" · "+profile.ethics+"."));
 conclusion.append(node("p","La recherche PRMR-R04 explore des scénarios, sans avoir testé physiquement ces associations sur des animaux."));
 const live=node("p","Profil en cours","r4-atlas-dynamic-physiology");live.id="r4-atlas-dynamic-physiology";conclusion.append(live);
 bottom.append(conclusion);
 const comp=node("div",undefined,"r4-atlas-complement");
 comp.append(node("span","Modifier l'âge, le sexe, le poids, la maladie ou l'état rénal dans la console R04. Les graphiques et avertissements se mettent à jour sans inventer de résultats."));
 const btn=node("button","Ouvrir les paramètres");btn.type="button";btn.addEventListener("click",()=>{
  const target=document.getElementById("parameters-heading");if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
 });comp.append(btn);wrap.append(comp);
 const attr=node("div",undefined,"r4-atlas-attribution");
 attr.append(node("span","Photographie : "+profile.credit+" ("+profile.license+") · "));
 const link=node("a","source Wikimedia Commons");link.href=profile.page;link.target="_blank";link.rel="noopener noreferrer";attr.append(link);
 attr.append(node("span"," · Illustrations rénales : créations graphiques conceptuelles, non images médicales ni photographies d'expériences."));
 wrap.append(attr);
}
export function createVisualAtlas({onChoose,getResult}){
 const host=$("r4-visual-atlas");
 if(!host)throw Error("Atlas R04 missing host");
 let images=null,latest=null,lastSpeciesId=null;
 function render(result){
  latest=result;if(!images||!result)return;
  const doc=images.sources[result.species.id];if(!doc)return;
  if(result.species.id!==lastSpeciesId||!host.firstChild){
    const profile={...doc,sp:result.species,all:images.sources,
     anatomySummary:result.species.anatomy,
     note:doc.note,anatomy:doc.anatomy,ethics:doc.ethics};
    makeDOM(host,profile,onChoose);lastSpeciesId=result.species.id;
  }
  const live=document.getElementById("r4-atlas-dynamic-physiology");
  if(live)live.textContent="Profil sélectionné : "+OPTIONS.age[result.inputs.age]+" · "+OPTIONS.sex[result.inputs.sex]+" · "+OPTIONS.constitution[result.inputs.constitution]+" · "+OPTIONS.disease[result.inputs.disease]+". Exposition tissulaire réelle et bénéfice non déterminés.";
 }
 fetch("./research-data/r04_animal_portraits.json",{cache:"force-cache"}).then(resp=>{
   if(!resp.ok)throw Error("Portrait manifest HTTP "+resp.status);
   return resp.json();
 }).then(payload=>{images=payload;render(latest||getResult())})
 .catch(error=>{host.replaceChildren(node("div","Atlas visuel indisponible : "+error.message,"r4-empty"))});
 return {render};
}

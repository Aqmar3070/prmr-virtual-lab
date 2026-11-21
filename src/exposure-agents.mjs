// Moteur dose–durée par substance active : caféine, sucres, paracétamol, ibuprofène, metformine,
// et combinaisons. Une fiche couvre tous les produits du catalogue qui contiennent la substance.
// Règle : chaque chiffre vient d'une source citée ; sans chiffre publié, le résultat le dit.
import {evaluateDay,doseAt,fold} from "./exposure-evidence.mjs";
import {DENSITE_ETHANOL,interpoler} from "./exposure-risk.mjs";

const doi=d=>"https://doi.org/"+d;
export const SOURCES_AGENTS={
 efsa:{source:"EFSA · avis scientifique sur la sécurité de la caféine, 2015",url:"https://www.efsa.europa.eu/fr/efsajournal/pub/4102"},
 efsaPortions:{source:"EFSA · portions de référence pour la caféine",url:"https://www.efsa.europa.eu/en/topics/topic/caffeine"},
 poole:{source:"Poole et coll. · BMJ 2017, revue de 218 méta-analyses sur le café",url:doi("10.1136/bmj.j5024")},
 oms:{source:"OMS · Alimentation saine (sucres libres < 10 % de l’énergie, soit 50 g)",url:"https://www.who.int/news-room/fact-sheets/detail/healthy-diet"},
 omsSucres:{source:"OMS · Guideline : sugars intake for adults and children, 2015",url:"https://www.who.int/publications/i/item/9789241549028"},
 imamura:{source:"Imamura et coll. · BMJ 2015, boissons sucrées et diabète, 17 cohortes",url:doi("10.1136/bmj.h3576")},
 ciqual:{source:"Anses · Ciqual 2025",url:"https://doi.org/10.57745/RDMHWY"},
 cnt:{source:"CNT Collaboration · Lancet 2013, 754 essais randomisés d’AINS",url:doi("10.1016/S0140-6736(13)60900-9")},
 aroda:{source:"Aroda et coll. · J Clin Endocrinol Metab 2016, DPP/DPPOS (12 ans)",url:doi("10.1210/jc.2015-3754")}
};

// ---------- Doses journalières par substance ----------
const MOLECULES={paracetamol:/\bparacetamol\b/,ibuprofene:/\bibuprofene\b/,metformine:/\bmetformine\b/};
// Teneur d'une spécialité lue dans son propre libellé (« 1000 mg »), seulement si elle n'a qu'une substance active.
export function teneurLibelle(produit){
 const actifs=[...new Set(produit.active||[])];
 if(actifs.length!==1)return null;
 const m=fold(produit.name).match(/(\d+(?:[.,]\d+)?)\s*mg\b(?!\s*\/)/);
 return m?Number(m[1].replace(",",".")):null;
}
export function moleculeDe(produit,lookup){
 const noms=[produit.id,produit.name,...(produit.active||[]).map(a=>lookup("sa"+a)?.name||"")].map(fold).join(" ");
 return Object.keys(MOLECULES).find(k=>MOLECULES[k].test(noms))||null;
}
// mg de la molécule pour une ligne de prise un jour donné ; null si la teneur est inconnue.
function mgMolecule(row,t,lookup){
 const p=lookup(row.id),q=doseAt(row,t);if(!p||!q)return 0;
 if(p.unit==="mg")return q;
 if(p.ibuMg)return q*p.ibuMg;
 const teneur=p.id.startsWith("cis")?teneurLibelle(p):null;
 return teneur?q*teneur:null;
}
export function seriesJournalieres(rows,lookup,duree,age){
 const s={cafeine:[],sucres:[],tasses:[],boissonsSucreesMl:[],alcool:[],paracetamol:[],ibuprofene:[],metformine:[],teneurInconnue:new Set()};
 for(let t=0;t<=duree;t++){
  const j=evaluateDay(rows,t,age,lookup);
  s.cafeine.push(j.available.has("caffeineMg")?j.totals.caffeineMg:0);
  s.sucres.push(j.available.has("sugarG")?j.totals.sugarG:0);
  s.alcool.push((j.available.has("ethanolG")?j.totals.ethanolG:0)+(j.available.has("ethanolMl")?j.totals.ethanolMl*DENSITE_ETHANOL:0));
  let tasses=0,sucreMl=0;const mg={paracetamol:0,ibuprofene:0,metformine:0};
  for(const r of rows){
   const p=lookup(r.id),q=doseAt(r,t);if(!p||!q)continue;
   if(r.id==="cafe")tasses+=q;
   if(p.unit==="mL"&&r.sug>0)sucreMl+=q;
   const mol=moleculeDe(p,lookup);
   if(mol){const v=mgMolecule(r,t,lookup);if(v==null)s.teneurInconnue.add(p.name);else mg[mol]+=v;}
  }
  s.tasses.push(tasses);s.boissonsSucreesMl.push(sucreMl);
  // Tasse de café filtre : 90 mg de caféine (portion de référence EFSA).
  s.cafeine[t]+=tasses*90;
  for(const k in mg)s[k].push(mg[k]);
 }
 return s;
}
const stats=serie=>{const a=serie.filter(v=>v>0);return a.length?{moyenne:a.reduce((x,y)=>x+y,0)/a.length,max:Math.max(...a),nbJours:a.length,total:a.reduce((x,y)=>x+y,0)}:null;};
const B=(rr,bas,haut)=>({rr,bas,haut});
const niveauRR=rr=>rr>=3?"eleve":rr>=1.5?"modere":"faible";
const ar=(x,d=1)=>Number(x.toFixed(d)).toLocaleString("fr-FR");
// Niveau d'un dépassement de seuil réglementaire ou toxique.
const niveauSeuil=(dose,paliers)=>{let n=null;for(const [seuil,niv] of paliers)if(dose>seuil)n=niv;return n;};

function fiche(id,titre,unite,st,equivalences,resultats,extra={}){return {id,titre,unite,...st,equivalences,resultats,...extra};}

// ---------- Caféine ----------
export function analyserCafeine(series,profil,registre){
 const st=stats(series.cafeine),tasses=stats(series.tasses);if(!st)return null;
 const mg=st?.moyenne||0,femme=profil.sexe==="female",res=[],fiche_=registre?.cafeine;
 const kg=profil.poids>0?mg/profil.poids:null;
 const portions=(fiche_?.portions||[]).slice(0,3);
 const eq=portions.map(p=>"≈ "+ar(mg/p.mg)+" "+(p.plural||p.label)+" ("+p.detail+", "+p.mg+" mg chacune · "+p.source.split(",")[0]+")");
 if(st){
  const niv=niveauSeuil(mg,[[400,"modere"]]);
  res.push({id:"cafeine_jour",titre:"Système nerveux et cœur · dose journalière",zones:niv?["brain","heart"]:[],signe:niv?-1:0,niveau:niv||"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
   constat:ar(mg,0)+" mg par jour"+(kg?" ("+ar(kg)+" mg/kg)":"")+(mg>400?" : au-dessus du repère EFSA de 400 mg/j pour un adulte en bonne santé.":" : dans le repère EFSA de 400 mg/j."),
   pourquoi:"La caféine bloque les récepteurs de l’adénosine : éveil, accélération du cœur, hausse passagère de la tension ; au-delà du repère, nervosité, palpitations et troubles du sommeil deviennent plus fréquents.",...SOURCES_AGENTS.efsa});
  if(femme)res.push({id:"cafeine_grossesse",titre:"Grossesse et allaitement",zones:mg>200?["uterus"]:[],signe:mg>200?-1:0,niveau:mg>200?"modere":"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
   constat:"En cas de grossesse ou d’allaitement, le repère descend à 200 mg/j"+(mg>200?" : la dose saisie le dépasse.":" : la dose saisie reste en dessous."),
   pourquoi:"Le fœtus élimine très lentement la caféine, qui traverse le placenta.",...SOURCES_AGENTS.efsa});
 }
 // Café (Poole 2017) : courbe non linéaire, maximum de baisse à 3–4 tasses.
 const nbTasses=tasses?.moyenne||0;
 if(nbTasses>0){
  const dans=nbTasses>=3&&nbTasses<=4;
  const base={zones:["heart","liver"],statut:"association_observee",...SOURCES_AGENTS.poole,pourquoi:"Le café contient, outre la caféine, des polyphénols (acides chlorogéniques) qui réduisent l’inflammation et améliorent la sensibilité à l’insuline ; le foie en bénéficie particulièrement."};
  res.push(dans?{id:"cafe_mortalite",titre:"Cœur, vaisseaux et longévité (café)",...base,signe:1,niveau:"favorable",...B(0.83,0.79,0.88),constat:ar(nbTasses)+" tasses par jour : mortalité toutes causes × 0,83 ; mortalité cardiovasculaire × 0,81 (0,72–0,90) ; maladie cardiovasculaire × 0,85 (0,80–0,90), comparé à l’absence de café."}
   :{id:"cafe_mortalite",titre:"Cœur, vaisseaux et longévité (café)",...base,signe:1,niveau:"favorable",rr:null,statut:"non_documente",constat:ar(nbTasses)+" tasses par jour : association favorable décrite, la plus forte à 3–4 tasses ; pas de chiffre publié pour ce niveau dans le résumé."});
  if(femme)res.push({id:"cafe_grossesse",titre:"Grossesse (café)",zones:["uterus"],signe:-1,niveau:"faible",...B(1.31,1.03,1.67),statut:"association_observee",...SOURCES_AGENTS.poole,
   constat:"En cas de grossesse, consommation élevée vs faible : petit poids de naissance × 1,31 ; perte de grossesse × 1,46 (1,06–1,99).",pourquoi:"Exposition prolongée du fœtus, qui n’élimine pas la caféine."});
  if(femme)res.push({id:"cafe_fracture",titre:"Os (café, femmes)",zones:["femur_l","femur_r"],signe:-1,niveau:"non_chiffre",rr:null,statut:"non_documente",...SOURCES_AGENTS.poole,
   constat:"Association entre café et fracture chez la femme, pas chez l’homme (chiffre non donné dans le résumé).",pourquoi:"La caféine augmente un peu la perte urinaire de calcium."});
 }
 return fiche("cafeine","Caféine","mg/j",st,eq,res,{tasses:nbTasses});
}

// ---------- Sucres ----------
export function analyserSucres(series,profil){
 const st=stats(series.sucres);if(!st)return null;
 const g=st.moyenne,res=[];
 const cuillere=50/12; // OMS : 50 g ≈ 12 cuillères à café rases
 const eq=["≈ "+ar(g/cuillere)+" cuillères à café rases de sucre (OMS : 50 g ≈ 12 cuillères)",
  "≈ "+ar(g/33)+" canettes de cola sucré de 33 cl (Ciqual : 10 g de sucres pour 100 g)",
  "≈ "+ar(g/56.3*100,0)+" g de chocolat au lait en tablette (Ciqual : 56,3 g pour 100 g)"];
 const niv=g>50?"modere":g>25?"faible":null;
 res.push({id:"sucres_oms",titre:"Dents et poids · sucres du jour",zones:niv?["teeth"]:[],signe:niv?-1:0,niveau:niv||"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
  constat:ar(g,0)+" g de sucres par jour. Repères OMS pour les sucres libres : moins de 50 g (10 % de l’énergie), idéalement moins de 25 g (5 %)."+(niv?" Dépassement du repère "+(g>50?"de 50 g.":"idéal de 25 g."):""),
  pourquoi:"Les bactéries de la plaque transforment les sucres en acides qui dissolvent l’émail : les caries sont plus fréquentes au-delà de 10 % de l’énergie. Les sucres apportent des calories sans satiété, ce qui favorise la prise de poids. Attention : le catalogue donne les sucres totaux, qui incluent ceux des fruits et du lait (non concernés par le repère).",...SOURCES_AGENTS.oms});
 const ml=stats(series.boissonsSucreesMl);
 if(ml){
  const portions=ml.moyenne/250;
  res.push({id:"boissons_diabete",titre:"Diabète de type 2 (boissons sucrées)",zones:["pancreas"],signe:-1,rr:1.18**portions,bas:1.09**portions,haut:1.28**portions,niveau:niveauRR(1.18**portions),statut:"association_observee",
   domaine:ml.nbJours>=365?"etudie":"extrapole",
   constat:"Calcul : × 1,18 par portion quotidienne (portion médiane 250 mL), appliqué à "+ar(ml.moyenne,0)+" mL/j, soit "+ar(portions)+" portion(s). Après prise en compte du poids : × 1,13 par portion.",
   pourquoi:"Les sucres liquides passent très vite dans le sang : pics de glycémie et d’insuline répétés, surcharge du foie en fructose, résistance à l’insuline.",...SOURCES_AGENTS.imamura});
 }
 return fiche("sucres","Sucres","g/j",st,eq,res);
}

// ---------- Médicaments ----------
function seuilsRegistre(reg,dose,paliers,zones,titre,pourquoi,unite="mg"){
 const franchis=(reg?.thresholds||[]).filter(t=>t.value>1&&dose>t.value);
 const dernier=franchis.at(-1);
 const niv=dernier?paliers[dernier.value]||"faible":null;
 return {titre,zones:niv?zones:[],signe:niv?-1:0,niveau:niv||"non_chiffre",rr:null,statut:dernier?.status||"reglementaire",domaine:"etudie",
  constat:ar(dose,0)+" "+unite+" par jour"+(dernier?" : au-delà du repère « "+dernier.title+" » ("+dernier.value+" "+unite+"). "+(dernier.detail||""):" : sous le premier repère publié ("+(reg?.thresholds?.[0]?.value??"—")+" "+unite+")."),
  pourquoi,source:(dernier||reg?.thresholds?.[0])?.source||"",url:(dernier||reg?.thresholds?.[0])?.url||""};
}
export function analyserParacetamol(series,profil,registre){
 const st=stats(series.paracetamol);if(!st)return null;
 const reg=registre?.paracetamol,mg=st.max,res=[];
 const eq=[500,1000].map(c=>"≈ "+ar(mg/c)+" comprimés de "+c+" mg").concat(profil.poids>0?["≈ "+ar(mg/profil.poids,0)+" mg par kg de poids corporel"]:[]);
 res.push({id:"paracetamol_foie",...seuilsRegistre(reg,mg,{3000:"faible",4000:"modere",6000:"eleve",10000:"eleve"},["liver"],"Foie · dose maximale du jour le plus chargé",
  "Une petite partie du paracétamol est transformée par le foie en un composé toxique (NAPQI), normalement neutralisé par le glutathion ; au-delà des seuils, ou quand le glutathion manque (jeûne, alcool), il détruit les cellules du foie.")});
 if(reg?.chronic_warning&&st.nbJours>1)res.push({id:"paracetamol_duree",titre:"Foie · usage prolongé",zones:mg>=3000?["liver"]:[],signe:mg>=3000?-1:0,niveau:mg>=3000?"faible":"non_chiffre",rr:null,statut:reg.chronic_warning.status,domaine:"etudie",
  constat:st.nbJours+" jours de prise. "+reg.chronic_warning.detail,pourquoi:"Les réserves de glutathion du foie s’épuisent quand les prises se répètent.",source:reg.chronic_warning.source,url:reg.chronic_warning.url});
 return fiche("paracetamol","Paracétamol","mg/j",st,eq,res);
}
export function analyserIbuprofene(series,profil,registre){
 const st=stats(series.ibuprofene);if(!st)return null;
 const reg=registre?.ibuprofene,mg=st.max,res=[];
 const eq=[200,400].map(c=>"≈ "+ar(mg/c)+" comprimés de "+c+" mg").concat(["soit "+ar(mg/1200*100,0)+" % du plafond d’automédication (1 200 mg/j)"]);
 res.push({id:"ibu_seuils",...seuilsRegistre(reg,mg,{1200:"faible",2400:"modere"},["heart","kidney_l","kidney_r"],"Cœur, artères et reins · dose du jour le plus chargé",
  "L’ibuprofène bloque les prostaglandines : elles protègent la paroi de l’estomac, maintiennent la filtration des reins et équilibrent la coagulation dans les artères.")});
 res.push({id:"ibu_rein",titre:"Reins · mode d’action",zones:["kidney_l","kidney_r"],signe:-1,niveau:"faible",rr:null,statut:"toxique_etabli",domaine:"etudie",
  constat:"Dès les doses usuelles, la filtration rénale baisse : effet dose-dépendant du mécanisme, pas un surdosage.",pourquoi:"Sans prostaglandines, les petites artères du rein se contractent.",...(reg?.thresholds?.find(t=>t.value===1)||{})});
 if(mg>=2400){
  res.push({id:"ibu_estomac",titre:"Estomac et intestin · saignement, perforation",zones:["stomach"],signe:-1,...B(3.97,2.22,7.10),niveau:"eleve",statut:"association_observee",domaine:"etudie",
   constat:"Schéma à forte dose des essais : complications digestives hautes × 3,97 comparé au placebo.",pourquoi:"La muqueuse de l’estomac n’est plus protégée par les prostaglandines.",...SOURCES_AGENTS.cnt});
  res.push({id:"ibu_coeur",titre:"Cœur · infarctus",zones:["heart","coronary_arteries"],signe:-1,...B(2.22,1.10,4.48),niveau:"modere",statut:"association_observee",domaine:"etudie",
   constat:"Schéma à forte dose : événements coronaires majeurs × 2,22 ; insuffisance cardiaque environ doublée par tous les AINS.",pourquoi:"Déséquilibre entre substances qui dilatent et qui resserrent les artères ; rétention d’eau et de sel.",...SOURCES_AGENTS.cnt});
 }
 if(reg?.chronic_warning&&st.nbJours>reg.chronic_warning.after_days)res.push({id:"ibu_duree",titre:"Durée sans avis médical",zones:["stomach"],signe:-1,niveau:"faible",rr:null,statut:reg.chronic_warning.status,domaine:"etudie",
  constat:st.nbJours+" jours de prise. "+reg.chronic_warning.detail,pourquoi:"Les risques digestifs et rénaux s’accumulent avec la durée.",source:reg.chronic_warning.source,url:reg.chronic_warning.url});
 return fiche("ibuprofene","Ibuprofène","mg/j",st,eq,res);
}
export function analyserMetformine(series,profil,registre){
 const st=stats(series.metformine);if(!st)return null;
 const reg=registre?.metformine,mg=st.max,res=[];
 const eq=[500,850,1000].map(c=>"≈ "+ar(mg/c)+" comprimés de "+c+" mg");
 res.push({id:"metf_dose",...seuilsRegistre(reg,mg,{3000:"modere"},["kidney_l","kidney_r"],"Reins · dose maximale",
  "La metformine est éliminée telle quelle par les reins : quand la filtration baisse, elle s’accumule et le risque d’acidose lactique augmente. Le plafond dépend du DFG, pas du poids.")});
 // Vitamine B12 : OR 1,13 par année d'utilisation, appliqué à la durée du scénario.
 const ans=st.nbJours/365,or=1.13**ans;
 res.push({id:"metf_b12",titre:"Nerfs et sang · carence en vitamine B12",zones:["spinal_cord","cranial_nerves"],signe:-1,rr:or,bas:1.06**ans,haut:1.20**ans,niveau:niveauRR(or),statut:"association_observee",domaine:st.nbJours<=13*365?"etudie":"extrapole",
  constat:"Calcul : × 1,13 par année d’utilisation, appliqué à "+ar(ans,2)+" an(s). Dans l’essai, la carence était associée à l’anémie et, avec un taux bas de B12, à davantage de neuropathies.",
  pourquoi:"La metformine gêne l’absorption de la vitamine B12 dans l’intestin grêle ; à long terme, les nerfs et la fabrication des globules rouges en souffrent.",...SOURCES_AGENTS.aroda});
 return fiche("metformine","Metformine","mg/j",st,eq,res);
}

// ---------- Combinaisons ----------
export function analyserCombinaisons(series,registre){
 const res=[],jour=k=>series[k].map(v=>v>0);
 const ensemble=(a,b)=>jour(a).some((v,t)=>v&&jour(b)[t]);
 const alcoolMax=Math.max(0,...series.alcool);
 if(ensemble("alcool","paracetamol")){
  const t=registre?.paracetamol?.thresholds?.find(x=>x.value===4000);
  res.push({id:"combi_alcool_paracetamol",titre:"Alcool + paracétamol · foie",zones:["liver"],signe:-1,niveau:"modere",rr:null,statut:"reglementaire",domaine:"etudie",
   constat:"Les deux le même jour. "+(t?.detail||""),pourquoi:"L’alcool chronique active l’enzyme qui fabrique le métabolite toxique du paracétamol et vide les réserves de glutathion qui le neutralisent.",source:t?.source,url:t?.url});
 }
 if(ensemble("alcool","metformine")){
  const t=registre?.metformine?.thresholds?.find(x=>/acidose/i.test(x.title));
  res.push({id:"combi_alcool_metformine",titre:"Alcool + metformine · acidose lactique",zones:["liver","kidney_l","kidney_r"],signe:-1,niveau:alcoolMax>=60?"modere":"faible",rr:null,statut:t?.status||"toxique_etabli",domaine:"etudie",
   constat:"Les deux le même jour (jusqu’à "+ar(alcoolMax,0)+" g d’alcool). "+(t?.detail||""),pourquoi:"L’alcool empêche le foie d’éliminer le lactate, que la metformine augmente déjà.",source:t?.source,url:t?.url});
 }
 return res.length?fiche("combinaisons","Combinaisons","",{moyenne:0,max:0,nbJours:0,total:0},[],res,{entete:["Substances prises le même jour : effets qui s’ajoutent ou se renforcent."]}):null;
}

export function analyserAgents(rows,lookup,profil,duree,registre){
 const series=seriesJournalieres(rows,lookup,duree,profil.age);
 const reg=Object.fromEntries((registre||[]).map(s=>[s.id,s]));
 const fiches=[analyserCafeine(series,profil,reg),analyserSucres(series,profil),analyserParacetamol(series,profil,reg),analyserIbuprofene(series,profil,reg),analyserMetformine(series,profil,reg),analyserCombinaisons(series,reg)].filter(Boolean);
 return {fiches,teneurInconnue:[...series.teneurInconnue]};
}

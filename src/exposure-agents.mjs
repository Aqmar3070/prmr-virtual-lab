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
 aroda:{source:"Aroda et coll. · J Clin Endocrinol Metab 2016, DPP/DPPOS (12 ans)",url:doi("10.1210/jc.2015-3754")},
 rcpParaFarmalider:{source:"ANSM · RCP Paracetamol Farmalider 500 mg, rubrique 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0329067.htm"},
 rcpParaDoliprane:{source:"ANSM · RCP Doliprane 500 mg, rubrique 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0405754.htm"},
 rcpParaDafalgan:{source:"ANSM · RCP Dafalgan 1000 mg, rubrique 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0403352.htm"},
 stollings:{source:"Stollings et coll. · J Crit Care 2016, insuffisance rénale après surdosage",url:doi("10.1016/j.jcrc.2016.06.004")},
 rcpIbuSet:{source:"BDPM · Ibuprofène SET 400 mg, rubrique 4.8",url:"https://base-donnees-publique.medicaments.gouv.fr/medicament/65358002/extrait"},
 rcpIbu405821:{source:"ANSM · RCP ibuprofène, rubrique 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0405821.htm"},
 rcpIbuViatris:{source:"BDPM · Ibuprofène Viatris Santé 400 mg, rubrique 4.8",url:"https://base-donnees-publique.medicaments.gouv.fr/medicament/63136711/extrait"},
 rcpIbuTeva:{source:"BDPM · Ibuprofène Teva 400 mg, rubrique 4.8",url:"https://m.base-donnees-publique.medicaments.gouv.fr/rcp-69847599-3"},
 rcpMetf:{source:"ANSM · RCP metformine, rubriques 4.4 et 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0432834.htm"},
 rcpMetfAcidose:{source:"ANSM · RCP metformine, rubrique 4.8",url:"https://agence-prd.ansm.sante.fr/php/ecodex/rcp/R0277578.htm"},
 ried:{source:"Ried et coll. · Cochrane 2017, 35 essais cacao et pression artérielle",url:doi("10.1002/14651858.CD008893.pub3")},
 atbc:{source:"ATBC Study Group · N Engl J Med 1994, 29 133 fumeurs",url:doi("10.1056/NEJM199404143301501")},
 carotene:{source:"Priyadarshani · Clin Nutr ESPEN 2018, revue sur l’hypercaroténémie",url:doi("10.1016/j.clnesp.2017.12.002")},
 janes:{source:"Janes et coll. · Eur J Pediatr 2005, insuffisance hépatique après huile de girofle",url:doi("10.1007/s00431-005-1692-1")},
 serban:{source:"Serban et coll. · J Hypertens 2015, méta-analyse de 5 essais randomisés sur l’hibiscus (390 participants)",url:doi("10.1097/HJH.0000000000000585")},
 heNigelle:{source:"He et coll. · Front Pharmacol 2024, méta-analyse de 8 essais sur la nigelle et la rhinite allergique",url:doi("10.3389/fphar.2024.1417013")},
 hanNigelle:{source:"Han et Shi · Postepy Dermatol Alergol 2021, méta-analyse de 4 essais sur la nigelle et l’asthme",url:doi("10.5114/ada.2020.93220")},
 huangSpiruline:{source:"Huang et coll. · Diabetes Metab Syndr Obes 2018, méta-analyse de 12 essais sur la spiruline (1 à 19 g/j)",url:doi("10.2147/DMSO.S185672")},
 shiriSpiruline:{source:"Shiri et coll. · Complement Ther Med 2025, méta-analyse de 35 essais sur la spiruline",url:doi("10.1016/j.ctim.2025.103242")},
 liuMoringa:{source:"Liu et coll. · J Pharm Pharmacol 2022, revue systématique sur Moringa oleifera",url:doi("10.1093/jpp/rgab131")},
 ichdAntalgique:{source:"Classification internationale des céphalées (ICHD-3) · 8.2.3.1 céphalée par abus de paracétamol",url:"https://ichd-3.org/8-headache-attributed-to-a-substance-or-its-withdrawal/8-2-medication-overuse-headache-moh/8-2-3-simple-analgesic-overuse-headache/8-2-3-1-paracetamol-acetaminophen-overuse-headache"},
 ichdCafeine:{source:"Classification internationale des céphalées (ICHD-3) · 8.3.1 céphalée de sevrage en caféine",url:"https://ichd-3.org/8-headache-attributed-to-a-substance-or-its-withdrawal/8-3-headache-attributed-to-substance-withdrawal/8-3-1-caffeine-withdrawal-headache"},
 rajapakse:{source:"Rajapakse et coll. · BMC Complement Altern Med 2019, méta-analyse de 9 études sur l’extrait de papayer dans la dengue",url:doi("10.1186/s12906-019-2678-2")},
 silvaChia:{source:"Silva et coll. · Food Funct 2021, méta-analyse de 10 essais sur les graines de chia",url:doi("10.1039/d1fo01287h")},
 pfukwa:{source:"Pfukwa et coll. · Foods 2026, revue sur la pulpe de baobab",url:doi("10.3390/foods15203579")},
 huKinkeliba:{source:"Hu et coll. · Molecules 2023, kinkéliba et inflammation de la peau (cellules et gel cutané)",url:doi("10.3390/molecules28041791")},
 munyangi:{source:"Munyangi et coll. · Phytomedicine 2019, essai Artemisia contre paludisme — publication RETIRÉE",url:doi("10.1016/j.phymed.2018.12.002")},
 potteratNoni:{source:"Potterat et Hamburger · Planta Med 2007, revue sur le fruit de noni (sécurité, avis EFSA)",url:doi("10.1055/s-2007-967115")},
 brownNoni:{source:"Brown · Phytother Res 2012, revue sur le noni et le cancer",url:doi("10.1002/ptr.4595")},
 wylieNeem:{source:"Wylie et Merrell · Front Pharmacol 2022, revue sur l’activité antimicrobienne du neem",url:doi("10.3389/fphar.2022.891535")},
 patelNeem:{source:"Patel et coll. · Cutis 2024, huile de neem et cas de dépigmentation cutanée",url:doi("10.12788/cutis.0928")},
 ilechie:{source:"Ilechie et coll. · Acta Ophthalmol 2020, essai randomisé croisé sur le kola amer (46 adultes)",url:doi("10.1111/aos.14440")},
 maybodi:{source:"Maybodi et coll. · BMC Complement Med Ther 2025, essai randomisé sur l’inhalation de citronnelle (38 patients)",url:doi("10.1186/s12906-025-04834-w")},
 mahmoud:{source:"Mahmoud et coll. · J Antimicrob Chemother 1994, chloroquine prise avec karkadé, tamarin ou citron",url:doi("10.1093/jac/33.5.1005")},
 sinniah:{source:"Sinniah et coll. · J Pathol 1989, huile de neem (margousier) et syndrome de type Reye",url:doi("10.1002/path.1711590313")},
 arslanNigelle:{source:"Arslan et coll. · J Integr Med 2013, insuffisance rénale aiguë associée à la nigelle (cas)",url:doi("10.3736/jintegrmed2013010")},
 muellerNoni:{source:"Mueller et coll. · Am J Kidney Dis 2000, jus de noni et hyperkaliémie (cas)",url:doi("10.1016/s0272-6386(00)70342-8")},
 gomezMoringa:{source:"Gómez-Martínez et coll. · Nutrients 2022, essai randomisé moringa et prédiabète (65 personnes)",url:doi("10.3390/nu14010057")},
 marlesSpiruline:{source:"Marles et coll. · Crit Rev Food Sci Nutr 2011, évaluation de sécurité de la spiruline par la Pharmacopée des États-Unis",url:doi("10.1080/10408391003721719")},
 bideshki:{source:"Bideshki et coll. · Phytother Res 2024, synthèse de 11 méta-analyses sur la curcumine et l’arthrose",url:doi("10.1002/ptr.8153")},
 garaizabal:{source:"Garaizabal Azkue et coll. · Rev Esp Enferm Dig 2024, atteinte du foie liée à un complément de curcuma (cas, HLA-B*35:01)",url:doi("10.17235/reed.2024.10763/2024")},
 girofle:{source:"Vicidomini et coll. · Molecules 2021, revue sur le girofle",url:doi("10.3390/molecules26071880")},
 alqareer:{source:"Alqareer et coll. · J Dent 2006, essai randomisé gel de girofle vs benzocaïne (73 adultes)",url:doi("10.1016/j.jdent.2006.01.009")},
 mohan:{source:"Mohan et coll. · BMC Complement Altern Med 2019, étude pilote (13 volontaires)",url:doi("10.1186/s12906-019-2507-7")},
 ulanowska:{source:"Ulanowska et Olas · Int J Mol Sci 2021, revue sur l’eugénol",url:doi("10.3390/ijms22073671")},
 tavvabi:{source:"Tavvabi-Kashani et coll. · Toxicon 2024, pharmacologie et toxicité de l’eugénol",url:doi("10.1016/j.toxicon.2024.107607")},
 zari:{source:"Zari et coll. · Molecules 2021, propriétés anticancéreuses de l’eugénol",url:doi("10.3390/molecules26237407")},
 charansol:{source:"Charansol et coll. · Contact Dermatitis 2024, allergie de contact à l’eugénol",url:doi("10.1111/cod.14515")},
 redbull:{source:"Red Bull · composition officielle (80 mg de caféine et 27 g de sucres par 250 mL)",url:"https://www.redbull.com/ca-fr/energydrink/red-bull-energy-drink-composition"},
 gualberto:{source:"Gualberto et coll. · Nutr Rev 2024, 17 essais randomisés",url:doi("10.1093/nutrit/nuad112")}
};
// Classes de fréquence des notices (rubrique 4.8) : la probabilité réelle observée en pharmacovigilance.
export const FREQUENCES={
 tres_frequent:{badge:"> 1/10",texte:"très fréquent : plus d’une personne sur 10",niveau:"modere"},
 frequent:{badge:"1–10/100",texte:"fréquent : 1 à 10 personnes sur 100",niveau:"faible"},
 peu_frequent:{badge:"1–10/1000",texte:"peu fréquent : 1 à 10 personnes sur 1 000",niveau:"faible"},
 rare:{badge:"1–10/10 000",texte:"rare : 1 à 10 personnes sur 10 000",niveau:"non_chiffre"},
 tres_rare:{badge:"< 1/10 000",texte:"très rare : moins d’une personne sur 10 000",niveau:"non_chiffre"},
 indeterminee:{badge:"rapporté",texte:"fréquence indéterminée : cas rapportés, fréquence non calculable",niveau:"non_chiffre"}
};
const NOTICES={
 paracetamol:[
  ["foie_transaminases","Foie · hausse des enzymes hépatiques","rare",["liver"],"rcpParaFarmalider","Élévation des transaminases, signe que des cellules du foie souffrent."],
  ["foie_hepatite","Foie · hépatite avec jaunisse","tres_rare",["liver"],"rcpParaFarmalider","Atteinte toxique du foie (ictère) possible même aux doses usuelles, plus probable en cas de jeûne, d’alcool ou de petit poids."],
  ["rein_toxicite","Reins · toxicité rénale","indeterminee",["kidney_l","kidney_r"],"rcpParaFarmalider","La notice range la toxicité rénale parmi les effets indésirables les plus signalés du paracétamol."],
  ["sang","Sang · baisse des plaquettes et des globules blancs","tres_rare",["spleen"],"rcpParaDafalgan","Thrombopénie, leucopénie, neutropénie : saignements faciles, infections."],
  ["allergie","Allergie · hypersensibilité","rare",["skin"],"rcpParaDoliprane","Réactions d’hypersensibilité ; choc anaphylactique et œdème de Quincke de fréquence indéterminée."],
  ["glycemie","Métabolisme · hypoglycémie","indeterminee",["pancreas"],"rcpParaFarmalider","Citée parmi les effets les plus signalés."]
 ],
 ibuprofene:[
  ["digestif","Estomac et intestin · brûlures, douleurs, petites pertes de sang","frequent",["stomach","small_intestine"],"rcpIbu405821","Dès les doses usuelles ; les petites pertes de sang peuvent conduire à une anémie."],
  ["ulcere","Estomac · ulcère avec saignement ou perforation","peu_frequent",["stomach"],"rcpIbuSet","Complication grave, parfois mortelle, plus fréquente chez la personne âgée."],
  ["rein_fonctionnel","Reins · baisse de la filtration (insuffisance rénale fonctionnelle)","indeterminee",["kidney_l","kidney_r"],"rcpIbuViatris","Effet dose-dépendant, généralement réversible à l’arrêt ; risque accru en cas de déshydratation et chez la personne âgée."],
  ["rein_lesion","Reins · lésions du tissu rénal (nécrose papillaire)","rare",["kidney_l","kidney_r"],"rcpIbuSet","L’usage au long cours peut conduire à une nécrose papillaire rénale."],
  ["foie","Foie · atteinte hépatique, hépatite","tres_rare",["liver"],"rcpIbu405821","Surtout lors d’un traitement de longue durée."],
  ["pancreas","Pancréas · pancréatite","tres_rare",["pancreas"],"rcpIbuSet","Inflammation aiguë du pancréas."],
  ["peau","Peau · réactions bulleuses graves (Stevens-Johnson, Lyell)","tres_rare",["skin"],"rcpIbu405821","Urgence : arrêt immédiat au premier signe cutané."],
  ["coeur","Cœur et artères · infarctus, AVC","indeterminee",["heart","coronary_arteries"],"rcpIbuTeva","Risque légèrement accru, surtout à 2 400 mg/j."]
 ],
 metformine:[
  ["digestif","Intestin · nausées, diarrhée, douleurs, perte d’appétit","tres_frequent",["stomach","small_intestine"],"rcpMetf","Surtout au début du traitement ; régressent le plus souvent spontanément."],
  ["gout","Bouche · perturbation du goût","frequent",["tongue"],"rcpMetf","Goût métallique."],
  ["b12","Nerfs et sang · baisse de la vitamine B12","indeterminee",["spinal_cord"],"rcpMetf","Le risque augmente avec la dose et la durée ; anémie et neuropathie possibles."],
  ["acidose","Métabolisme · acidose lactique","tres_rare",["liver","kidney_l","kidney_r"],"rcpMetfAcidose","Complication grave, mortelle sans traitement précoce ; surtout si les reins éliminent mal."]
 ]
};
function effetsNotice(mol){
 return (NOTICES[mol]||[]).map(([id,titre,freq,zones,src,detail])=>{const f=FREQUENCES[freq];
  return {id:mol+"_notice_"+id,titre,zones,signe:-1,niveau:f.niveau,badge:f.badge,rr:null,statut:"pharmacovigilance",domaine:"etudie",
   constat:"Probabilité à dose normale ("+f.texte+"). "+detail,pourquoi:"Effet indésirable observé en pratique réelle et recensé dans la notice officielle.",...SOURCES_AGENTS[src]};});
}

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
 const dependance=mg>200&&st.nbJours>14;
 res.push({id:"cafeine_sevrage",titre:"Tête · mal de tête en cas d’arrêt brutal (sevrage)",zones:dependance?["brain"]:[],signe:dependance?-1:0,niveau:dependance?"faible":"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
  constat:"Critère international : après plus de 2 semaines à plus de 200 mg de caféine par jour, un arrêt ou un retard de prise peut déclencher un mal de tête dans les 24 heures, qui disparaît en 7 jours sans caféine. Scénario : "+ar(mg,0)+" mg par jour sur "+st.nbJours+" jours"+(dependance?" : conditions réunies.":" : conditions non réunies."),
  pourquoi:"Le cerveau s’adapte à la caféine qui bloque l’adénosine ; à l’arrêt, l’adénosine agit de nouveau en excès.",...SOURCES_AGENTS.ichdCafeine});
 return fiche("cafeine","Caféine","mg/j",st,eq,res,{tasses:nbTasses});
}

// ---------- Sucres ----------
export function analyserSucres(series,profil){
 const st=stats(series.sucres);if(!st||st.moyenne<1)return null; // moins d’un gramme : sans intérêt à afficher
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
 if(mg<=3000)res.push({id:"paracetamol_benefice",titre:"Douleur et fièvre · effet recherché",zones:["brain"],signe:1,niveau:"favorable",rr:null,statut:"reglementaire",domaine:"etudie",
  constat:"Jusqu’à 3 g par jour chez l’adulte de plus de 50 kg, dose usuelle de la notice : soulagement de la douleur et de la fièvre.",pourquoi:"Le paracétamol agit dans le cerveau sur les centres de la douleur et de la température.",source:reg?.thresholds?.[0]?.source,url:reg?.thresholds?.[0]?.url});
 res.push({id:"paracetamol_trajet",titre:"Trajet dans le corps · organes exposés",zones:["liver","kidney_l","kidney_r"],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
  constat:"Absorbé par l’intestin, transformé surtout par le foie, puis éliminé par les reins sous forme de dérivés. Le foie et les reins sont donc les deux organes en première ligne ; le rein forme aussi, sur place, une petite part du dérivé toxique.",
  pourquoi:"Analyse pharmacologique du trajet (pharmacocinétique) : elle explique pourquoi la notice cite le foie et les reins, sans ajouter de chiffre.",source:"Analyse PRMR · à partir des rubriques 4.8 et 4.9 des RCP cités",url:SOURCES_AGENTS.rcpParaFarmalider.url});
 if(mg>6000)res.push({id:"paracetamol_rein_surdosage",titre:"Reins · insuffisance rénale aiguë après surdosage",zones:["kidney_l","kidney_r"],signe:-1,niveau:"modere",badge:"2–10/100",rr:null,statut:"association_observee",domaine:"etudie",
  constat:"Au-delà de la dose toxique, une insuffisance rénale aiguë survient chez 2 à 10 personnes sur 100 ; la créatinine monte 2 à 5 jours après, avec un pic vers le 7e jour.",pourquoi:"Le dérivé toxique attaque aussi les tubules du rein, parfois même quand le foie est peu touché.",...SOURCES_AGENTS.stollings});
 res.push(...effetsNotice("paracetamol"));
 const joursMois=Math.min(30,st.nbJours),abus=st.nbJours>90&&joursMois>=15;
 res.push({id:"paracetamol_cephalee",titre:"Tête · maux de tête entretenus par l’abus d’antalgiques",zones:abus?["brain"]:[],signe:abus?-1:0,niveau:abus?"modere":"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
  constat:"Critère international : chez une personne déjà sujette aux maux de tête, prendre du paracétamol 15 jours ou plus par mois pendant plus de 3 mois peut entretenir des maux de tête 15 jours ou plus par mois ; ils disparaissent le plus souvent à l’arrêt de l’excès. Scénario : "+st.nbJours+" jours de prise"+(abus?" : critère de durée atteint.":st.nbJours>=15?" : moins de 3 mois, critère de durée pas encore atteint.":"."),
  pourquoi:"La prise répétée d’antalgiques abaisse le seuil de la douleur dans le cerveau : le médicament pris contre la céphalée finit par l’entretenir.",...SOURCES_AGENTS.ichdAntalgique});
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
 if(mg<=1200)res.push({id:"ibu_benefice",titre:"Douleur, fièvre, inflammation · effet recherché",zones:[],signe:1,niveau:"favorable",rr:null,statut:"reglementaire",domaine:"etudie",
  constat:"Jusqu’à 1 200 mg par jour en automédication : effet antalgique, antipyrétique et anti-inflammatoire.",pourquoi:"Le blocage des prostaglandines calme l’inflammation ; c’est le même mécanisme qui expose l’estomac, les reins et le cœur.",source:reg?.thresholds?.[0]?.source,url:reg?.thresholds?.[0]?.url});
 res.push({id:"ibu_trajet",titre:"Trajet dans le corps · organes exposés",zones:["stomach","kidney_l","kidney_r","heart"],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
  constat:"Absorbé par l’estomac et l’intestin, transformé par le foie, éliminé par les reins. Il agit partout où il y a des prostaglandines : estomac (protection de la muqueuse), reins (débit sanguin), artères et cœur (équilibre de la coagulation et de la tension).",
  pourquoi:"Analyse pharmacologique : un effet indésirable n’est pas réservé au surdosage ; il découle du mode d’action, dès la dose prescrite.",source:"Analyse PRMR · à partir des rubriques 4.4 et 4.8 des RCP cités",url:SOURCES_AGENTS.rcpIbuViatris.url});
 res.push(...effetsNotice("ibuprofene"));
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
 res.push({id:"metf_trajet",titre:"Trajet dans le corps · organes exposés",zones:["small_intestine","kidney_l","kidney_r"],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
  constat:"Absorbée par l’intestin, non transformée par le foie, éliminée telle quelle par les reins. Tout ce qui ralentit les reins (déshydratation, diarrhée, fièvre, insuffisance rénale) la fait s’accumuler.",
  pourquoi:"Analyse pharmacologique : c’est la raison pour laquelle la dose maximale dépend du DFG et que la notice demande d’arrêter temporairement en cas de déshydratation.",source:"Analyse PRMR · à partir des rubriques 4.2, 4.4 et 4.8 des RCP cités",url:SOURCES_AGENTS.rcpMetf.url});
 res.push(...effetsNotice("metformine"));
 return fiche("metformine","Metformine","mg/j",st,eq,res);
}

// ---------- Aliments, plantes et boissons énergisantes ----------
const ALIMENTS=[
 {id:"cacao",titre:"Chocolat noir et cacao",re:/\b(chocolat noir|cacao)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/100*100,0)+" % d’une tablette de 100 g","≈ "+ar(g/10)+" carrés (poids indicatif : 10 g le carré)"],
  resultats:(g,j)=>[
   {id:"cacao_tension",titre:"Artères · baisse de la pression artérielle",zones:["aorta","heart"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=14?"etudie":"extrapole",
    constat:"Dans 35 essais de 2 à 18 semaines (1,4 à 105 g de produits cacaotés par jour), les produits riches en flavanols abaissent la systolique de 1,76 mm Hg en moyenne, et d’environ 4 mm Hg chez les personnes hypertendues.",
    pourquoi:"Les flavanols du cacao augmentent la production de monoxyde d’azote par la paroi des artères, qui se dilatent. Le chocolat au lait et le chocolat blanc en contiennent peu ou pas.",...SOURCES_AGENTS.ried},
   {id:"cacao_digestif",titre:"Estomac · troubles digestifs, nausées",zones:["stomach"],signe:-1,niveau:"faible",badge:"1/100",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Dans ces essais : 1 % des participants sous cacao contre 0,4 % sous témoin.",pourquoi:"Le cacao contient de la théobromine et un peu de caféine, qui stimulent l’estomac.",...SOURCES_AGENTS.ried},
   {id:"cacao_sucre",titre:"Sucres et calories du chocolat",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
    constat:"Le bénéfice vasculaire ne compense pas le sucre et les graisses : voir la fiche « Sucres », calculée automatiquement à partir de la teneur Ciqual du produit.",pourquoi:"Un chocolat noir à 70 % contient environ 18 g de sucres pour 100 g (Ciqual), un chocolat au lait environ 56 g.",...SOURCES_AGENTS.ciqual}]},
 {id:"carotte",titre:"Carotte",re:/\bcarottes?\b/,unite:"g",
  eq:g=>["≈ "+ar(g/100)+" carottes (poids indicatif : 100 g la carotte moyenne)","≈ "+ar(g/1000,2)+" kg de carottes par jour"],
  resultats:(g,j)=>[
   {id:"carotte_vitamine",titre:"Yeux, peau, immunité · provitamine A",zones:["eye_l","eye_r","skin"],signe:1,niveau:"favorable",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"La carotte apporte des caroténoïdes, précurseurs de la vitamine A, et des molécules protectrices.",pourquoi:"Le corps transforme le bêta-carotène en vitamine A selon ses besoins : c’est ce réglage qui rend la carotte sûre, contrairement à la vitamine A en comprimés.",...SOURCES_AGENTS.carotene},
   {id:"carotte_peau",titre:"Peau · coloration orangée (caroténodermie)",zones:g>=500?["skin"]:[],signe:g>=500?-1:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:j>=60?"etudie":"extrapole",
    constat:"Une consommation élevée de caroténoïdes pendant plusieurs mois colore la peau en jaune-orangé, surtout paumes et plantes des pieds. C’est bénin et réversible, mais peut être confondu avec une jaunisse. Diabète et hypothyroïdie y prédisposent.",pourquoi:"Les caroténoïdes non transformés se stockent dans la couche grasse de la peau.",...SOURCES_AGENTS.carotene},
   {id:"carotte_complements",titre:"Poumon · bêta-carotène en compléments chez le fumeur",zones:["lung_l","lung_r"],signe:0,niveau:"non_chiffre",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Ne concerne pas la carotte alimentaire : 20 mg/j de bêta-carotène en compléments pendant 5 à 8 ans ont augmenté le cancer du poumon de 18 % (3 à 36 %) et la mortalité de 8 % chez des fumeurs. Aucun décès n’est documenté pour la carotte consommée comme aliment.",pourquoi:"À forte dose isolée, chez un poumon exposé au tabac, le bêta-carotène peut devenir pro-oxydant.",...SOURCES_AGENTS.atbc}]},
 {id:"bissap",titre:"Bissap · hibiscus (Hibiscus sabdariffa)",re:/\b(bissap|hibiscus|karkade|oseille de guinee)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/2,0)+" sachets de 2 g de fleurs séchées (poids indicatif)","Boisson du commerce ou maison : la teneur en fleurs et en sucre varie, voir la fiche « Sucres » pour un jus Ciqual"],
  resultats:(g,j,ctx)=>[
   {id:"bissap_tension",titre:"Artères · baisse de la pression artérielle",zones:["aorta","heart"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Cinq essais randomisés, 390 participants : la prise d’hibiscus abaisse la systolique de 7,6 mm Hg (5,5 à 9,7) et la diastolique de 3,5 mm Hg (1,9 à 5,2) par rapport au témoin. La baisse est plus forte quand la tension de départ est élevée.",
    pourquoi:"Les anthocyanes et acides organiques des calices détendent la paroi des artères et ont un léger effet diurétique.",...SOURCES_AGENTS.serban},
   {id:"bissap_hypotension",titre:"Tension trop basse avec un antihypertenseur",zones:["brain","heart"],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
    constat:"Avec un traitement contre l’hypertension, la baisse due à l’hibiscus s’ajoute à celle du médicament : vertiges au lever possibles. Mesurer la tension si le bissap est bu tous les jours en grande quantité.",
    pourquoi:"Analyse d’interaction : deux effets hypotenseurs s’additionnent.",...SOURCES_AGENTS.serban},
   {id:"bissap_chloroquine",titre:"Interaction · chloroquine beaucoup moins absorbée",zones:["stomach","liver"],signe:-1,niveau:ctx?.chloroquine?"eleve":"modere",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Volontaires sains, à jeun : 600 mg de chloroquine pris avec du karkadé (bissap) au lieu d’eau → exposition du sang divisée par 3,5 (aire sous la courbe 7,52 → 2,16 mg·h/L) et pic divisé par 3,7 (553 → 148). Une perte d’efficacité contre le paludisme est attendue."+(ctx?.chloroquine?" Chloroquine présente dans votre scénario.":""),
    pourquoi:"Les acides et polyphénols de la boisson réduisent l’absorption intestinale du médicament ; ne pas prendre un antipaludique avec du bissap.",...SOURCES_AGENTS.mahmoud},
   {id:"bissap_dose",titre:"Dose saisie et doses étudiées",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"extrapole",
    constat:ar(g,0)+" g de fleurs par jour. La méta-analyse ne fixe pas de dose maximale sûre : au-delà des préparations des essais, aucun chiffre publié ne permet de calculer un risque.",
    pourquoi:"Une quantité très supérieure aux usages en infusion ne peut pas être extrapolée sans données.",...SOURCES_AGENTS.serban}]},
 {id:"nigelle",titre:"Nigelle (Nigella sativa, cumin noir)",re:/\b(nigelle|nigella|cumin noir|habba sauda|habbatus sauda)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/3,0)+" cuillères à café de graines (poids indicatif : 3 g la cuillère)","Les essais utilisent des graines en poudre, de l’huile ou des extraits, en général quelques grammes par jour au plus"],
  resultats:(g,j)=>[
   {id:"nigelle_rhinite",titre:"Nez · rhinite allergique",zones:["trachea"],signe:1,niveau:"favorable",rr:4.24,bas:2.57,haut:7.27,statut:"association_observee",domaine:"etudie",
    constat:"8 essais randomisés : la nigelle multiplie par 4,24 (2,57 à 7,27) les chances d’amélioration de la rhinite allergique par rapport au témoin ; score des symptômes nasaux − 2,6 points. Essais peu nombreux et de qualité limitée.",
    pourquoi:"La thymoquinone, principal composé de la graine, freine la libération d’histamine et l’inflammation allergique.",...SOURCES_AGENTS.heNigelle},
   {id:"nigelle_asthme",titre:"Poumons · contrôle de l’asthme",zones:["lung_l","lung_r"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"4 essais randomisés : meilleur score de contrôle de l’asthme et meilleur souffle expiré en 1 seconde (VEMS) qu’avec le témoin, en complément du traitement ; pas d’effet net sur le débit de pointe.",
    pourquoi:"Effet anti-inflammatoire et légèrement bronchodilatateur décrit pour la thymoquinone.",...SOURCES_AGENTS.hanNigelle},
   {id:"nigelle_tolerance",titre:"Tolérance · effets indésirables passagers",zones:["stomach"],signe:-1,niveau:"faible",rr:1.01,bas:0.59,haut:1.73,statut:"association_observee",domaine:"etudie",
    constat:"Dans 5 essais, effets indésirables passagers, sans soin nécessaire, pas plus fréquents qu’avec le témoin (rapport 1,01 ; 0,59 à 1,73).",
    pourquoi:"Aux doses des essais, la graine est bien tolérée ; les troubles digestifs sont les plus souvent rapportés.",...SOURCES_AGENTS.heNigelle},
   {id:"nigelle_rein",titre:"Reins · insuffisance rénale aiguë (cas rapporté)",zones:["kidney_l","kidney_r"],signe:-1,niveau:"faible",badge:"rare",rr:null,statut:"pharmacovigilance",domaine:"etudie",
    constat:"Cas publié d’insuffisance rénale aiguë associée à la prise de nigelle chez un patient diabétique. Cas isolé : fréquence inconnue, mais prudence en cas de maladie rénale ou de diabète.",
    pourquoi:"Mécanisme non établi par le rapport de cas.",...SOURCES_AGENTS.arslanNigelle},
   {id:"nigelle_dose",titre:"Dose saisie et doses étudiées",zones:[],signe:0,niveau:g>10?"modere":"non_chiffre",rr:null,statut:"non_documente",domaine:"extrapole",
    constat:ar(g,0)+" g par jour. Les essais portent sur des préparations de quelques grammes par jour au plus ; au-delà, la tolérance n’est pas documentée.",
    pourquoi:"Une quantité très supérieure aux essais sort du domaine étudié.",...SOURCES_AGENTS.heNigelle}]},
 {id:"spiruline",titre:"Spiruline (Arthrospira)",re:/\b(spiruline|spirulina|arthrospira)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/3,0)+" cuillères à café de poudre (poids indicatif : 3 g la cuillère)","Essais : 1 à 19 g par jour pendant 2 à 48 semaines"],
  resultats:(g,j,ctx)=>[
   {id:"spiruline_lipides",titre:"Sang · cholestérol et triglycérides",zones:["heart","aorta"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=14?"etudie":"extrapole",
    constat:"35 essais randomisés : triglycérides − 14,8 mg/dL, cholestérol total − 11,5 mg/dL, LDL − 7,7 mg/dL, HDL + 1,9 mg/dL. Une méta-analyse plus ancienne (12 essais) trouvait des baisses plus fortes.",
    pourquoi:"Les phycocyanines et fibres de la spiruline réduisent l’absorption et la fabrication du cholestérol.",...SOURCES_AGENTS.shiriSpiruline,source2:SOURCES_AGENTS.huangSpiruline},
   {id:"spiruline_tension",titre:"Artères · pression artérielle",zones:["aorta","heart"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=14?"etudie":"extrapole",
    constat:"35 essais : systolique − 3,9 mm Hg, diastolique − 3,1 mm Hg.",pourquoi:"Effet antioxydant et vasodilatateur décrit pour la phycocyanine.",...SOURCES_AGENTS.shiriSpiruline},
   {id:"spiruline_glycemie",titre:"Pancréas · glycémie et insuline",zones:["pancreas"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=14?"etudie":"extrapole",
    constat:"Glycémie à jeun − 5,5 mg/dL, résistance à l’insuline (HOMA-IR) − 0,68."+(ctx.metformine?" Metformine présente : la baisse de glycémie s’ajoute, surveiller la glycémie.":""),pourquoi:"Amélioration de la sensibilité à l’insuline observée dans les essais.",...SOURCES_AGENTS.shiriSpiruline},
   {id:"spiruline_poids",titre:"Corps entier · poids et inflammation",zones:[],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=14?"etudie":"extrapole",
    constat:"Poids − 1,8 kg, IMC − 0,58 ; CRP ultrasensible − 0,86 mg/L, IL-6 et TNF-α en baisse. Qualité des preuves : élevée pour le poids, faible pour LDL et glycémie.",pourquoi:"Effet global modéré, en complément d’autres mesures.",...SOURCES_AGENTS.shiriSpiruline},
   {id:"spiruline_securite",titre:"Sécurité · évaluation officielle",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"reglementaire",domaine:"etudie",
    constat:"La Pharmacopée des États-Unis classe la spiruline (S. maxima et S. platensis) en sécurité « classe A » après examen des essais, des études animales et de 31 déclarations d’effets indésirables ; l’évaluation porte aussi sur les contaminants (métaux lourds, toxines d’algues). La qualité du produit (origine, contrôle des contaminants) compte autant que la dose.",
    pourquoi:"Une spiruline récoltée dans une eau contaminée peut contenir des toxines d’autres algues ou des métaux.",...SOURCES_AGENTS.marlesSpiruline},
   {id:"spiruline_dose",titre:"Dose saisie et doses étudiées",zones:[],signe:0,niveau:g>19?"modere":"non_chiffre",badge:g>19?"× "+ar(g/19,0):undefined,rr:null,statut:"non_documente",domaine:"extrapole",
    constat:ar(g,0)+" g par jour"+(g>19?", au-delà de la plus forte dose étudiée (19 g/j) : aucun effet n’est chiffré à cette dose.":", dans la plage étudiée (1 à 19 g/j)."),pourquoi:"Les essais couvrent 1 à 19 g par jour.",...SOURCES_AGENTS.huangSpiruline}]},
 {id:"moringa",titre:"Moringa (Moringa oleifera)",re:/\bmoringa\b/,unite:"g",
  eq:g=>["≈ "+ar(g/2,0)+" cuillères à café de poudre de feuilles (poids indicatif : 2 g)","Essai clinique : 2,4 g par jour (6 gélules)"],
  resultats:(g,j,ctx)=>[
   {id:"moringa_preuves",titre:"Effets attendus · peu de preuves chez l’humain",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"163 composés identifiés (flavonoïdes, glucosinolates, phénols) avec des activités antioxydantes, anti-inflammatoires et antitumorales décrites, mais presque uniquement en laboratoire. Les essais cliniques sont trop rares pour chiffrer un bénéfice.",
    pourquoi:"Un effet en laboratoire ne prouve pas un effet à la dose mangée.",...SOURCES_AGENTS.liuMoringa},
   {id:"moringa_glycemie",titre:"Pancréas · glycémie en cas de prédiabète",zones:["pancreas"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=60?"etudie":"extrapole",
    constat:"Essai randomisé en double aveugle, 65 personnes prédiabétiques : 2,4 g par jour de poudre de feuilles pendant 12 semaines font baisser la glycémie à jeun et l’hémoglobine glyquée, qui montent sous placebo. Aucun changement des marqueurs du foie et des reins à cette dose."+(ctx.antidiabetique?" Antidiabétique présent : l’effet peut s’ajouter, surveiller la glycémie.":"")+(g>2.4?" Dose saisie ("+ar(g,0)+" g) supérieure à celle de l’essai.":""),
    pourquoi:"Polyphénols des feuilles ; effet sur l’absorption et l’utilisation du glucose.",...SOURCES_AGENTS.gomezMoringa},
   {id:"moringa_toxicite",titre:"Cellules · toxicité à forte dose",zones:g>=50?["liver"]:[],signe:-1,niveau:g>=50?"modere":"faible",rr:null,statut:"toxique_etabli",domaine:"extrapole",
    constat:"La revue signale une toxicité à certaines doses et un effet génotoxique (atteinte de l’ADN) en cas d’usage excessif, établis surtout chez l’animal. Dose saisie : "+ar(g,0)+" g par jour.",
    pourquoi:"Seuil humain non établi : la dose sûre au long cours n’est pas connue.",...SOURCES_AGENTS.liuMoringa}]},
 {id:"papaye",titre:"Papayer (feuilles, extrait) et papaye",re:/\b(papaye|papayer|carica)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/150,1)+" parts de papaye de 150 g (poids indicatif)","Le fruit est évalué par ses sucres (fiche « Sucres », Ciqual) ; l’extrait de feuilles est un usage distinct"],
  resultats:(g,j)=>[
   {id:"papaye_plaquettes",titre:"Sang · plaquettes pendant la dengue (extrait de feuilles)",zones:["spleen"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"9 études : l’extrait de feuilles de papayer augmente les plaquettes entre le 1er et le 5e jour (+ 35 en moyenne, 3 études, 129 patients) et raccourcit l’hospitalisation d’environ 2 jours (3 études, 580 patients). Preuves de faible qualité ; aucun effet démontré sur les complications graves ni la mortalité.",
    pourquoi:"Mécanisme évoqué : protection des plaquettes et de la membrane des cellules sanguines par les composés des feuilles.",...SOURCES_AGENTS.rajapakse},
   {id:"papaye_tolerance",titre:"Tolérance · aucun effet grave rapporté",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Aucun effet indésirable grave n’est rapporté dans ces études. Leur petit nombre ne permet pas d’exclure des effets rares. L’extrait ne remplace pas la surveillance médicale de la dengue.",
    pourquoi:"Signes d’alerte de la dengue (saignements, douleurs abdominales, vomissements persistants) : consultation urgente.",...SOURCES_AGENTS.rajapakse}]},
 {id:"chia",titre:"Graines de chia (Salvia hispanica)",re:/\bchia\b/,unite:"g",
  eq:g=>["≈ "+ar(g/12,0)+" cuillères à soupe (poids indicatif : 12 g)"],
  resultats:(g,j)=>[
   {id:"chia_lipides",titre:"Sang · graisses (lipides)",zones:["heart"],signe:0,niveau:"non_chiffre",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"10 essais randomisés : tendance à la baisse des triglycérides (− 14 mg/dL) et du cholestérol total (− 3 mg/dL), mais aucune différence n’est statistiquement établie. Hausse des oméga-3 végétaux (ALA) et de l’EPA dans le sang.",
    pourquoi:"Les graines sont riches en oméga-3 végétaux, fibres et protéines ; l’effet sur le cholestérol reste neutre ou faiblement favorable.",...SOURCES_AGENTS.silvaChia},
   {id:"chia_dose",titre:"Dose saisie",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"extrapole",
    constat:ar(g,0)+" g par jour. Les graines gonflent au contact de l’eau : avalées sèches en grande quantité, elles peuvent gêner la déglutition ; boire suffisamment.",
    pourquoi:"Riches en fibres : une hausse brutale de la quantité provoque souvent ballonnements et gaz.",...SOURCES_AGENTS.silvaChia}]},
 {id:"baobab",titre:"Baobab (pulpe du fruit, pain de singe)",re:/\b(baobab|pain de singe|bouye|adansonia)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/10,0)+" cuillères à soupe de poudre (poids indicatif : 10 g)"],
  resultats:(g,j)=>[
   {id:"baobab_preuves",titre:"Intestin, sucre du sang, fer · effets surtout en laboratoire",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Seulement 6 études chez l’humain : réponse glycémique chez des adultes en bonne santé, et un essai chez des écoliers avec hausse de l’hémoglobine sans amélioration des réserves en fer. Les effets prébiotiques et immunitaires ne sont montrés qu’en laboratoire ou chez l’animal. Aucune efficacité clinique n’est établie.",
    pourquoi:"Fibres solubles (pectines) et acides organiques de la pulpe ; vitamine C qui facilite l’absorption du fer.",...SOURCES_AGENTS.pfukwa}]},
 {id:"kinkeliba",titre:"Kinkéliba (Combretum micranthum)",re:/\b(kinkeliba|kinkiliba|combretum|seh.?haw)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/2,0)+" sachets ou pincées de feuilles de 2 g (poids indicatif)"],
  resultats:(g,j)=>[
   {id:"kinkeliba_peau",titre:"Peau · anti-inflammatoire (gel appliqué)",zones:["skin"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Sur cellules de peau humaine, l’extrait protège des UV et réduit les signaux inflammatoires (IL-6 − 58 %, IL-8 − 43 %). En gel appliqué sur la peau irritée, rougeur − 22 % et perte d’eau − 60 % en 7 jours. Ces résultats portent sur l’usage cutané, pas sur l’infusion bue.",
    pourquoi:"Riche en vitexine et isovitexine, antioxydants.",...SOURCES_AGENTS.huKinkeliba},
   {id:"kinkeliba_boisson",titre:"Infusion bue · effets non chiffrés chez l’humain",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Thé de brousse très consommé en Afrique de l’Ouest ; aucun essai clinique de l’infusion n’a été retrouvé pour chiffrer un effet sur le foie, la glycémie ou la tension.",pourquoi:"Absence de donnée publiée : rien n’est estimé.",...SOURCES_AGENTS.huKinkeliba}]},
 {id:"artemisia",titre:"Artemisia (annua, afra) en tisane",re:/\b(artemisia|armoise|artemisinine)\b/,unite:"g",
  eq:g=>["Usage étudié : 1 litre d’infusion de feuilles par jour pendant 7 jours"],
  resultats:(g,j)=>[
   {id:"artemisia_paludisme",titre:"Paludisme · efficacité NON démontrée (essai retiré)",zones:["liver","spleen"],signe:-1,niveau:"eleve",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Le grand essai (957 patients, RD Congo) qui annonçait une tisane d’Artemisia supérieure au traitement de référence a été RETIRÉ par la revue : ses résultats ne peuvent pas être utilisés. Traiter un paludisme par tisane seule expose à un échec du traitement et à un paludisme grave.",
    pourquoi:"La teneur en artémisinine d’une tisane est faible et variable ; le traitement du paludisme repose sur les combinaisons à base d’artémisinine prescrites.",...SOURCES_AGENTS.munyangi}]},
 {id:"tamarin",titre:"Tamarin (Tamarindus indica, jus ou pulpe)",re:/\b(tamarin|tamarind|tamarindus|aradaib)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/20,0)+" cuillères à soupe de pulpe (poids indicatif : 20 g)"],
  resultats:(g,j,ctx)=>[
   {id:"tamarin_chloroquine",titre:"Interaction · chloroquine beaucoup moins absorbée",zones:["stomach","liver"],signe:-1,niveau:ctx.chloroquine?"eleve":"modere",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Volontaires sains : 600 mg de chloroquine pris avec une boisson de tamarin → exposition du sang divisée par 2,9 (7,52 → 2,60 mg·h/L) et pic divisé par 3 (553 → 184). Perte d’efficacité attendue contre le paludisme."+(ctx.chloroquine?" Chloroquine présente dans votre scénario.":""),
    pourquoi:"Les acides de la pulpe réduisent l’absorption du médicament.",...SOURCES_AGENTS.mahmoud},
   {id:"tamarin_sucres",titre:"Sucres · voir la fiche Sucres",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"La pulpe de tamarin est très riche en sucres ; une boisson du commerce y ajoute souvent du sucre. La quantité de sucres se lit dans la fiche « Sucres » quand le produit vient de la table Ciqual.",pourquoi:"Teneur variable selon la préparation.",...SOURCES_AGENTS.mahmoud}]},
 {id:"curcuma",titre:"Curcuma (Curcuma longa, curcumine)",re:/\b(curcuma|curcumine|turmeric|safran des indes)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/3,0)+" cuillères à café de poudre (poids indicatif : 3 g)","La poudre contient environ 2 à 5 % de curcumine ; les compléments en sont concentrés"],
  resultats:(g,j)=>[
   {id:"curcuma_arthrose",titre:"Articulations · douleur et raideur de l’arthrose",zones:["knee_l","knee_r"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Synthèse de 11 méta-analyses d’essais randomisés : la curcumine réduit la douleur (échelle visuelle), la raideur et améliore la fonction du genou arthrosique (score WOMAC) ; elle réduit aussi le recours aux antidouleurs.",
    pourquoi:"Effet anti-inflammatoire : la curcumine freine la voie NF-κB et la production de médiateurs de l’inflammation.",...SOURCES_AGENTS.bideshki},
   {id:"curcuma_foie",titre:"Foie · hépatite liée aux compléments (cas)",zones:["liver"],signe:-1,niveau:"faible",badge:"rare",rr:null,statut:"pharmacovigilance",domaine:"etudie",
    constat:"Cas publié : femme de 35 ans, jaunisse après 2 mois d’un complément (60 mg de curcumine + 10 mg de poivre noir, 2 fois par jour) ; enzymes du foie (ALAT) à 2 230 U/L, bilirubine 10,5 mg/dL. Guérison 3 mois après l’arrêt. Elle portait le gène HLA-B*35:01, associé à cette réaction.",
    pourquoi:"Réaction immunitaire du foie, favorisée par certains gènes ; le poivre (pipérine) augmente fortement l’absorption de la curcumine.",...SOURCES_AGENTS.garaizabal},
   {id:"curcuma_dose",titre:"Épice ou complément",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"extrapole",
    constat:ar(g,0)+" g par jour de poudre. Les effets mesurés portent sur des compléments dosés en curcumine ; l’épice en cuisine en apporte beaucoup moins. Signes d’alerte : jaunisse, urines foncées, fatigue intense.",
    pourquoi:"La curcumine seule est peu absorbée ; les formes « améliorées » (avec pipérine) exposent davantage le foie.",...SOURCES_AGENTS.garaizabal}]},
 {id:"noni",titre:"Noni (Morinda citrifolia, jus)",re:/\b(noni|morinda)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/30,0)+" verres doseurs de 30 mL de jus (poids indicatif)"],
  resultats:(g,j)=>[
   {id:"noni_potassium",titre:"Reins et cœur · potassium élevé",zones:["kidney_l","kidney_r","heart"],signe:-1,niveau:"modere",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Le jus de noni contient 56,3 mmol de potassium par litre, autant que le jus d’orange ou de tomate. Cas publié : homme en insuffisance rénale chronique, hyperkaliémie malgré un régime pauvre en potassium, due au noni qu’il prenait en automédication. À surveiller en cas de maladie des reins, du foie ou du cœur : un excès de potassium peut troubler le rythme cardiaque.",
    pourquoi:"Des reins affaiblis éliminent mal le potassium, qui s’accumule dans le sang.",...SOURCES_AGENTS.muellerNoni,source2:SOURCES_AGENTS.brownNoni},
   {id:"noni_foie",titre:"Foie · cas d’atteinte hépatique rapportés",zones:["liver"],signe:-1,niveau:"faible",badge:"rare",rr:null,statut:"pharmacovigilance",domaine:"etudie",
    constat:"Des cas d’hépatotoxicité ont été rapportés, souvent avec d’autres facteurs en cause. L’Autorité européenne de sécurité des aliments n’a pas établi de lien avec le jus, mais une vigilance reste conseillée. Le jus est autorisé comme nouvel aliment en Europe depuis 2003.",
    pourquoi:"Mécanisme non établi ; les anthraquinones de la plante sont évoquées.",...SOURCES_AGENTS.potteratNoni},
   {id:"noni_preuves",titre:"Effets annoncés · peu de preuves chez l’humain",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Effets favorables nombreux en laboratoire, mais données cliniques presque absentes. Chez l’humain : baisse de la perception de la douleur sans recul d’un cancer avancé (1 étude), baisse de marqueurs de dommages de l’ADN chez des fumeurs (1 étude).",pourquoi:"Un effet en laboratoire ne prouve pas un effet à la dose bue.",...SOURCES_AGENTS.brownNoni}]},
 {id:"neem",titre:"Neem (Azadirachta indica)",re:/\b(neem|nim|azadirachta|margousier)\b/,unite:"g",
  eq:g=>["Feuilles, écorce ou huile : usages et doses très variables"],
  resultats:(g,j)=>[
   {id:"neem_antimicrobien",titre:"Bouche, peau, infections · activité antimicrobienne",zones:["skin"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Activités antibactérienne, antifongique, antivirale et antiparasitaire décrites, y compris contre des germes résistants, surtout en laboratoire et en dentisterie. L’efficacité clinique et la sécurité chez l’humain restent à établir.",
    pourquoi:"Composés actifs : azadirachtine, nimbine, nimbidine.",...SOURCES_AGENTS.wylieNeem},
   {id:"neem_peau",titre:"Peau · dépigmentation après application répétée d’huile",zones:["skin"],signe:-1,niveau:"faible",badge:"rare",rr:null,statut:"pharmacovigilance",domaine:"etudie",
    constat:"Cas publié : homme de 77 ans, plaques décolorées sur le dos et les hanches après 6 mois d’application d’huile de neem contre des douleurs articulaires.",
    pourquoi:"Réaction cutanée locale au contact prolongé de l’huile.",...SOURCES_AGENTS.patelNeem},
   {id:"neem_reye",titre:"Foie et cerveau · intoxication grave de l’enfant par l’huile",zones:["liver","brain"],signe:-1,niveau:"eleve",badge:"rare",rr:null,statut:"toxique_etabli",domaine:"etudie",
    constat:"L’huile de neem (huile de margousier) avalée a causé chez des enfants, en Malaisie et en Inde, un syndrome de type Reye : atteinte du foie (stéatose microvésiculaire) puis du cerveau (encéphalopathie), parfois mortelle. Le mécanisme a été reproduit chez l’animal : lésions des mitochondries du foie en 30 à 60 minutes.",
    pourquoi:"Les acides gras à longue chaîne de l’huile bloquent le fonctionnement des mitochondries du foie.",...SOURCES_AGENTS.sinniah},
   {id:"neem_bu",titre:"Prise par la bouche · sécurité non établie",zones:[],signe:0,niveau:g>=10?"modere":"non_chiffre",rr:null,statut:"non_documente",domaine:"extrapole",
    constat:ar(g,0)+" g par jour. Aucune dose orale sûre n’est établie par les sources consultées ; l’huile de neem ne doit pas être avalée, en particulier par les enfants.",pourquoi:"Absence d’essai de sécurité orale chez l’humain.",...SOURCES_AGENTS.wylieNeem}]},
 {id:"kola_amer",titre:"Kola amer (Garcinia kola)",re:/\b(kola amer|bitter kola|garcinia kola|petit kola)\b/,unite:"g",
  eq:(g,p)=>["≈ "+ar(g/5,0)+" noix (poids indicatif : 5 g)"].concat(p?.poids>0?["Essai : 100 mg par kg, soit "+ar(p.poids/10,1)+" g pour vous en une prise"]:[]),
  resultats:(g,j)=>[
   {id:"kola_oeil",titre:"Yeux · baisse de la pression dans l’œil",zones:["eye_l","eye_r"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Essai randomisé croisé, 46 jeunes adultes en bonne santé : une prise de 100 mg par kg fait baisser la pression intraoculaire de 8 % à 45 min, 18 % à 90 min et 21 % à 135 min. Effet à court terme ; pas de donnée chez les personnes atteintes de glaucome.",
    pourquoi:"Effet comparable à certains collyres contre le glaucome ; intérêt possible à confirmer.",...SOURCES_AGENTS.ilechie},
   {id:"kola_glaucome",titre:"Glaucome · ne remplace pas le traitement",zones:["eye_l","eye_r"],signe:0,niveau:"non_chiffre",rr:null,statut:"analyse",domaine:"extrapole",
    constat:"Un effet sur une prise ne permet pas de remplacer un collyre prescrit ; l’effet au long cours n’a pas été étudié.",pourquoi:"Durée étudiée : 135 minutes.",...SOURCES_AGENTS.ilechie}]},
 {id:"citronnelle",titre:"Citronnelle (Cymbopogon citratus)",re:/\b(citronnelle|lemongrass|cymbopogon)\b/,unite:"g",
  eq:g=>["≈ "+ar(g/2,0)+" sachets de 2 g pour infusion (poids indicatif)"],
  resultats:(g,j)=>[
   {id:"citronnelle_anxiete",titre:"Cerveau et cœur · anxiété (odeur inhalée)",zones:["brain","heart"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Essai randomisé, 38 patients chez le dentiste : respirer l’huile essentielle de citronnelle réduit l’anxiété, la tension artérielle et la fréquence cardiaque, sans effet sur la douleur. Cela concerne l’inhalation, pas l’infusion bue.",
    pourquoi:"Composés aromatiques (citral) à effet apaisant.",...SOURCES_AGENTS.maybodi},
   {id:"citronnelle_bue",titre:"Infusion bue · effets non chiffrés",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Aucun essai chiffré de l’infusion bue n’a été retrouvé.",pourquoi:"Rien n’est estimé sans donnée.",...SOURCES_AGENTS.maybodi}]},
 {id:"girofle",titre:"Clou de girofle (eugénol)",re:/\bgirofle\b/,unite:"g",
  eq:(g,ctx)=>["Dose repère d’eugénol jugée sûre : 2,5 mg/kg/j, soit "+ar(2.5*(ctx.poids||70),0)+" mg/j pour "+ar(ctx.poids||70,0)+" kg",
   ctx.huile?"Forme saisie : huile essentielle, la plus concentrée en eugénol":"Forme saisie : clou ou poudre (teneur en eugénol variable, non convertie)",
   "≈ "+ar(g/0.1,0)+" clous si 0,1 g le clou (poids indicatif, à vérifier en pesant)"],
  resultats:(g,j,ctx)=>{const huile=ctx.huile,kg=ctx.poids||70,antidiab=ctx.metformine,ains=ctx.ains;return [
   {id:"girofle_anesthesie",titre:"Bouche · anesthésie locale (douleur dentaire)",zones:["teeth","tongue"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Essai randomisé chez 73 adultes : un gel de girofle posé sur la gencive diminue la douleur d’une piqûre autant que la benzocaïne à 20 %, nettement mieux qu’un placebo.",pourquoi:"L’eugénol bloque les canaux qui transmettent le signal douloureux dans les nerfs de la muqueuse.",...SOURCES_AGENTS.alqareer},
   {id:"girofle_glycemie",titre:"Pancréas et sang · baisse de la glycémie",zones:["pancreas"],signe:1,niveau:"favorable",rr:null,statut:"association_observee",domaine:j>=12?"etudie":"extrapole",
    constat:"Extrait de girofle riche en polyphénols, 250 mg/j pendant 30 jours : glycémie 2 h après le repas − 13 à − 17 mg/dL dès le 12e jour ; glycémie à jeun − 13 mg/dL chez les prédiabétiques. Preuve faible : 13 personnes, sans groupe témoin, étude financée par un industriel.",
    pourquoi:"L’extrait freine les enzymes qui découpent les sucres dans l’intestin (alpha-amylase, alpha-glucosidase), aide les muscles à capter le glucose et réduit la production de glucose par le foie.",...SOURCES_AGENTS.mohan},
   {id:"girofle_microbes",titre:"Infections · antibactérien, antifongique, antiviral",zones:["teeth","stomach"],signe:1,niveau:"favorable",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Activités démontrées au laboratoire sur de nombreux microbes ; non prouvées comme traitement d’une infection chez l’humain.",pourquoi:"L’eugénol, phénol, perce la membrane des bactéries et des champignons.",...SOURCES_AGENTS.ulanowska},
   {id:"girofle_inflammation",titre:"Tissus · anti-inflammatoire, antioxydant, antispasmodique",zones:["stomach","small_intestine"],signe:1,niveau:"favorable",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Effets anti-inflammatoires, antioxydants, analgésiques et antispasmodiques décrits ; l’eugénol est classé « généralement reconnu comme sûr » (GRAS) comme arôme alimentaire.",pourquoi:"Il freine la production de prostaglandines et le stress oxydatif des cellules.",...SOURCES_AGENTS.tavvabi},
   {id:"girofle_cancer",titre:"Cellules cancéreuses · effet en laboratoire uniquement",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Sur des cellules cancéreuses en culture : mort cellulaire, arrêt de la division, moins de migration. Aucune preuve chez l’humain : ce n’est pas un traitement du cancer.",pourquoi:"Effet obtenu à des concentrations que l’alimentation n’atteint pas.",...SOURCES_AGENTS.zari},
   {id:"girofle_foie",titre:"Foie · hépatite toxique, insuffisance hépatique",zones:["liver"],signe:-1,niveau:huile?"eleve":"faible",rr:null,statut:"toxique_etabli",domaine:"etudie",
    constat:"10 mL d’huile de girofle avalés par un enfant de 15 mois : insuffisance hépatique fulminante (enzymes du foie > 13 000 U/L à 24 h), guérie sous N-acétylcystéine. "+(huile?"Forme saisie : huile essentielle — risque direct.":"Forme saisie : clou ou poudre — exposition bien plus faible qu’avec l’huile, mais le foie reste l’organe cible si la dose devient forte."),
    pourquoi:"Le foie transforme l’eugénol en un dérivé réactif (quinone méthide) qui épuise le glutathion des cellules du foie, comme le paracétamol : d’où l’efficacité du même antidote.",...SOURCES_AGENTS.janes},
   {id:"girofle_reins",titre:"Reins · atteinte au cours de l’intoxication",zones:["kidney_l","kidney_r"],signe:-1,niveau:huile?"modere":"non_chiffre",rr:null,statut:"toxique_etabli",domaine:"etudie",
    constat:"Dans le même cas, l’urée (11,8 mmol/L) et la créatinine (134 µmol/L) étaient élevées : les reins sont touchés en même temps que le foie.",pourquoi:"Les dérivés de l’eugénol sont éliminés par les reins, qui subissent le même stress oxydatif.",...SOURCES_AGENTS.janes},
   {id:"girofle_dose",titre:"Corps entier · dose d’eugénol au-delà de laquelle il devient toxique",zones:huile?["liver"]:[],signe:huile?-1:0,niveau:huile?"modere":"non_chiffre",rr:null,statut:"toxique_etabli",domaine:"etudie",
    constat:"Dose jugée sûre : 2,5 mg d’eugénol par kg et par jour, soit "+ar(2.5*kg,0)+" mg/j pour "+ar(kg,0)+" kg. Au-delà, l’eugénol devient toxique. "+(huile?"L’huile essentielle étant presque entièrement constituée d’eugénol, quelques gouttes répétées peuvent dépasser ce repère.":"Pour le clou, la teneur en eugénol n’est pas convertie faute de valeur sourcée ; un usage culinaire reste en pratique très en dessous."),
    pourquoi:"Comme beaucoup de phénols, l’eugénol est protecteur à faible dose et toxique à forte dose.",...SOURCES_AGENTS.ulanowska},
   {id:"girofle_saignement",titre:"Sang · risque de saignement (effet anticoagulant)",zones:ains?["stomach"]:[],signe:ains?-1:0,niveau:ains?"modere":"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
    constat:"Effet antithrombotique décrit (moins d’agrégation des plaquettes)."+(ains?" Associé ici à un anti-inflammatoire : les deux effets anticoagulants s’additionnent, l’estomac est le premier exposé.":" À surveiller avec un anticoagulant, l’aspirine, un anti-inflammatoire, ou avant une chirurgie ou une extraction dentaire."),
    pourquoi:"Analyse d’interaction : deux freins à la coagulation s’additionnent.",...SOURCES_AGENTS.girofle},
   {id:"girofle_hypoglycemie",titre:"Sang · risque d’hypoglycémie avec un antidiabétique",zones:antidiab?["pancreas","brain"]:[],signe:antidiab?-1:0,niveau:antidiab?"faible":"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
    constat:(antidiab?"Metformine présente dans le scénario : la baisse de glycémie du girofle s’ajoute à celle du médicament. ":"")+"Avec un antidiabétique (metformine, sulfamide, insuline), surveiller la glycémie si l’extrait de girofle est pris régulièrement.",
    pourquoi:"Analyse d’interaction : deux effets hypoglycémiants s’additionnent ; le cerveau est le premier à souffrir d’un manque de sucre.",...SOURCES_AGENTS.mohan},
   {id:"girofle_muqueuse",titre:"Bouche · irritation, brûlure de la muqueuse",zones:huile?["tongue","teeth"]:[],signe:huile?-1:0,niveau:huile?"faible":"non_chiffre",rr:null,statut:"analyse",domaine:"etudie",
    constat:"L’huile pure posée directement et de façon répétée sur la gencive peut l’irriter, voire la brûler ; l’essai d’anesthésie utilisait un gel, pas l’huile pure.",pourquoi:"L’eugénol concentré est un phénol caustique pour les muqueuses.",...SOURCES_AGENTS.ulanowska},
   {id:"girofle_allergie",titre:"Peau · allergie de contact",zones:["skin"],signe:-1,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"L’eugénol est un allergène de contact connu (parfums, cosmétiques, cire) : eczéma chez les personnes sensibilisées.",pourquoi:"Il se lie aux protéines de la peau et déclenche une réaction immunitaire retardée.",...SOURCES_AGENTS.charansol},
   {id:"girofle_non_verifie",titre:"Enfant intoxiqué · autres signes rapportés, non vérifiés",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Convulsions, acidose du sang et troubles de la coagulation sont rapportés dans d’autres cas d’intoxication de l’enfant par l’huile de girofle ; ces rapports n’ont pas encore été vérifiés dans le registre.",pourquoi:"Affiché pour ne rien omettre, sans le compter comme établi.",...SOURCES_AGENTS.janes}
  ];}},
 {id:"energisante",titre:"Boisson énergisante",re:/\b(energisante|red ?bull|energy)\b/,unite:"mL",
  eq:ml=>["≈ "+ar(ml/250)+" canettes de 250 mL","≈ "+ar(ml/250*80,0)+" mg de caféine si la teneur est celle de Red Bull (80 mg par canette)","≈ "+ar(ml/250*27,0)+" g de sucres si la teneur est celle de Red Bull (27 g par canette)"],
  resultats:(ml,j)=>[
   {id:"energisante_tension",titre:"Cœur et artères · hausse aiguë de la tension",zones:["heart","aorta"],signe:-1,niveau:"faible",rr:null,statut:"association_observee",domaine:"etudie",
    constat:"Après une prise : systolique + 4,7 mm Hg (3,0 à 6,5) vers 60–80 minutes, diastolique + 4,5 mm Hg vers 2 heures, débit cardiaque augmenté (17 essais chez des adultes en bonne santé).",
    pourquoi:"Caféine, sucre et parfois guarana ou ginseng s’additionnent pour stimuler le cœur et resserrer les vaisseaux. Les fiches Caféine et Sucres détaillent la dose cumulée.",...SOURCES_AGENTS.gualberto}]}
];
function nomProduit(p){return fold(p?.name||"");}
export function analyserAliments(rows,lookup,duree,profil={},series={}){
 const fiches=[];
 const present=k=>(series[k]||[]).some(v=>v>0);
 for(const a of ALIMENTS){
  const serie=[];
  for(let t=0;t<=duree;t++){let q=0;for(const r of rows){const p=lookup(r.id);if(p&&a.re.test(nomProduit(p))&&!/\bblanc\b/.test(nomProduit(p)))q+=doseAt(r,t);}serie.push(q);}
  const st=stats(serie);if(!st)continue;
  const huile=rows.some(r=>doseAt(r,0)>=0&&a.re.test(nomProduit(lookup(r.id)))&&/\b(huile|essentielle)\b/.test(nomProduit(lookup(r.id))));
  const noms=rows.map(r=>nomProduit(lookup(r.id))).join(" | ");
  const ctx={poids:profil.poids,huile,metformine:present("metformine"),ains:present("ibuprofene"),chloroquine:/chloroquine|nivaquine/.test(noms),antidiabetique:present("metformine")||/glibenclamide|gliclazide|glimepiride|insuline|sitagliptine|vildagliptine/.test(noms),reins:profil.dfg>0&&profil.dfg<60};
  fiches.push(fiche(a.id,a.titre,a.unite+"/j",st,a.eq(st.moyenne,ctx),a.resultats(st.moyenne,st.nbJours,ctx)));
 }
 return fiches;
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
 const fiches=[analyserCafeine(series,profil,reg),analyserSucres(series,profil),analyserParacetamol(series,profil,reg),analyserIbuprofene(series,profil,reg),analyserMetformine(series,profil,reg),...analyserAliments(rows,lookup,duree,profil,series),analyserCombinaisons(series,reg)].filter(Boolean);
 return {fiches,teneurInconnue:[...series.teneurInconnue]};
}

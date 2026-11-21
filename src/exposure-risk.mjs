// Moteur de recherche dose–durée (pilote : alcool).
// Chaque résultat est CALCULÉ à partir d'une formule ou d'un tableau publié, cité avec son lien.
// Rien n'est estimé à la main : quand la publication ne donne pas de chiffre pour un niveau,
// le résultat le dit (`chiffre:null`) au lieu de combler le vide.
import {evaluateDay} from "./exposure-evidence.mjs";

export const DENSITE_ETHANOL=0.789; // g/mL (Searle 2015)

export const SOURCES={
 bagnardi:{source:"Bagnardi et coll. · Br J Cancer 2015, méta-analyse de 572 études",url:"https://doi.org/10.1038/bjc.2014.579"},
 roerecke19:{source:"Roerecke et coll. · Am J Gastroenterol 2019, méta-analyse cirrhose",url:"https://doi.org/10.14309/ajg.0000000000000340"},
 kodama:{source:"Kodama et coll. · J Am Coll Cardiol 2011, méta-analyse fibrillation atriale",url:"https://doi.org/10.1016/j.jacc.2010.08.641"},
 topiwala:{source:"Topiwala et coll. · BMJ 2017, cohorte Whitehall II, IRM après 30 ans de suivi",url:"https://doi.org/10.1136/bmj.j2353"},
 roerecke17:{source:"Roerecke et coll. · Lancet Public Health 2017, 36 essais (≥ 7 jours)",url:"https://doi.org/10.1016/S2468-2667(17)30003-8"},
 searle:{source:"Searle · Med Sci Law 2015, modèle de Widmark et facteurs de Forrest",url:"https://doi.org/10.1177/0025802414524385"},
 route:{source:"Service-public.fr · Alcool au volant (seuil 0,5 g/L)",url:"https://www.service-public.gouv.fr/particuliers/vosdroits/F2881"}
};

// Catégories de Bagnardi 2015 : légère ≤ 12,5 g/j, modérée ≤ 50 g/j, forte > 50 g/j.
export function categorieBagnardi(g){return g<=0?null:g<=12.5?"legere":g<=50?"moderee":"forte";}
const B=(rr,bas,haut)=>({rr,bas,haut});
// Valeurs reprises mot pour mot du texte des résultats (Bagnardi 2015). `null` = aucun chiffre
// significatif publié dans le texte pour ce niveau : le résultat l'affichera tel quel.
export const CANCERS=[
 {id:"bouche",titre:"Cancer de la bouche et du pharynx",zones:["pharynx","tongue"],legere:B(1.13,1.00,1.26),moderee:B(1.83,1.62,2.07),forte:B(5.13,4.31,6.10),
  pourquoi:"L’acétaldéhyde, premier produit de dégradation de l’éthanol, est cancérogène pour les muqueuses qu’il touche en premier ; l’alcool facilite aussi l’absorption d’autres cancérogènes."},
 {id:"oesophage",titre:"Cancer épidermoïde de l’œsophage",zones:["esophagus"],legere:B(1.26,1.06,1.50),moderee:B(2.23,1.87,2.65),forte:B(4.95,3.86,6.34),
  pourquoi:"Même mécanisme que pour la bouche : contact direct et acétaldéhyde. L’effet des faibles doses est plus net dans les populations d’Asie, où une variante du gène ALDH2 ralentit l’élimination de l’acétaldéhyde."},
 {id:"larynx",titre:"Cancer du larynx",zones:["larynx"],legere:null,moderee:B(1.44,1.25,1.66),forte:B(2.65,2.19,3.19),
  pourquoi:"Lésion directe de l’épithélium des voies aérodigestives supérieures et acétaldéhyde."},
 {id:"colorectal",titre:"Cancer colorectal",zones:["colon"],legere:null,moderee:B(1.17,1.11,1.24),forte:B(1.44,1.25,1.65),
  pourquoi:"L’alcool perturbe l’absorption des folates ; leur carence est associée à ce cancer. L’association est plus forte chez les hommes."},
 {id:"foie_cancer",titre:"Cancer du foie",zones:["liver"],legere:null,moderee:null,forte:B(2.07,1.66,2.58),
  pourquoi:"Le foie métabolise l’éthanol : production locale d’acétaldéhyde, inflammation, puis cirrhose, terrain principal du cancer."},
 {id:"sein",titre:"Cancer du sein",zones:["breast_l","breast_r"],femme:true,legere:B(1.04,1.01,1.07),moderee:B(1.23,1.19,1.28),forte:B(1.61,1.33,1.94),
  pourquoi:"L’alcool élève les taux d’œstrogènes et d’androgènes, qui favorisent ce cancer. Le risque augmente dès les faibles doses."},
 {id:"estomac",titre:"Cancer de l’estomac",zones:["stomach"],legere:null,moderee:null,forte:B(1.21,1.07,1.36),
  pourquoi:"Association à forte dose ; les auteurs signalent un possible effet résiduel du tabac et d’une alimentation pauvre."},
 {id:"pancreas",titre:"Cancer du pancréas",zones:["pancreas"],legere:null,moderee:null,forte:B(1.19,1.11,1.28),
  pourquoi:"Mécanisme possible : la pancréatite liée aux fortes consommations."},
 {id:"vesicule",titre:"Cancer de la vésicule biliaire",zones:["gallbladder"],legere:null,moderee:null,forte:B(2.64,1.62,4.30),
  pourquoi:"Association homogène entre études, mais peu de données (8 études) : conclusion prudente selon les auteurs."},
 {id:"poumon",titre:"Cancer du poumon",zones:["lung_l","lung_r"],legere:null,moderee:null,forte:B(1.15,1.02,1.30),
  pourquoi:"Effet probablement lié au tabac associé : aucune association chez les non-fumeurs dans une analyse antérieure des mêmes auteurs."},
 // Associations inverses publiées : affichées comme « favorables », avec la réserve des auteurs.
 {id:"rein_cancer",titre:"Cancer du rein (association inverse)",zones:["kidney_l","kidney_r"],signe:1,legere:B(0.92,0.86,0.99),moderee:B(0.79,0.72,0.86),forte:null,
  pourquoi:"Risque plus bas chez les buveurs légers et modérés. Mécanisme incertain (sensibilité à l’insuline, effet diurétique) ; cela ne compense pas les autres risques."},
 {id:"thyroide",titre:"Cancer de la thyroïde (association inverse)",zones:[],signe:1,legere:B(0.81,0.74,0.88),moderee:B(0.81,0.71,0.94),forte:null,
  pourquoi:"Association inverse sur 9 études seulement : trop peu pour conclure selon les auteurs."}
];

// Indice de masse corporelle et facteur de Widmark (formules de Forrest reprises par Searle 2015).
export function facteurWidmark(sexe,poids,taille){
 const imc=poids/((taille/100)**2);
 return sexe==="female"?0.9367-0.01240*imc:1.0181-0.01213*imc;
}
// Alcoolémie maximale théorique d'une journée : toute la quantité absorbée d'un seul coup,
// sans élimination pendant la prise (borne haute). β = 14,8 mg/100 mL/h : valeur de l'exemple
// de référence (Gullberg, repris par Searle). Incertitude : CV de r 9,2 % et du degré 3 %.
export function alcoolemie(grammes,{sexe,poids,taille}){
 if(!(grammes>0&&poids>0&&taille>0))return null;
 const r=facteurWidmark(sexe,poids,taille);
 const pic=grammes/(r*poids); // g/L : 100·m/(r·M) en mg/100 mL, divisé par 100
 const cv=Math.hypot(0.092,0.03),beta=0.148; // g/L par heure
 return {pic,bas:pic*(1-2*cv),haut:pic*(1+2*cv),heures:pic/beta,r};
}

// Grammes d'alcool pur par jour sur tout le scénario, à partir des cumuls existants.
export function grammesParJour(rows,lookup,duree,age){
 const jours=[];
 for(let t=0;t<=duree;t++){
  const j=evaluateDay(rows,t,age,lookup);
  const g=(j.available.has("ethanolG")?j.totals.ethanolG:0)+(j.available.has("ethanolMl")?j.totals.ethanolMl*DENSITE_ETHANOL:0);
  jours.push(g);
 }
 return jours;
}

const niveau=rr=>rr>=3?"eleve":rr>=1.5?"modere":"faible";

// Analyse complète. `profil` : {sexe, age, poids, taille}. Renvoie null si le scénario ne contient pas d'alcool.
export function analyserAlcool(rows,lookup,profil,duree){
 const jours=grammesParJour(rows,lookup,duree,profil.age);
 const actifs=jours.filter(g=>g>0);
 if(!actifs.length)return null;
 const moyenne=actifs.reduce((a,b)=>a+b,0)/actifs.length; // g/j les jours de consommation
 const total=jours.reduce((a,b)=>a+b,0),nbJours=actifs.length;
 const cat=categorieBagnardi(moyenne),femme=profil.sexe==="female";
 const verres=moyenne/12; // verre standard de 12 g (Roerecke 2019)
 const unitesSemaine=moyenne*7/8; // unité britannique de 8 g (Topiwala 2017)
 // Les risques relatifs décrivent une consommation HABITUELLE suivie 6 à 30 ans.
 const domaine=nbJours>=365?"etudie":"extrapole";
 const resultats=[];
 const ajouter=r=>resultats.push({domaine,...r});

 for(const c of CANCERS){
  if(c.femme&&!femme)continue;
  const v=c[cat],src=SOURCES.bagnardi;
  if(v)ajouter({id:c.id,titre:c.titre,zones:c.zones,signe:c.signe||(v.rr>=1?-1:1),rr:v.rr,bas:v.bas,haut:v.haut,niveau:c.signe?"favorable":niveau(v.rr),
   statut:"association_observee",constat:"Risque relatif "+(c.signe?"diminué":"augmenté")+" chez les buveurs de catégorie "+libelleCategorie(cat)+" comparés aux non-buveurs.",pourquoi:c.pourquoi,...src});
  else ajouter({id:c.id,titre:c.titre,zones:[],signe:0,rr:null,niveau:"non_chiffre",statut:"non_documente",
   constat:"Aucune augmentation significative chiffrée dans le texte de la méta-analyse pour la catégorie "+libelleCategorie(cat)+".",pourquoi:c.pourquoi,...src});
 }

 // Cirrhose (Roerecke 2019), verre = 12 g. Chiffres publiés dans le texte : ≥ 5 verres/j.
 const cirr=femme?{c5:B(12.44,6.65,23.27),c7:B(24.58,14.77,40.90)}:{c5:B(3.80,0.85,17.02),c7:B(6.93,1.07,44.99)};
 const vc=verres>=7?cirr.c7:verres>=5?cirr.c5:null;
 if(vc)ajouter({id:"cirrhose",titre:"Cirrhose du foie",zones:["liver"],signe:-1,...vc,niveau:niveau(vc.rr),statut:"association_observee",
  constat:(femme?"Femmes":"Hommes")+", "+(verres>=7?"≥ 7":"5 à 6")+" verres standard par jour comparés aux abstinents de longue date."+(vc.bas<1?" L’intervalle inclut 1 : résultat imprécis.":""),
  pourquoi:"Le foie transforme l’éthanol ; l’exposition répétée provoque stéatose, inflammation puis fibrose. Boire tous les jours et hors des repas augmente encore le risque à quantité égale.",...SOURCES.roerecke19});
 else ajouter({id:"cirrhose",titre:"Cirrhose du foie",zones:femme&&verres>=1?["liver"]:[],signe:femme&&verres>=1?-1:0,rr:null,niveau:femme&&verres>=1?"non_chiffre":"non_chiffre",statut:"non_documente",
  constat:femme?(verres>=1?"Chez les femmes, risque accru dès 1 verre par jour selon la méta-analyse, sans chiffre dans le texte pour ce niveau.":"Moins d’un verre par jour : pas de hausse rapportée chez les buveurs occasionnels."):"Chez les hommes, pas de hausse rapportée à 1 verre par jour ; chiffre publié seulement à partir de 5 verres.",
  pourquoi:"Le foie transforme l’éthanol ; l’exposition répétée provoque stéatose, inflammation puis fibrose.",...SOURCES.roerecke19});

 // Fibrillation atriale : modèle linéaire publié, RR 1,08 (1,05–1,10) par 10 g/j.
 const pas=moyenne/10;
 ajouter({id:"fa",titre:"Fibrillation atriale (rythme cardiaque)",zones:["heart"],signe:-1,rr:1.08**pas,bas:1.05**pas,haut:1.10**pas,niveau:niveau(1.08**pas),statut:"association_observee",
  constat:"Calcul : 1,08 par tranche de 10 g/j, appliqué à "+arrondi(moyenne)+" g/j.",
  pourquoi:"L’alcool modifie la conduction électrique des oreillettes et le système nerveux autonome ; le risque croît dès les faibles doses.",...SOURCES.kodama});

 // Cerveau, structure (Topiwala 2017) : unités britanniques par semaine sur 30 ans.
 const hippo=unitesSemaine>30?B(5.8,1.8,18.6):unitesSemaine>=14&&unitesSemaine<=21?B(3.4,1.4,8.1):null;
 ajouter(hippo?{id:"hippocampe",titre:"Atrophie de l’hippocampe (mémoire)",zones:["brain"],signe:-1,...hippo,niveau:niveau(hippo.rr),statut:"association_observee",
  constat:"Rapport de cotes vs abstinents, "+(unitesSemaine>30?"plus de 30":"14 à 21")+" unités britanniques par semaine (ici ≈ "+arrondi(unitesSemaine)+").",
  pourquoi:"L’hippocampe, centre de la mémoire, rétrécit davantage chez les buveurs réguliers, même modérés ; les mêmes participants ont perdu plus vite en fluence verbale.",...SOURCES.topiwala}
  :{id:"hippocampe",titre:"Atrophie de l’hippocampe (mémoire)",zones:unitesSemaine>=7?["brain"]:[],signe:unitesSemaine>=7?-1:0,rr:null,niveau:"non_chiffre",statut:"non_documente",
  constat:unitesSemaine<7?"Moins de 7 unités par semaine : aucun effet protecteur de la consommation légère, et pas de chiffre de risque publié.":"Niveau (≈ "+arrondi(unitesSemaine)+" unités/semaine) entre les classes chiffrées ; l’étude décrit un effet dépendant de la dose sans chiffre pour cette classe.",
  pourquoi:"Effet dose-dépendant sur la structure cérébrale observé sur 30 ans.",...SOURCES.topiwala});

 // Pression artérielle (Roerecke 2017) : seul résultat issu d'essais courts (≥ 7 jours).
 if(verres>2)ajouter({id:"tension",titre:"Pression artérielle",zones:["aorta","heart"],signe:-1,rr:null,niveau:verres>=6?"modere":"faible",statut:"association_observee",domaine:"etudie",
  constat:verres>=6?"Au-delà de 6 verres par jour, réduire d’environ moitié abaisse la systolique de 5,5 mm Hg (IC 95 % 4,3 à 6,7) et la diastolique de 4,0 mm Hg.":"Au-delà de 2 verres par jour, réduire la consommation abaisse la pression artérielle ; en dessous, pas d’effet significatif.",
  pourquoi:"Effet mesuré dans des essais d’au moins 7 jours : la pression répond en quelques jours, c’est l’effet le plus rapide de cette liste.",...SOURCES.roerecke17});

 // Alcoolémie (effet aigu sur le cerveau), jour le plus chargé.
 const max=Math.max(...jours),bac=alcoolemie(max,profil);
 if(bac)ajouter({id:"alcoolemie",titre:"Alcoolémie maximale (effet immédiat sur le cerveau)",zones:["brain"],signe:-1,rr:null,niveau:bac.pic>=0.8?"eleve":bac.pic>=0.5?"modere":"faible",statut:"reglementaire",domaine:"etudie",
  constat:"Jour le plus chargé : "+arrondi(max)+" g d’alcool pur → jusqu’à "+arrondi(bac.pic,2)+" g/L (fourchette "+arrondi(bac.bas,2)+" à "+arrondi(bac.haut,2)+"), éliminé en ≈ "+arrondi(bac.heures,1)+" h. Seuil légal de conduite : 0,5 g/L.",
  pourquoi:"Calcul de Widmark : quantité ÷ (facteur de diffusion × poids). Borne haute : toute la quantité bue d’un coup. L’alcool ralentit le cerveau : vigilance, réflexes et jugement baissent avant même 0,5 g/L.",...SOURCES.searle,source2:SOURCES.route});

 return {moyenne,total,nbJours,categorie:cat,verres,unitesSemaine,jours,domaine,resultats};
}
export function libelleCategorie(c){return {legere:"légère (≤ 12,5 g/j)",moderee:"modérée (12,5 à 50 g/j)",forte:"forte (> 50 g/j)"}[c]||"—";}
export function arrondi(x,d=1){return Number(x.toFixed(d)).toLocaleString("fr-FR");}

// Repères pour la carte 3D et la liste des zones : un repère par résultat chiffré ou décrit.
export function reperesAtlas(analyse){
 if(!analyse)return [];
 const rang={eleve:0,modere:1,faible:2,non_chiffre:3,favorable:4};
 return analyse.resultats.filter(r=>r.zones.length&&r.signe!==0).sort((x,y)=>rang[x.niveau]-rang[y.niveau]||(y.rr??0)-(x.rr??0)).map(r=>({zone:r.zones[0],zones:r.zones,sign:r.signe,niveau:r.niveau,title:r.titre,
  reason:r.constat+(r.rr!=null?" Risque relatif "+arrondi(r.rr,2)+" (IC 95 % "+arrondi(r.bas,2)+"–"+arrondi(r.haut,2)+").":"")+" "+r.pourquoi+(r.domaine==="extrapole"?" Extrapolation : les études portent sur une consommation habituelle suivie des années ; ce chiffre vaut si la consommation devient durable.":""),
  source:r.source,url:r.url,recherche:true}));
}

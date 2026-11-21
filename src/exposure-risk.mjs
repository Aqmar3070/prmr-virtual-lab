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
 route:{source:"Service-public.fr · Alcool au volant (seuil 0,5 g/L)",url:"https://www.service-public.gouv.fr/particuliers/vosdroits/F2881"},
 roerecke18:{source:"Roerecke et coll. · J Am Heart Assoc 2018, hypertension par sexe, 361 254 participants",url:"https://doi.org/10.1161/JAHA.117.008202"},
 larsson:{source:"Larsson et coll. · BMC Med 2016, 27 études prospectives, AVC par type",url:"https://doi.org/10.1186/s12916-016-0721-4"},
 roerecke12:{source:"Roerecke et Rehm · Addiction 2012, cardiopathie ischémique",url:"https://doi.org/10.1111/j.1360-0443.2012.03780.x"},
 knott:{source:"Knott et coll. · Diabetes Care 2015, 1,9 million de participants",url:"https://doi.org/10.2337/dc15-0710"},
 samok15:{source:"Samokhvalov et coll. · EBioMedicine 2015, pancréatites",url:"https://doi.org/10.1016/j.ebiom.2015.11.023"},
 ke:{source:"Ke et coll. · Adv Nutr 2023, 44 articles, 6 millions de participants",url:"https://doi.org/10.1016/j.advnut.2023.03.008"},
 ma:{source:"Ma et coll. · Front Nutr 2025, hyperuricémie et goutte",url:"https://doi.org/10.3389/fnut.2025.1588980"},
 jin:{source:"Jin et coll. · Ann Rheum Dis 2014, polyarthrite rhumatoïde",url:"https://doi.org/10.1136/annrheumdis-2013-203323"},
 xu:{source:"Xu et coll. · Eur J Epidemiol 2017, démence",url:"https://doi.org/10.1007/s10654-017-0225-3"},
 irc:{source:"Méta-analyse de 25 cohortes · Eur J Clin Nutr 2021, maladie rénale chronique",url:"https://doi.org/10.1038/s41430-021-00873-x"},
 imtiaz:{source:"Imtiaz et coll. · Eur Respir J 2017, tuberculose",url:"https://doi.org/10.1183/13993003.00216-2017"},
 samok10:{source:"Samokhvalov et coll. · Epidemiol Infect 2010, pneumonie",url:"https://doi.org/10.1017/S0950268810000774"}
};
// Interpolation log-linéaire entre points publiés (g/j → RR) ; null hors de la plage publiée.
export function interpoler(points,g){
 if(g<points[0][0]||g>points[points.length-1][0])return null;
 for(let i=1;i<points.length;i++){
  const [g0,...v0]=points[i-1],[g1,...v1]=points[i];
  if(g<=g1){const f=(g-g0)/(g1-g0);const [rr,bas,haut]=v0.map((x,k)=>Math.exp(Math.log(x)+f*(Math.log(v1[k])-Math.log(x))));return {rr,bas,haut,exact:f===0||f===1};}
 }
 return null;
}

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

for(const r of autresMaladies({g:moyenne,verres,femme}))ajouter(r);

 // Alcoolémie (effet aigu sur le cerveau), jour le plus chargé.
 const max=Math.max(...jours),bac=alcoolemie(max,profil);
 if(bac)ajouter({id:"alcoolemie",titre:"Alcoolémie maximale (effet immédiat sur le cerveau)",zones:["brain"],signe:-1,rr:null,niveau:bac.pic>=0.8?"eleve":bac.pic>=0.5?"modere":"faible",statut:"reglementaire",domaine:"etudie",
  constat:"Jour le plus chargé : "+arrondi(max)+" g d’alcool pur → jusqu’à "+arrondi(bac.pic,2)+" g/L (fourchette "+arrondi(bac.bas,2)+" à "+arrondi(bac.haut,2)+"), éliminé en ≈ "+arrondi(bac.heures,1)+" h. Seuil légal de conduite : 0,5 g/L.",
  pourquoi:"Calcul de Widmark : quantité ÷ (facteur de diffusion × poids). Borne haute : toute la quantité bue d’un coup. L’alcool ralentit le cerveau : vigilance, réflexes et jugement baissent avant même 0,5 g/L.",...SOURCES.searle,source2:SOURCES.route});

 return {moyenne,total,nbJours,categorie:cat,verres,unitesSemaine,jours,domaine,resultats};
}
// Autres maladies (hors cancers) : chaque fonction lit le chiffre publié pour la dose et le sexe.
// `rr` est null quand la publication décrit le sens de l'effet sans chiffre pour ce niveau.
export function autresMaladies({g,verres,femme}){
 const out=[];
 const r=(id,titre,zones,src,o)=>out.push({id,titre,zones,...SOURCES[src],statut:o.rr!=null||o.sansChiffre?"association_observee":"non_documente",niveau:o.niveau??(o.signe>0?"favorable":o.rr==null?"non_chiffre":niveau(o.rr)),...o});
 // Pression artérielle : verres de 12 g, résultats par sexe.
 const ht=femme?(verres>2?B(1.42,1.22,1.66):verres>=1?B(0.94,0.88,1.01):null):(verres>=5?B(1.74,1.35,2.24):verres>=3?B(1.51,1.30,1.76):verres>=1?B(1.19,1.07,1.31):null);
 const essais=verres>2?(verres>=6?" Dans les essais d’au moins 7 jours, réduire de moitié au-delà de 6 verres abaisse la systolique de 5,5 mm Hg.":" Dans les essais d’au moins 7 jours, réduire la consommation au-delà de 2 verres abaisse la pression ; l’effet apparaît en quelques jours."):"";
 r("hypertension","Hypertension artérielle",["aorta","heart"],"roerecke18",ht&&!(femme&&verres<=2)?{signe:-1,...ht,constat:(femme?"Femmes":"Hommes")+", "+(femme?"plus de 2":verres>=5?"5 verres ou plus":verres>=3?"3 à 4":"1 à 2")+" verres par jour comparés aux abstinents."+essais,pourquoi:"L’alcool active le système nerveux sympathique et le système rénine-angiotensine ; la tension monte, puis use les artères, le cœur et les reins.",...(verres>2?{domaine:"etudie"}:{})}
  :{signe:verres>=1?0:0,rr:femme&&verres>=1?0.94:null,bas:femme&&verres>=1?0.88:undefined,haut:femme&&verres>=1?1.01:undefined,niveau:"non_chiffre",constat:femme&&verres>=1?"Femmes, 1 à 2 verres par jour : pas de hausse significative (l’intervalle inclut 1).":"Moins d’un verre par jour : pas de catégorie chiffrée.",pourquoi:"Chez les hommes, toute consommation est associée à une hausse ; chez les femmes, au-delà de 2 verres.",sansChiffre:true});
 // AVC (verres de 12 g).
 const isch=verres<1?B(0.90,0.85,0.95):verres<=2?B(0.92,0.87,0.97):verres<=4?B(1.08,1.01,1.15):B(1.14,1.02,1.28);
 r("avc_isch","AVC ischémique (artère bouchée)",["arteries_head","brain"],"larsson",{signe:isch.rr<1?1:-1,...isch,constat:(verres<1?"Moins d’un verre":verres<=2?"1 à 2 verres":verres<=4?"Plus de 2 à 4 verres":"Plus de 4 verres")+" par jour comparés aux non-buveurs.",pourquoi:"À faible dose, l’alcool fluidifie un peu le sang et augmente le « bon » cholestérol ; à forte dose, tension et troubles du rythme prennent le dessus."});
 if(verres>4){r("avc_hemo","Hémorragie cérébrale",["arteries_head","brain"],"larsson",{signe:-1,...B(1.67,1.25,2.23),constat:"Plus de 4 verres par jour : hémorragie intracérébrale × 1,67 ; hémorragie méningée × 1,82 (1,18–2,82).",pourquoi:"Hypertension et fragilisation des petits vaisseaux du cerveau ; la coagulation est aussi perturbée."});}
 else r("avc_hemo","Hémorragie cérébrale",[],"larsson",{signe:0,rr:null,constat:verres>2?"Au-delà de 2 verres : hausse non significative.":"Pas d’association à faible ou moyenne dose.",pourquoi:"Le risque hémorragique apparaît surtout aux fortes doses."});
 // Cardiopathie ischémique : protection non garantie, pas de chiffre retenu.
 r("coeur_isch","Infarctus et angine de poitrine",verres>=1?["coronary_arteries","heart"]:[],"roerecke12",{signe:0,rr:null,constat:"Une association protectrice existe dans les moyennes, mais les auteurs concluent qu’elle ne peut être supposée pour aucun buveur, même à faible dose : intervalles larges, forte hétérogénéité.",pourquoi:"L’effet sur le cholestérol HDL est contrebalancé par la tension, le poids et le rythme cardiaque."});
 // Diabète de type 2 (Knott 2015).
 const db=g>63?{signe:-1,rr:null,niveau:"non_chiffre",constat:"Au-delà de 63 g/j, le risque augmente (chiffre non donné dans le résumé)."}
  :femme?(g>=10&&g<=14?{signe:1,rr:0.82,niveau:"favorable",sansChiffre:true,constat:"Femmes, 10 à 14 g/j : risque réduit d’environ 18 % (sommet de la courbe publiée ; IC non donné dans le résumé)."}:{signe:1,rr:null,niveau:"favorable",constat:"Femmes, moins de 63 g/j : risque plus bas, maximal entre 10 et 14 g/j."})
  :{signe:0,rr:null,niveau:"non_chiffre",constat:"Hommes : la baisse de risque n’est pas retrouvée dans les données stratifiées."};
 r("diabete","Diabète de type 2",db.signe?["pancreas"]:[],"knott",{...db,pourquoi:"À faible dose, la sensibilité à l’insuline s’améliore ; à forte dose, le pancréas et le foie souffrent. Les auteurs signalent que la baisse est absente quand on compare à de vrais abstinents de toujours."});
 // Pancréatites (Samokhvalov 2015).
 const pa=g>=100?{signe:-1,...B(6.29,3.04,13.02),constat:"Pancréatite chronique à 100 g/j : × 6,29 ; le risque monte sans seuil avec la dose."}
  :g>=40?{signe:-1,rr:null,niveau:"non_chiffre",constat:"Au-delà de 40 g/j, chaque dose supplémentaire augmente le risque de pancréatite aiguë et chronique (chiffre publié à 100 g/j)."}
  :femme?{signe:1,...B(0.76,0.60,0.97),constat:"Femmes, moins de 40 g/j : pancréatite aiguë moins fréquente."}
  :{signe:0,...B(1.1,0.69,1.74),niveau:"non_chiffre",constat:"Hommes, moins de 40 g/j : pas d’association significative pour la pancréatite aiguë."};
 r("pancreatite","Pancréatite",pa.signe?["pancreas"]:[],"samok15",{...pa,pourquoi:"L’alcool rend le suc pancréatique plus épais et active trop tôt les enzymes, qui attaquent le pancréas lui-même."});
 // Os : fractures (Ke 2023), 1,06 par 14 g/j.
 const pas=g/14;
 r("fractures","Fractures (toutes)",["femur_l","femur_r","spine_lumbar","wrist_l","wrist_r"],"ke",{signe:-1,rr:1.06**pas,bas:1.02**pas,haut:1.10**pas,constat:"Calcul : × 1,06 par tranche de 14 g/j, appliqué à "+arrondi(g)+" g/j."+(g<=22?" Pour la hanche et les fractures ostéoporotiques, la courbe est en J : entre 0 et 22 g/j, risque plus bas.":" Au-delà de 22 g/j, la protection de la hanche disparaît."),pourquoi:"L’alcool freine les cellules qui fabriquent l’os, perturbe la vitamine D et le calcium, et augmente les chutes."});
 // Articulations : goutte et hyperuricémie (Ma 2025), polyarthrite (Jin 2014).
 r("goutte","Goutte et acide urique",["foot_l","foot_r","ankle_l","ankle_r"],"ma",{signe:-1,...B(1.69,1.47,1.94),constat:"Buveurs comparés aux non-buveurs ; le risque augmente avec la fréquence. Les hommes sont plus touchés.",pourquoi:"L’alcool augmente la production d’acide urique et freine son élimination par le rein ; les cristaux se déposent dans les articulations, surtout le gros orteil."});
 const ra=interpoler([[3,0.93,0.88,0.98],[9,0.86,0.76,0.97],[12,0.88,0.78,0.99],[15,0.91,0.81,1.03],[30,1.28,0.94,1.73]],g);
 r("polyarthrite","Polyarthrite rhumatoïde",ra?["knee_l","knee_r","wrist_l","wrist_r","hand_l","hand_r"]:[],"jin",ra?{signe:ra.rr<1?1:-1,rr:ra.rr,bas:ra.bas,haut:ra.haut,niveau:ra.rr<1?"favorable":ra.haut>=1&&ra.bas<=1?"non_chiffre":niveau(ra.rr),constat:(ra.exact?"Point publié":"Interpolation entre les points publiés (3, 9, 12, 15 et 30 g/j)")+" pour "+arrondi(g)+" g/j."+(ra.bas<1&&ra.haut>1?" L’intervalle inclut 1 : effet incertain.":""),pourquoi:"À faible dose, l’alcool atténue certaines réponses immunitaires inflammatoires ; l’effet disparaît puis s’inverse vers 30 g/j."}
  :{signe:0,rr:null,constat:g<3?"Moins de 3 g/j : hors des points publiés.":"Au-delà de 30 g/j : hors des points publiés ; à 30 g/j l’effet protecteur a déjà disparu.",pourquoi:"Courbe en U publiée entre 3 et 30 g/j."});
 // Démence (Xu 2017) : valeurs approchées données par les auteurs, sans intervalle.
 r("demence","Démence",g>12.5&&g<38?[]:["brain"],"xu",{pourquoi:"Les vaisseaux du cerveau profitent peut-être des faibles doses ; les fortes doses abîment directement les neurones (voir aussi l’hippocampe).",...(g<=12.5?{signe:1,rr:null,niveau:"favorable",constat:"Jusqu’à 12,5 g/j : risque plus bas, au plus bas (environ − 10 %) vers 6 g/j selon les auteurs."}
  :g>=38?{signe:-1,rr:null,niveau:"faible",constat:"À partir de 38 g/j : risque augmenté d’environ 10 % selon les auteurs (valeur approchée, sans intervalle)."}
  :{signe:0,rr:null,constat:"Entre 12,5 et 38 g/j : ni baisse ni hausse établie."})});
 // Reins : maladie rénale chronique (2021), RR sans IC dans le résumé.
 const irc=femme?null:g<12?0.92:g<=24?0.83:0.76,ircTous=g<12?0.90:g<=24?0.86:0.85;
 r("irc","Maladie rénale chronique",["kidney_l","kidney_r"],"irc",{signe:1,rr:null,niveau:"favorable",constat:"Risque plus bas chez les buveurs : × "+arrondi(ircTous,2)+" (tous) "+(irc?"et × "+arrondi(irc,2)+" chez les hommes ":"")+"pour cette catégorie (léger < 12, modéré 12–24, fort > 24 g/j). Intervalles non donnés dans le résumé.",pourquoi:"Résultat d’études d’observation : les anciens buveurs malades classés « non-buveurs » peuvent créer cette apparence. Il ne tient pas compte de la tension artérielle, qui, elle, abîme les reins quand l’alcool la fait monter."});
 // Infections : tuberculose et pneumonie.
 r("tuberculose","Tuberculose",["lung_l","lung_r"],"imtiaz",{signe:-1,...B(1.35,1.09,1.68),constat:"Consommation d’alcool comparée à l’abstinence ; × 3,33 en cas de problèmes liés à l’alcool. Effet de seuil avec la dose.",pourquoi:"L’alcool affaiblit les macrophages et les lymphocytes qui contiennent le bacille."});
 const pn=interpoler([[24,1.12,1.02,1.23],[60,1.33,1.06,1.67],[120,1.76,1.13,2.77]],Math.min(g,120));
 r("pneumonie","Pneumonie",pn?["lung_l","lung_r"]:[],"samok10",pn?{signe:-1,rr:pn.rr,bas:pn.bas,haut:pn.haut,constat:(pn.exact?"Point publié":"Interpolation entre les points publiés (24, 60, 120 g/j)")+(g>120?" ; dose au-delà de 120 g/j, valeur à 120 g/j affichée.":"."),pourquoi:"L’alcool diminue la toux, le nettoyage des bronches et les défenses ; il facilite aussi les fausses routes."}
  :{signe:0,rr:null,constat:"Moins de 24 g/j : pas de point publié ; le risque augmente de façon continue avec la dose.",pourquoi:"Relation dose-effet monotone."});
 return out;
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

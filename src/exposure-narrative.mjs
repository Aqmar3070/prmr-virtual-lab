// Lecture locale des apports explicitement décrits. Les durées sont des jours entiers.
import {fold} from "./exposure-evidence.mjs";

const mots={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,quatorze:14,quinze:15,trente:30,cinquante:50,cent:100};
const boissons=[
 ["bière",/\bbieres?\b/],["vin",/\bvins?\b/],["alcool",/\balcool\b/],
 ["boisson énergisante",/\bboissons? energisantes?\b/]
];
export const connaissances={
 alcool:[
  ["Cerveau · pendant la consommation","L’éthanol agit sur le système nerveux et peut altérer le jugement et la coordination. La quantité de boisson seule ne détermine pas l’alcoolémie.","OMS","https://www.who.int/news-room/fact-sheets/detail/alcohol"],
  ["Foie · expositions répétées","La consommation d’alcool contribue aux maladies du foie, dont la cirrhose. Le risque dépend notamment de la quantité et du mode de consommation. Une durée de prise saisie ne permet pas de dater une maladie.","OMS","https://www.who.int/news-room/fact-sheets/detail/alcohol"],
  ["Œsophage, foie et côlon-rectum · long terme","Le métabolisme de l’alcool produit de l’acétaldéhyde, qui peut endommager l’ADN. Le lien avec plusieurs cancers est établi dans les populations étudiées.","National Cancer Institute","https://www.cancer.gov/about-cancer/causes-prevention/risk/alcohol/alcohol-fact-sheet"]
 ],
 cafeine:[["Sommeil · soirée","Une prise de 100 mg près du coucher peut modifier le sommeil chez certains adultes. Pour comparer le récit à ce repère, la quantité et l’horaire doivent être connus.","EFSA","https://www.efsa.europa.eu/en/topics/topic/caffeine"]]
};
export function themeProduit(nom){
 const n=fold(nom);
 if(/sans alcool|desalcoolise/.test(n))return null;
 if(/\b(bieres?|vins?|cidres?|alcool|whisky|vodka|rhum|pastis)\b/.test(n))return "alcool";
 if(/\bcafeine\b/.test(n))return "cafeine";
 return null;
}
export function lireRecit(texte,produits){
 const resultats=[];
 const continu=texte.replace(/(\d)[ \t]*\r?\n[ \t]*(?=(?:jours?|semaines?|cl|ml|mg|g|%|degrés?)\b)/giu,"$1 ")
  .replace(/\r?\n(?=\s*(?:pendant|depuis|durant|chaque|par jour|tous les)\b)/giu," ")
  .replace(/\b(pendant|depuis|durant)\s*\n\s*/giu,"$1 ");
 const passages=continu.split(/(?:[;\n]+|(?<=[.!?])\s+|\s+et\s+(?=je\b|j[’']|(?:du |de la |un |une )?(?:caféine|bière|vin|ibuprofène|paracétamol|metformine)\b))/iu);
 for(const passage of passages){
  const brut=fold(passage).replace(/[’']/g," ").trim();
  if(!brut)continue;
  const ligne=brut.replace(/\b(trente[- ]trois|vingt[- ]cinq)\b/g,m=>m.startsWith("trente")?"33":"25").replace(/\b(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quatorze|quinze|trente|cinquante|cent)\b/g,m=>String(mots[m]));
  const boisson=boissons.find(([,mot])=>mot.test(ligne));
  const direct=["cafeine","ibuprofene","paracetamol","metformine"].filter(k=>new RegExp("\\b"+k+"\\b").test(ligne));
  const mesures=[...ligne.matchAll(/(\d+(?:[.,]\d+)?)\s*(millilitres?|centilitres?|litres?|milligrammes?|grammes?|ml|cl|l|mg|g)\b/g)].filter(m=>!/^\s*\//.test(ligne.slice(m.index+m[0].length)));
  let nom=boisson?.[0]||direct[0];
  let produit=produits.get(direct[0]);
  if(boisson){nom=boisson[0];produit={id:"recit:"+nom,name:nom,unit:"mL",family:4,source:"Récit · composition déclarée"};}
  if(!nom){
   const terme=brut.replace(/^(je (?:consomme|prends|mange|bois)\s+(?:du |de la |des |de l )?)/,"").split(/[,;:]|\s+\d/)[0].trim();
   if(terme.length<2)continue;
   produit=[...produits.values()].find(p=>fold(p.name)===terme);nom=produit?.name;
  }
  if(!produit||!nom)continue;
  const notes=[];
  const dureeHorsFormat=/\b(?:pendant|depuis|durant|sur)\s+\S+\s+heures?\b/.test(ligne);
  const frequenceVariable=/\b(?:par|chaque) (?:week.end|mois)|\b(?:le|les) (?:samedi|dimanche)|occasionnel|de temps en temps/.test(ligne);
  const interrogation=passage.includes("?")||/\b(?:pourrais|pourrait|devrais|devrait)\b/.test(ligne);
  const horsVoie=direct.includes("ibuprofene")&&!/\b(?:oral|orale|comprimes?|gelules?|avale|avaler)\b/.test(ligne);
  if(horsVoie)notes.push("Précisez la voie orale pour utiliser la fiche d’ibuprofène oral.");
  if(dureeHorsFormat||frequenceVariable)notes.push("Le calendrier décrit demande une vérification.");
  
  const ambigu=dureeHorsFormat||frequenceVariable||interrogation||horsVoie||/\d+\s*(?:a|ou|-)\s*\d+|\d+\s*(?:fois|x)\b|\b(?:matin et soir|un jour sur|tous les \d+ jours)\b/.test(ligne)||(!boisson&&direct.length>1)||(boisson&&direct.some(k=>k!=="cafeine"))||/\b(pas|jamais|aucun|sans|si|hypothese|prescrit|arrete|arreter)\b/.test(ligne)||/\bpar semaine|chaque semaine|fois par semaine|tous les deux jours|\bpuis\b|redui|a partir|\bdemi\b/.test(ligne);
  let quantite=null,alcoolPur=false;
  if(mesures.length===1&&!ambigu){
   const m=mesures[0],unite=m[2],val=Number(m[1].replace(",","."));
   if(produit.unit==="mL"&&/^(ml|cl|l|millilitre|centilitre|litre)/.test(unite))quantite=val*(/^(cl|centilitre)/.test(unite)?10:/^(l|litre)/.test(unite)?1000:1);
   // « 50 g d’alcool » : masse d’alcool pur, convertie en volume d’éthanol (0,789 g/mL) à 100 % vol.
   if(boisson?.[0]==="alcool"&&/^(g|gramme)/.test(unite)){quantite=Math.round(val/0.789*100)/100;alcoolPur=true;}
   if(produit.unit==="mg"&&/^(mg|milligramme|g|gramme)/.test(unite))quantite=val*(/^g/.test(unite)?1000:1);
   if(produit.unit==="g"&&/^(g|gramme)/.test(unite))quantite=val;
   const nombre=ligne.match(/\b(\d+)\s+(?:canettes?|bouteilles?|verres?|bieres?|comprimes?)\s+(?:de|a)\s+\d/);
   if(nombre&&quantite!=null)quantite*=Number(nombre[1]);
  }
  const duree=ligne.match(/(?:pendant|depuis|durant|sur)\s+(\d+)\s*(jours?|semaines?|mois|ans?|annees?)\b/);
  const jours=duree?Number(duree[1])*({s:7,m:30,a:365}[duree[2][0]]||1):1;
  const explicite=/par jour|chaque jour|tous les jours|quotidien|chaque soir|tous les soirs|\/j\b/.test(ligne);
  // Durée donnée sans fréquence : hypothèse d’une prise quotidienne, affichée et modifiable.
  const quotidien=explicite||Boolean(duree&&!ambigu);
  if(duree&&!explicite&&!ambigu&&jours>1)notes.push("Fréquence non précisée : prise quotidienne supposée. Corrigez-la si besoin.");
  if(ambigu||mesures.length>1)notes.push("Plusieurs interprétations possibles. Vérifiez les quantités et le calendrier.");
  if(!quantite)notes.push("Quantité à préciser avec son unité.");
  if(!duree&&!ambigu)notes.push("Le calcul porte sur une journée déclarée.");
  if(jours>730)notes.push("Horizon supérieur aux 730 jours du graphique.");
  const degre=ligne.match(/(\d+(?:[.,]\d+)?)\s*(?:%|°|degres?\b)/);
  const abv=alcoolPur?100:boisson&&degre?Number(degre[1].replace(",",".")):null;
  if(alcoolPur)notes.push("Quantité lue comme alcool pur, en grammes.");
  if(themeProduit(nom)==="alcool"&&abv===null)notes.push("Le degré d’alcool de l’étiquette permet de calculer l’alcool pur.");
  const valide=quantite>0&&jours>=1&&jours<=730&&(quotidien||jours===1)&&(abv===null||abv<=100);
  resultats.push({produit,theme:themeProduit(nom),notes,row:valide?{id:produit.id,qty:quantite,after:quantite,start:0,reduce:jours,end:jours,abv,label:alcoolPur?"Alcool pur déclaré (g)":abv!==null?"Degré déclaré":"",bed:/pres du coucher|avant de dormir/.test(ligne),long:false}:null});
 }
 return resultats;
}

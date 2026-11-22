// Monographies de plantes de l'Agence européenne du médicament (comité HMPC).
// Fichier produit par scripts/extraire_monographies.py : research-data/monographies-ema.json.gz.
// Le texte des rubriques est celui de la monographie officielle, en anglais ; il n'est ni résumé ni complété.
import {doseAt,fold} from "./exposure-evidence.mjs";

// Nom français courant → genre latin utilisé par l'EMA.
export const NOMS_FR={
 gingembre:"zingiberis",curcuma:"curcumae",ginseng:"ginseng",guarana:"paulliniae",mate:"mate",the:"camelliae",
 millepertuis:"hyperici",reglisse:"liquiritiae",menthe:"menthae",camomille:"matricariae",
 valeriane:"valerianae",ail:"allii",oignon:"allii",cannelle:"cinnamomi",romarin:"rosmarini",thym:"thymi",girofle:"caryophylli",
 fenugrec:"trigonellae",fenouil:"foeniculi",lin:"lini",kola:"colae",cola:"colae",absinthe:"absinthii",
 aloes:"aloes",aloe:"aloes",sene:"sennae",artichaut:"cynarae",ortie:"urticae",passiflore:"passiflorae",melisse:"melissae",
 lavande:"lavandulae",tilleul:"tiliae",aubepine:"crataegi",echinacee:"echinaceae",ginkgo:"ginkgo",harpagophyton:"harpagophyti",
 prele:"equiseti",pissenlit:"taraxaci",psyllium:"plantaginis",plantain:"plantaginis",sauge:"salviae",eucalyptus:"eucalypti",
 anis:"anisi",houblon:"lupuli",avoine:"avenae",sureau:"sambuci",bouleau:"betulae",chardon:"silybi",rhubarbe:"rhei",
 bourdaine:"frangulae",calendula:"calendulae",souci:"calendulae",olivier:"oleae",olive:"oleae",genevrier:"juniperi",
 verge:"solidaginis",orthosiphon:"orthosiphonis",vigne:"vitis",myrtille:"myrtilli",lierre:"hederae",primevere:"primulae",
 rose:"rosae",arnica:"arnicae",euphraise:"euphrasiae",gattilier:"agni",cimicifuga:"cimicifugae",actee:"cimicifugae"
};

// Nom français d'une plante de l'EMA, d'après son genre latin (premier nom de la table).
const ACCENTS={the:"Thé",reglisse:"Réglisse",valeriane:"Valériane",melisse:"Mélisse",aubepine:"Aubépine",echinacee:"Échinacée",prele:"Prêle",sene:"Séné",
 genevrier:"Genévrier",primevere:"Primevère",aloes:"Aloès",verge:"Verge d’or",actee:"Actée à grappes",the_vert:"Thé vert"};
export function nomFrancais(pl){
 const genre=fold(pl?.latin||"").split(/[^a-z]+/)[0];if(!genre)return "";
 const mot=Object.keys(NOMS_FR).find(k=>NOMS_FR[k].slice(0,5)===genre.slice(0,5));
 return mot?(ACCENTS[mot]||mot[0].toUpperCase()+mot.slice(1)):"";
}
export async function chargerMonographies(url="./research-data/monographies-ema.json.gz"){
 const res=await fetch(url);if(!res.ok)throw Error("monographies indisponibles");
 const flux=res.body.pipeThrough(new DecompressionStream("gzip"));
 return new Response(flux).json();
}

// Retrouve la monographie d'un produit : identifiant « ema: » direct, sinon nom français ou latin.
export function plantePour(produit,donnees){
 if(!produit||!donnees?.plantes)return null;
 if(produit.id?.startsWith("ema:"))return donnees.plantes[Number(produit.id.slice(4))]||null;
 const nom=fold(produit.name||"");
 // Le kola amer (Garcinia kola) n'est pas la noix de kola (Cola) de la monographie européenne.
 if(/garcinia|kola amer|bitter kola/.test(nom))return null;
 const genres=new Set();
 for(const mot of nom.split(/[^a-z]+/)){if(NOMS_FR[mot])genres.add(NOMS_FR[mot]);}
 const candidats=[];
 for(const p of donnees.plantes){
  const latin=fold(p.latin||"");
  const genre=latin.split(/[^a-z]+/)[0];
  // Le latin de l'EMA est au génitif (Hyperici herba, Zingiberis rhizoma) : comparaison sur le radical.
  if(genre&&[...genres].some(g=>genre.slice(0,5)===g.slice(0,5)))candidats.push(p);
 }
 // Monographie complète d'une plante seule d'abord (pas une association).
 const huile=/\b(huile|essentielle)\b/.test(nom);
 const poids=p=>RUBRIQUES.filter(([k])=>p[k]).length*10-((p.latin||"").includes(";")?50:0)-(/aetheroleum/i.test(p.latin||"")!==huile?30:0)-(p.latin||"").length/100;
 if(candidats.length)return candidats.sort((a,b)=>poids(b)-poids(a))[0];
 return null;
}

const RUBRIQUES=[
 ["indications","Usages reconnus (indications officielles)",1],
 ["posologie","Doses étudiées et durée d’usage",0],
 ["contre_indications","Contre-indications",-1],
 ["mises_en_garde","Mises en garde",-1],
 ["interactions","Interactions avec médicaments et autres substances",-1],
 ["grossesse","Grossesse, allaitement, fertilité",-1],
 ["effets_indesirables","Effets indésirables",-1],
 ["surdosage","Surdosage",-1],
];
function zones(texte){
 const t=fold(texte),z=new Set();
 if(/gastro|stomach|nausea|vomit|diarrh|abdominal|heartburn|dyspeps/.test(t))z.add("stomach");
 if(/liver|hepat/.test(t))z.add("liver");
 if(/kidney|renal/.test(t)){z.add("kidney_l");z.add("kidney_r");}
 if(/skin|rash|urticaria|pruritus|photosensit/.test(t))z.add("skin");
 if(/bleeding|anticoagul|platelet/.test(t))z.add("heart");
 if(/blood pressure|hypotension|hypertension|cardiac|\bheart\b(?!burn)/.test(t))z.add("heart");
 if(/headache|dizziness|sleep|seizure|nervous/.test(t))z.add("brain");
 return [...z];
}

export function fichesMonographies(rows,lookup,donnees,duree){
 if(!donnees?.plantes)return [];
 const vues=new Map();
 for(const r of rows){
  const p=lookup(r.id),pl=plantePour(p,donnees);if(!pl||vues.has(pl))continue;
  let jours=0,g=0;for(let t=0;t<=duree;t++){const d=doseAt(r,t);if(d>0){jours++;g=Math.max(g,d);}}
  vues.set(pl,{p,jours,g,unite:p.unit});
 }
 const fiches=[];
 for(const [pl,{p,jours,g,unite}] of vues){
  const resultats=RUBRIQUES.filter(([k])=>pl[k]).map(([k,titre,signe])=>{
   const vide=/^(none|not applicable|none reported|none known)\b/i.test(pl[k].trim());
   const freq=fold(pl[k]).match(/frequence : (tres frequent|frequent|peu frequent|tres rare|rare|inconnue)/)?.[1];
   return {id:"ema_"+k,titre,zones:!vide&&signe!==0?zones(pl[k]):[],signe:vide?0:signe,
    niveau:k==="indications"?"favorable":k!=="effets_indesirables"||vide?"non_chiffre":/^(tres frequent|frequent)$/.test(freq||"")?"modere":"faible",
    badge:k==="effets_indesirables"&&!vide?(freq?freq.replace("tres","très").replace("frequent","fréquent"):"fréquence inconnue"):vide?"aucun":"texte officiel",rr:null,statut:k==="effets_indesirables"?"pharmacovigilance":"reglementaire",domaine:"etudie",
    constat:pl[k],pourquoi:"Texte officiel de la monographie européenne (en anglais), rubrique "+({indications:"4.1",posologie:"4.2",contre_indications:"4.3",mises_en_garde:"4.4",interactions:"4.5",grossesse:"4.6",effets_indesirables:"4.8",surdosage:"4.9"}[k])+".",
    source:"EMA · monographie de l’Union européenne · "+(pl.latin||pl.commun),url:pl.monographie||pl.page};
  });
  if(!resultats.length)continue;
  // Plus forte quantité citée dans la posologie (g ou mg), comparée à la quantité saisie en grammes.
  const quantites=[...(pl.posologie||"").matchAll(/(\d+(?:[.,]\d+)?)\s*(mg|g)\b/g)].map(m=>Number(m[1].replace(",","."))/(m[2]==="mg"?1000:1));
  const maxi=quantites.length?Math.max(...quantites):null;
  if(maxi&&unite==="g"&&g>maxi)resultats.unshift({id:"ema_depassement",titre:"Quantité saisie au-delà de la posologie",zones:[],signe:0,niveau:"modere",badge:"× "+Math.round(g/maxi),rr:null,statut:"reglementaire",domaine:"extrapole",
   constat:"Quantité saisie : "+g+" g par jour. Plus forte quantité citée dans la posologie de la monographie : "+maxi+" g (par prise ou par jour selon le texte). Au-delà, la monographie ne garantit plus la sécurité d’emploi et aucun effet n’y est chiffré.",
   pourquoi:"Les effets indésirables listés ont été observés aux doses de la posologie ; une quantité très supérieure sort du domaine étudié.",source:"EMA · monographie de l’Union européenne · "+(pl.latin||pl.commun),url:pl.monographie||pl.page});
  fiches.push({id:"ema_"+fold(pl.latin||pl.commun).replace(/[^a-z]+/g,"_"),titre:"Monographie européenne · "+(p.name||pl.commun),unite:"",moyenne:0,nbJours:jours,total:0,
   entete:["Plante : "+[pl.latin,pl.commun].filter(Boolean).join(" · ")+".",
    "Quantité saisie : "+g+" "+unite+" par jour sur "+jours+" jour"+(jours>1?"s":"")+". Comparer avec les doses de la rubrique « Doses étudiées » : au-delà, aucun effet n’est chiffré par la monographie."],
   equivalences:[],resultats});
 }
 return fiches;
}

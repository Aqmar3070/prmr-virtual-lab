// Effets indésirables exhaustifs des notices officielles (rubrique 4.8 des RCP, BDPM),
// extraits automatiquement pour chaque combinaison de substances actives du catalogue.
import {doseAt,fold} from "./exposure-evidence.mjs";
import {FREQUENCES} from "./exposure-agents.mjs";

const ORDRE=["tres_frequent","frequent","peu_frequent","rare","tres_rare","indeterminee","non_precisee"];
const LIBELLES={...Object.fromEntries(Object.entries(FREQUENCES).map(([k,v])=>[k,v])),non_precisee:{badge:"cité",texte:"fréquence non précisée dans la notice",niveau:"non_chiffre"}};
// Classe de systèmes d'organes (MedDRA) → structures de l'atlas 3D.
const ZONES=[
 [/hemato|sang|lymphati/,["spleen"]],[/cardiaque/,["heart"]],[/vasculaire/,["aorta","arteries_thorax"]],
 [/respiratoire|thorac/,["lung_l","lung_r","trachea"]],[/gastro|digesti/,["stomach","small_intestine","colon"]],
 [/hepat|biliaire/,["liver","gallbladder"]],[/rein|urinaire/,["kidney_l","kidney_r","bladder"]],
 [/peau|cutane/,["skin"]],[/musculo|squelett|os\b|conjonctif/,["femur_l","femur_r","knee_l","knee_r"]],
 [/nerveux/,["brain","spinal_cord"]],[/psychiatr/,["brain"]],[/oculaire|oeil/,["eye_l","eye_r"]],
 [/oreille/,["brain"]],[/endocrin/,["adrenal_l","adrenal_r","pituitary"]],[/metabolisme|nutrition/,["pancreas","liver"]],
 [/reproduction|sein/,["reproductive","breast_l","breast_r"]],[/grossesse|puerper/,["uterus"]],[/immunitaire/,["spleen","thymus"]]
];
export function zonesDeClasse(classe){const c=fold(classe||"");for(const [re,z] of ZONES)if(re.test(c))return z;return [];}

let cache=null;
export async function chargerNotices(url="./research-data/notices-effets.json.gz"){
 if(cache)return cache;
 cache=(async()=>{
  const res=await fetch(url);if(!res.ok)throw Error("notices indisponibles");
  const octets=await res.arrayBuffer();
  const brut=new Uint8Array(octets)[0]===31?await new Response(new Blob([octets]).stream().pipeThrough(new DecompressionStream("gzip"))).json():JSON.parse(new TextDecoder().decode(octets));
  return brut;
 })();
 return cache;
}

// Clé de combinaison d'une prise : substances actives d'une spécialité, ou substance seule.
export function cleNotice(produit,lookup,produits){
 if(!produit)return null;
 if(produit.id.startsWith("cis"))return [...new Set(produit.active||[])].sort().join("+")||null;
 if(produit.id.startsWith("sa"))return produit.id.slice(2);
 // Substance publiée par son nom (paracétamol, ibuprofène…) : substance active BDPM du même nom.
 const nom=fold(produit.name).replace(/\b(oral|orale)\b/g,"").trim();
 for(const p of produits.values())if(p.id.startsWith("sa")&&fold(p.name)===nom)return p.id.slice(2);
 return null;
}

export function fichesNotices(rows,lookup,produits,donnees,duree){
 if(!donnees?.notices)return [];
 const vues=new Map();
 for(const r of rows){
  const p=lookup(r.id),cle=cleNotice(p,lookup,produits);if(!cle||vues.has(cle))continue;
  let jours=0;for(let t=0;t<=duree;t++)if(doseAt(r,t)>0)jours++;
  const n=donnees.notices[cle];if(n)vues.set(cle,{n,p,jours});
 }
 const fiches=[];
 for(const {n,p,jours} of vues.values()){
  const parClasse=new Map();
  for(const e of n.effets||[]){const k=e.classe||"Autres";if(!parClasse.has(k))parClasse.set(k,[]);parClasse.get(k).push(e);}
  const resultats=[...parClasse.entries()].map(([classe,effets],i)=>{
   effets.sort((a,b)=>ORDRE.indexOf(a.frequence)-ORDRE.indexOf(b.frequence));
   const top=LIBELLES[effets[0].frequence]||LIBELLES.non_precisee;
   const lignes=ORDRE.filter(f=>effets.some(e=>e.frequence===f)).map(f=>(LIBELLES[f]||LIBELLES.non_precisee).texte.split(" :")[0].replace(/^./,c=>c.toUpperCase())+" ("+(LIBELLES[f]||LIBELLES.non_precisee).badge+") : "+effets.filter(e=>e.frequence===f).map(e=>e.effet).join(" ; "));
   return {id:"notice_"+i,titre:classe.replace(/\s*:$/,""),zones:zonesDeClasse(classe),signe:-1,niveau:top.niveau,badge:effets.length+" effet"+(effets.length>1?"s":"")+" · "+top.badge,rr:null,statut:"pharmacovigilance",domaine:"etudie",
    constat:lignes.join("\n"),pourquoi:"Effets indésirables observés en pratique (essais et pharmacovigilance) et recensés dans la notice officielle, du plus fréquent au plus rare. Les effets « rares » et « très rares » sont ceux qu’on n’attend pas : ils figurent ici sans tri.",
    source:"BDPM · RCP de "+n.nom+", rubrique 4.8",url:n.url};
  });
  if(!resultats.length)resultats.push({id:"notice_vide",titre:"Notice sans liste structurée",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"pharmacovigilance",domaine:"etudie",
   constat:n.remarque||"La rubrique 4.8 de cette notice ne présente pas les effets sous une forme lisible automatiquement ; ouvrez la notice officielle.",pourquoi:"Aucun effet n’est inventé pour combler le vide.",source:"BDPM · RCP de "+n.nom,url:n.url});
  fiches.push({id:"notice_"+n.cis,titre:"Notice officielle · "+(p.name||n.nom),unite:"",moyenne:0,nbJours:jours,total:0,
   entete:[(n.effets||[]).length+" effets indésirables recensés, classés par organe et par fréquence (lu le "+n.lu+").",jours+" jour"+(jours>1?"s":"")+" de prise dans le scénario."],equivalences:[],resultats});
 }
 return fiches;
}

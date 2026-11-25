// Recherche par symptômes : une maladie reste affichée tant qu'elle présente TOUS les symptômes cochés.
// Données : research-data/symptomes.json (symptômes principaux des fiches du Manuel MSD).
import {plier} from "./maladies.mjs";

const SEXES={female:"F",male:"H"};
export const compatibleSexe=(m,sexe)=>!m.sexe||!SEXES[sexe]||m.sexe===SEXES[sexe];

// Maladies qui réunissent tous les symptômes choisis, les plus « complètes » d'abord.
export function filtrer(data,choix,sexe){
 const liste=[...choix];
 return data.maladies
  .filter(m=>compatibleSexe(m,sexe)&&liste.every(s=>m.symptomes.includes(s)))
  .map(m=>({m,part:liste.length?liste.length/m.symptomes.length:0}))
  .sort((a,b)=>b.part-a.part||a.m.nom.localeCompare(b.m.nom,"fr"))
  .map(x=>x.m);
}

// Symptômes qui départagent le mieux les maladies restantes (présents chez environ la moitié).
export function departager(restantes,choix,max=8){
 if(restantes.length<2)return [];
 const n=new Map();
 for(const m of restantes)for(const s of m.symptomes)if(!choix.has(s))n.set(s,(n.get(s)||0)+1);
 return [...n].filter(([,c])=>c<restantes.length)
  .sort((a,b)=>Math.min(b[1],restantes.length-b[1])-Math.min(a[1],restantes.length-a[1])||b[1]-a[1])
  .slice(0,max).map(([s])=>s);
}

export function urgence(data,choix){
 return data.urgence.some(s=>choix.has(s))||(choix.has("fievre")&&choix.has("raideur_nuque"));
}

export function zonesDe(data,choix){
 const z=new Set();
 for(const s of data.symptomes)if(choix.has(s.id))for(const x of s.zones)z.add(x);
 return [...z];
}

export function chercher(data,texte){
 const q=plier(texte.trim());
 return q?data.symptomes.filter(s=>plier(s.nom+" "+s.groupe).includes(q)):[];
}

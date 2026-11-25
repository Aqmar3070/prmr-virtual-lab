// Recherche par symptômes : une maladie reste affichée tant qu'elle présente TOUS les symptômes cochés.
// Données : research-data/symptomes.json (symptômes principaux des fiches du Manuel MSD).
import {plier} from "./maladies.mjs";

const SEXES={female:"F",male:"H"};
export const compatibleSexe=(m,sexe)=>!m.sexe||!SEXES[sexe]||m.sexe===SEXES[sexe];

// Maladies classées par nombre de symptômes en commun : un symptôme atypique n'élimine plus une maladie.
// Chaque résultat porte {m, communs, absents} ; les plus concordantes d'abord.
export function filtrer(data,choix,sexe){
 const liste=[...choix];
 if(!liste.length)return [];
 return data.maladies.filter(m=>compatibleSexe(m,sexe)).map(m=>{
  const communs=liste.filter(s=>m.symptomes.includes(s));
  return {m,communs,absents:liste.filter(s=>!m.symptomes.includes(s))};
 }).filter(r=>r.communs.length)
  .sort((a,b)=>b.communs.length-a.communs.length||b.communs.length/b.m.symptomes.length-a.communs.length/a.m.symptomes.length||a.m.nom.localeCompare(b.m.nom,"fr"));
}

// Symptômes qui départagent le mieux les maladies restantes (présents chez environ la moitié).
export function departager(resultats,choix,max=8){
 // On départage les maladies du meilleur niveau de concordance.
 const top=resultats[0]?.communs.length||0,restantes=resultats.filter(r=>r.communs.length===top).map(r=>r.m);
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

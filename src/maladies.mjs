// Registre des maladies : pour une maladie et un stade, les substances étudiées,
// classées par force de preuve. Règle : rien n'est classé sans essai cité.
// Trois niveaux d'essais chez l'humain, puis les pistes à confirmer.
export const FORCES={
 forte:{rang:0,libelle:"Efficacité forte",groupe:"Essais cliniques chez l'humain",couleur:"#0fb3ad"},
 moyenne:{rang:1,libelle:"Efficacité moyenne",groupe:"Essais cliniques chez l'humain",couleur:"#ff8419"},
 faible:{rang:2,libelle:"Efficacité faible ou incertaine",groupe:"Essais cliniques chez l'humain",couleur:"#ffc89a"},
 cas:{rang:3,libelle:"Cas rapportés et témoignages",groupe:"Observations individuelles, sans groupe de comparaison",couleur:"#ffdcbd"},
 preclinique:{rang:4,libelle:"Préclinique",groupe:"Études chez l'animal ou sur cellules",couleur:"#ffeedd"},
 theorique:{rang:5,libelle:"Piste théorique",groupe:"Hypothèses à tester",couleur:"#ffffff"}
};
export const TYPES={medicament:"Médicament",naturel:"Substance naturelle",regime:"Régime ou mode de vie",geste:"Geste médical ou chirurgical"};

export const plier=t=>String(t||"").replace(/[’ʼ`]/g,"'").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

export function chercherMaladies(registre,texte){
 const q=plier(texte).trim();
 if(!q)return registre.maladies;
 return registre.maladies.filter(m=>[m.nom,...(m.synonymes||[])].some(n=>plier(n).includes(q)||q.includes(plier(n))));
}

// Une substance s'applique au stade si la plage de DFG de l'essai chevauche celle du stade,
// ou si le stade figure dans sa liste. Sans plage ni liste publiée : tous les stades, avec mention.
export function concerne(substance,stade){
 if(!stade)return true;
 if(Array.isArray(substance.stades))return substance.stades.includes(stade.id);
 if(Array.isArray(substance.dfg)&&Array.isArray(stade.dfg))return substance.dfg[0]<=stade.dfg[1]&&substance.dfg[1]>=stade.dfg[0];
 return true;
}

export function substancesPour(maladie,stadeId){
 const stade=maladie.stades?.find(s=>s.id===stadeId)||null;
 return maladie.substances
  .filter(s=>concerne(s,stade))
  // Du plus puissant au moins puissant : niveau de preuve, puis nature du bénéfice
  // (maladie évitée, DFG, marqueurs), puis taille de l'effet mesuré.
  .sort((a,b)=>FORCES[a.force].rang-FORCES[b.force].rang||(a.critere??9)-(b.critere??9)||(b.puissance??0)-(a.puissance??0)||(a.rr??1)-(b.rr??1)||a.nom.localeCompare(b.nom,"fr"));
}

export function zonesPour(maladie,stadeId){
 const stade=maladie.stades?.find(s=>s.id===stadeId);
 return {zones:stade?.zones||maladie.zones,niveau:stade?.niveau||"modere"};
}

export function plageEtudiee(s){
 if(Array.isArray(s.dfg))return "DFG étudié : "+s.dfg[0]+" à "+(s.dfg[1]>=200?"plus de 90":s.dfg[1])+" mL/min/1,73 m²";
 if(Array.isArray(s.stades))return null;
 return "Plage de DFG non précisée dans la source : affiché pour tous les stades";
}

// Rapport de risque publié : champ rr, sinon « HR 0,61 ; IC 95 % 0,51 à 0,72 » écrit dans le résultat.
const MOTIF=/\b(HR|RR|OR|risque relatif)\s*(?:de\s*)?(\d+(?:,\d+)?)\s*[;,(]\s*IC\s*95\s*%\s*:?\s*(\d+(?:,\d+)?)\s*(?:à|-|–)\s*(\d+(?:,\d+)?)/;
const nombre=t=>Number(String(t).replace(",","."));
export function rapportPublie(s){
 if(s.rr!=null&&s.bas!=null&&s.haut!=null)return {rr:s.rr,bas:s.bas,haut:s.haut};
 const m=MOTIF.exec((s.effet||"")+" "+(s.resume||""));
 if(!m)return null;
 const r={rr:nombre(m[2]),bas:nombre(m[3]),haut:nombre(m[4])};
 return r.bas>0&&r.bas<=r.rr&&r.rr<=r.haut?r:null;
}

// ---- Profil du patient : comparer sa situation aux populations réellement étudiées ----
// Chaque substance peut porter « profil » : causes étudiées et critères d'inclusion des essais
// (plages repris mot pour mot des publications). Aucune décision de traitement n'en découle :
// on indique seulement si des patients comparables ont été étudiés.
export const CHAMPS_PROFIL={
 dfg:{libelle:"DFG",unite:"mL/min/1,73 m²"},
 rac:{libelle:"Albumine/créatinine urinaire",unite:"mg/g"},
 bicarbonate:{libelle:"Bicarbonate sanguin",unite:"mmol/L"}
};
const dans=(v,[a,b])=>(a==null||v>=a)&&(b==null||v<=b);
const plageTexte=([a,b],u)=>a==null?"jusqu’à "+b+" "+u:b==null?"au moins "+a+" "+u:a+" à "+b+" "+u;
export function decrireProfil(p,causes){
 if(!p)return null;
 const morceaux=[];
 if(p.causes?.length)morceaux.push("cause : "+p.causes.map(c=>causes?.find(x=>x.id===c)?.nom||c).join(" ou "));
 const crit=(p.criteres||[]).map(c=>Object.entries(CHAMPS_PROFIL).filter(([k])=>c[k]).map(([k,f])=>f.libelle+" "+plageTexte(c[k],f.unite)).concat(c.note?[c.note]:[]).join(", ")).filter(Boolean);
 if(crit.length)morceaux.push(crit.join(" ; ou "));
 return morceaux.join(" · ");
}
export function evaluerProfil(s,patient,causes){
 const p=s.profil;
 if(!p)return {statut:"non_precise",raisons:["Profil des patients non précisé dans la source"]};
 if(p.causes?.length&&patient.cause&&!p.causes.includes(patient.cause))
  return {statut:"hors",raisons:["Étudié seulement en cas de "+p.causes.map(c=>causes?.find(x=>x.id===c)?.nom||c).join(" ou ")]};
 const manqueCause=p.causes?.length&&!patient.cause;
 const criteres=p.criteres?.length?p.criteres:[{}];
 let meilleur=null;
 for(const c of criteres){
  const hors=[],manque=[];
  for(const [k,f] of Object.entries(CHAMPS_PROFIL)){
   if(!c[k])continue;
   const v=patient[k];
   if(v==null||v===""||Number.isNaN(v))manque.push(f.libelle);
   else if(!dans(v,c[k]))hors.push(f.libelle+" "+v+" hors de la plage étudiée ("+plageTexte(c[k],f.unite)+")");
  }
  const r={hors,manque};
  if(!hors.length&&!manque.length&&!manqueCause)return {statut:"etudie",raisons:["Patients comparables étudiés"+(c.note?" ("+c.note+")":"")]};
  if(!meilleur||hors.length<meilleur.hors.length)meilleur=r;
 }
 if(!meilleur.hors.length)return {statut:"a_preciser",raisons:["À préciser : "+[...(manqueCause?["cause de la maladie"]:[]),...meilleur.manque].join(", ")]};
 return {statut:"hors",raisons:meilleur.hors};
}
export const profilActif=patient=>Object.values(patient||{}).some(v=>v!==""&&v!=null&&!Number.isNaN(v));

// Trois rubriques : Guéris (guérisons obtenues + cas), Testés (études), Pistes (jamais testé).
// Un cas compte comme guérison rapportée sauf s'il ne décrit qu'une amélioration ou une stabilisation (gueri:false).
export const estGuerisonRapportee=s=>s.force==="cas"&&s.gueri!==false;
export const pourGueris=(m,liste)=>({obtenues:(m?.guerison||[]).filter(g=>g.type==="obtenue"),cas:liste.filter(estGuerisonRapportee)});
export const pourTestes=liste=>liste.filter(s=>!estGuerisonRapportee(s)&&s.force!=="theorique");
export function pourPistes(m,liste,stadeId){
 const st=m?.stades?.find(s=>s.id===stadeId);
 const pistes=(m?.pistes||[]).filter(h=>{
  if(!st?.dfg)return true;
  const crit=(h.profil?.criteres||[]).filter(c=>c.dfg);
  return !crit.length||crit.some(c=>(c.dfg[0]??0)<=st.dfg[1]&&(c.dfg[1]??1e9)>=st.dfg[0]);
 });
 return {pistes,combinaisons:(m?.guerison||[]).filter(g=>g.type!=="obtenue"),theoriques:liste.filter(s=>s.force==="theorique")};
}

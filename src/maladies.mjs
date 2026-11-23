// Registre des maladies : pour une maladie et un stade, les substances étudiées,
// classées par force de preuve. Règle : rien n'est classé sans essai cité.
// Trois niveaux d'essais chez l'humain, puis les pistes à confirmer.
export const FORCES={
 forte:{rang:0,libelle:"Efficacité forte",groupe:"Essais cliniques chez l'humain",couleur:"#3fe6b0"},
 moyenne:{rang:1,libelle:"Efficacité moyenne",groupe:"Essais cliniques chez l'humain",couleur:"#5fc8ff"},
 faible:{rang:2,libelle:"Efficacité faible ou incertaine",groupe:"Essais cliniques chez l'humain",couleur:"#c4b5fd"},
 cas:{rang:3,libelle:"Cas rapportés et témoignages",groupe:"Observations individuelles, sans groupe de comparaison",couleur:"#ff9f7a"},
 preclinique:{rang:4,libelle:"Préclinique",groupe:"Études chez l'animal ou sur cellules",couleur:"#ffc94a"},
 theorique:{rang:5,libelle:"Piste théorique",groupe:"Hypothèses à tester",couleur:"#a9bcc6"}
};
export const TYPES={medicament:"Médicament",naturel:"Substance naturelle",regime:"Régime ou mode de vie"};

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

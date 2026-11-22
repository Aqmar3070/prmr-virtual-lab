// Registre des maladies : pour une maladie et un stade, les substances étudiées,
// classées par force de preuve. Règle : rien n'est classé sans essai cité.
export const FORCES={
 forte:{rang:0,libelle:"Preuve forte",couleur:"#3fe6b0"},
 moyenne:{rang:1,libelle:"Preuve moyenne",couleur:"#5fc8ff"},
 faible:{rang:2,libelle:"Preuve faible",couleur:"#c4b5fd"},
 a_eviter:{rang:3,libelle:"À éviter",couleur:"#ff4d3d"}
};
export const TYPES={medicament:"Médicament",naturel:"Substance naturelle",regime:"Régime ou mode de vie"};

export const plier=t=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

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
  .sort((a,b)=>FORCES[a.force].rang-FORCES[b.force].rang||(a.rr??1)-(b.rr??1)||a.nom.localeCompare(b.nom,"fr"));
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

// Écran « Maladies et substances » : maladie et stade à gauche, corps au centre,
// substances étudiées à droite, colorées selon la force de la preuve.
import {FORCES,TYPES,chercherMaladies,substancesPour,zonesPour,plageEtudiee} from "./maladies.mjs";

const $=id=>document.getElementById(id);
const el=(tag,cls,texte)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(texte!==undefined)n.textContent=texte;return n;};
const lien=(src,reg)=>{const s=reg.sources[src];if(!s)return null;const a=el("a","",s.source);a.href=s.url;a.target="_blank";a.rel="noopener";return a;};
const params=new URLSearchParams(location.search);
let registre=null,maladie=null,stade=params.get("stade")||"",sexe="male";

function envoyerAtlas(){
 if(!maladie)return;
 const {zones,niveau}=zonesPour(maladie,stade);
 document.dispatchEvent(new CustomEvent("xp-atlas",{detail:{sex:sexe,signals:[{zones,niveau}]}}));
}

function rendreListe(){
 const liste=$("mx-liste");liste.replaceChildren();
 const trouvees=chercherMaladies(registre,$("mx-recherche").value);
 for(const m of trouvees){
  const b=el("button","mx-maladie");b.type="button";b.setAttribute("aria-pressed",String(m===maladie));
  b.append(el("span","",m.nom),el("small","",m.substances.length+" substances étudiées"));
  b.onclick=()=>choisir(m.id);liste.append(b);
 }
 if(!trouvees.length)liste.append(el("p","mx-vide","Aucune maladie de ce nom dans le registre pour l’instant."));
}

function rendreMaladie(){
 const fiche=$("mx-fiche");fiche.replaceChildren();
 fiche.append(el("h3","",maladie.nom),el("p","",maladie.description));
 const s=lien(maladie.source,registre);if(s){const p=el("p","mx-source","Référence : ");p.append(s);fiche.append(p);}
 const choix=$("mx-stade");choix.replaceChildren(new Option("Tous les stades",""));
 for(const st of maladie.stades||[])choix.append(new Option(st.nom,st.id));
 if(!maladie.stades?.some(st=>st.id===stade))stade="";
 choix.value=stade;
}

function ligne(parent,titre,texte){if(!texte)return;const p=el("p","");p.append(el("b","",titre+" : "),texte);parent.append(p);}

function rendreSubstances(){
 const zone=$("mx-substances");zone.replaceChildren();
 const liste=substancesPour(maladie,stade);
 const st=maladie.stades?.find(x=>x.id===stade);
 $("mx-titre-stade").textContent=st?st.nom:"Tous les stades";
 const compte=el("div","mx-compte");
 for(const [cle,f] of Object.entries(FORCES)){const n=liste.filter(s=>s.force===cle).length;const c=el("span","mx-pastille",f.libelle+" · "+n);c.dataset.force=cle;compte.append(c);}
 zone.append(compte);
 let groupeCourant="";
 for(const [cle,f] of Object.entries(FORCES)){
  const groupe=liste.filter(s=>s.force===cle);if(!groupe.length)continue;
  if(f.groupe!==groupeCourant){groupeCourant=f.groupe;zone.append(el("h3","mx-niveau",f.groupe));}
  const bloc=el("section","mx-groupe");bloc.dataset.force=cle;bloc.append(el("h4","",f.libelle));
  for(const s of groupe){
   const d=el("details","mx-substance");d.dataset.force=cle;
   const resume=el("summary","");const nom=el("span","",s.nom);
   if(s.resume)nom.append(el("small","",s.resume));
   resume.append(nom,el("b","",TYPES[s.type]||s.type));d.append(resume);
   ligne(d,"Partie ou composé qui agit",s.partie);
   ligne(d,"Dose étudiée",s.dose);
   ligne(d,"Durée",s.duree);
   ligne(d,"Population",s.population);
   ligne(d,"Résultat",s.effet);
   ligne(d,"Mécanisme",s.mecanisme);
   ligne(d,"Réserve",s.condition&&("étudié en cas de "+s.condition.charAt(0).toLowerCase()+s.condition.slice(1)));
   ligne(d,"Prudence",s.prudence);
   const plage=plageEtudiee(s);if(plage)d.append(el("p","mx-etiq",plage));
   if(s.fiche)d.append(el("p","mx-etiq","Fiche détaillée dans l’explorateur d’exposition : « "+s.fiche+" »."));
   d.append(el("p","mx-etiq",{forte:"Essai clinique",moyenne:"Essai clinique",faible:"Essais cliniques de qualité limitée",preclinique:"Étude animale ou cellulaire : à confirmer chez l’humain",theorique:"Hypothèse : à vérifier par l’expérience"}[cle]+" · résultat repris de la source"));
   for(const k of [s.source,s.source2]){const a=k&&lien(k,registre);if(a){d.append(a);d.append(el("br",""));}}
   d.ontoggle=()=>{if(d.open&&s.zones?.length)document.dispatchEvent(new CustomEvent("xp-focus",{detail:s.zones[0]}));};
   bloc.append(d);
  }
  zone.append(bloc);
 }
 if(maladie.lacune)zone.append(el("p","mx-etiq",maladie.lacune));
}

function choisir(id){
 const avant=maladie;
 maladie=registre.maladies.find(m=>m.id===id)||registre.maladies[0];
 const url=new URL(location.href);url.searchParams.set("maladie",maladie.id);if(stade)url.searchParams.set("stade",stade);else url.searchParams.delete("stade");history.replaceState(null,"",url);
 rendreListe();rendreMaladie();rendreSubstances();envoyerAtlas();
 // Nouvelle maladie : on revient au corps entier pour voir tous les organes touchés.
 if(avant&&avant!==maladie)document.dispatchEvent(new CustomEvent("xp-focus",{detail:""}));
}

async function demarrer(){
 try{registre=await (await fetch("./research-data/maladies.json")).json();}
 catch{$("mx-liste").textContent="Registre indisponible.";return;}
 const regle=$("mx-regle");
 for(const [cle,f] of Object.entries(FORCES)){const p=el("p","mx-legende");p.dataset.force=cle;p.append(el("b","",f.libelle+" — "),registre.regle_force[cle]);regle.append(p);}
 $("mx-recherche").oninput=rendreListe;
 $("mx-stade").onchange=()=>{stade=$("mx-stade").value;choisir(maladie.id);};
 for(const b of document.querySelectorAll("#sex-choice button"))b.onclick=()=>{sexe=b.dataset.sex;for(const x of document.querySelectorAll("#sex-choice button"))x.setAttribute("aria-pressed",String(x===b));envoyerAtlas();};
 document.addEventListener("xp-atlas-ready",envoyerAtlas);
 choisir(params.get("maladie")||registre.maladies[0].id);
}
demarrer();

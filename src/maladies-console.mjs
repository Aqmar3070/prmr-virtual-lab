// Vue « Maladies » de l'explorateur : maladie et stade à gauche, corps au centre,
// trois onglets à droite : Guéris (guérisons et cas), Testés (études), Pistes (jamais testé) ; graphiques en bas.
// Les lignes sont courtes ; le détail s'ouvre au clic.
import {FORCES,TYPES,chercherMaladies,substancesPour,zonesPour,plageEtudiee,rapportPublie,CHAMPS_PROFIL,evaluerProfil,decrireProfil,profilActif,pourGueris,pourTestes,pourPistes} from "./maladies.mjs";

const $=id=>document.getElementById(id);
const el=(tag,cls,texte)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(texte!==undefined)n.textContent=texte;return n;};
const svg=(tag,attributs,texte)=>{const n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attributs))n.setAttribute(k,String(v));if(texte!==undefined)n.textContent=texte;return n;};
const lien=(src,reg)=>{const s=reg.sources[src];if(!s)return null;const a=el("a","",s.source);a.href=s.url;a.target="_blank";a.rel="noopener";return a;};
const params=new URLSearchParams(location.search);
let registre=null,maladie=null,stade=params.get("stade")||"",onglet="guerison";
const patient={cause:"",dfg:null,rac:null,bicarbonate:null};
const sexe=()=>document.querySelector("#sex-choice [aria-pressed=true]")?.dataset.sex||"male";
const active=()=>document.body.dataset.vue==="maladies";

const APPUI={obtenue:{rang:0,libelle:"Guérison ou rémission obtenue",court:"Obtenue"},fort:{rang:1,libelle:"Hypothèse · appui fort",court:"Appui fort"},moyen:{rang:2,libelle:"Hypothèse · appui moyen",court:"Appui moyen"},faible:{rang:3,libelle:"Hypothèse · appui faible",court:"Appui faible"}};
const COURT={forte:"Forte",moyenne:"Moyenne",faible:"Faible",cas:"Cas",preclinique:"Préclinique",theorique:"Théorique"};
const cleAppui=g=>g.type==="obtenue"?"obtenue":g.appui;
// Meilleure piste de guérison d'une maladie : donne la couleur du point dans la liste.
const meilleure=m=>(m.guerison||[]).map(cleAppui).sort((a,b)=>APPUI[a].rang-APPUI[b].rang)[0]||"";

function envoyerAtlas(){
 if(!maladie||!active())return;
 const {zones,niveau}=zonesPour(maladie,stade);
 document.dispatchEvent(new CustomEvent("xp-atlas",{detail:{sex:sexe(),signals:[{zones,niveau}]}}));
}

function rendreListe(){
 const liste=$("mx-liste");liste.replaceChildren();
 const trouvees=chercherMaladies(registre,$("mx-recherche").value);
 for(const m of trouvees){
  const b=el("button","mx-maladie");b.type="button";b.setAttribute("aria-pressed",String(m===maladie));
  const point=el("i","");const cle=meilleure(m);if(cle)point.dataset.appui=cle;
  const n=el("small","",String(m.substances.length));n.title=m.substances.length+" substances étudiées";
  b.append(point,el("span","",m.nom),n);
  b.onclick=()=>choisir(m.id);liste.append(b);
 }
 if(!trouvees.length)liste.append(el("p","mx-vide","Aucune maladie de ce nom dans le registre pour l’instant."));
}

function rendreMaladie(){
 const fiche=$("mx-fiche");fiche.replaceChildren();
 const d=el("details","mx-apropos");d.append(el("summary","",maladie.nom),el("p","",maladie.description));
 const s=lien(maladie.source,registre);if(s){const p=el("p","mx-source","Référence : ");p.append(s);d.append(p);}
 fiche.append(d);
 const choix=$("mx-stade");choix.replaceChildren(new Option("Tous les stades",""));
 for(const st of maladie.stades||[])choix.append(new Option(st.nom,st.id));
 if(!maladie.stades?.some(st=>st.id===stade))stade="";
 choix.value=stade;
}

// Profil du patient (maladies qui le proposent) : cause, mesures biologiques.
function rendreProfil(){
 const zone=$("mx-profil"),pp=maladie.profil_patient;
 zone.hidden=!pp;if(!pp)return;
 const champs=$("mx-profil-champs");champs.replaceChildren();
 const lc=el("label","mx-ligne","Cause ");const sel=document.createElement("select");sel.append(new Option("Non précisée",""));
 for(const c of pp.causes)sel.append(new Option(c.nom,c.id));sel.value=patient.cause;
 sel.onchange=()=>{patient.cause=sel.value;rendreDroite();};lc.append(sel);champs.append(lc);
 for(const k of pp.champs){
  const f=CHAMPS_PROFIL[k];const l=el("label","mx-ligne",f.libelle+" ");const i=document.createElement("input");
  i.type="number";i.min="0";i.step="any";i.placeholder=f.unite;i.value=patient[k]??"";i.dataset.champ=k;
  i.oninput=()=>{patient[k]=i.value===""?null:Number(i.value);rendreDroite();};
  l.append(i,el("small","",f.unite));champs.append(l);
 }
 $("mx-profil-avert").textContent=pp.avertissement||"";
 if(profilActif(patient))zone.open=true;
}

function ligne(parent,titre,texte){if(!texte)return;const p=el("p","");p.append(el("b","",titre+" : "),texte);parent.append(p);}
function sources(d,cles){for(const k of cles){const a=k&&lien(k,registre);if(a){d.append(a);d.append(el("br",""));}}}

// Carte d'une guérison obtenue ou d'une combinaison proposée.
function carteGuerison(g){
 const cle=cleAppui(g);
 const d=el("details","mx-ligne-d mx-piste");d.dataset.appui=cle;
 const res=el("summary","");res.append(el("span","",g.titre),el("b","",g.type==="obtenue"?"Guéri":"Combinaison"));d.append(res);
 ligne(d,"Objectif",g.objectif);
 if(g.resultat)ligne(d,"Résultat obtenu",g.resultat);
 const ul=el("ul","mx-composants");
 for(const c of g.composants||[]){const li=el("li","");li.append(el("b","",c.nom),c.role?" — "+c.role:"");if(c.ref){const s=maladie.substances.find(x=>x.id===c.ref);if(s?.resume)li.append(el("small",""," ("+s.resume+")"));}ul.append(li);}
 d.append(el("p","",g.type==="obtenue"?"Composants :":"Combinaison proposée :"),ul);
 ligne(d,"Raisonnement",g.raisonnement);
 ligne(d,"Comment la tester",g.a_tester);
 ligne(d,"Risques",g.risques);
 d.append(el("p","mx-etiq",g.type==="obtenue"?"Résultat publié chez l’humain · repris de la source":"Combinaison jamais testée ensemble · construite à partir des études citées · "+APPUI[cle].libelle.toLowerCase()));
 sources(d,[g.source,g.source2]);
 return d;
}

// Guéris : guérisons ou rémissions obtenues, puis cas individuels et témoignages.
function rendreGueris(zone,{obtenues,cas}){
 if(!obtenues.length&&!cas.length){zone.append(el("p","mx-etiq","Aucune guérison documentée pour l’instant dans le registre."));return;}
 if(obtenues.length){zone.append(el("h3","mx-niveau","Guérisons ou rémissions obtenues"));for(const g of obtenues)zone.append(carteGuerison(g));}
 if(cas.length){
  zone.append(el("h3","mx-niveau","Guérisons rapportées · cas et témoignages"));
  zone.append(el("p","mx-etiq","Guérison ou rémission rapportée chez une ou quelques personnes. Chaque fiche dit si elle a été vérifiée par des examens et si d’autres traitements étaient pris en même temps."));
  rendreGroupe(zone,cas,null,"gueris");
 }
 const note=el("details","mx-note");note.append(el("summary","","Pourquoi aucun pourcentage de guérison"),el("p","mx-etiq",registre.regle_appui?.avertissement||""));zone.append(note);
}

const STATUTS={etudie:"Étudiées chez des patients comparables",a_preciser:"À préciser : une mesure manque",hors:"Hors du profil étudié",non_precise:"Profil des patients non précisé dans la source"};
function rendreSubstancesListe(zone,liste){
 const pp=maladie.profil_patient;
 if(!pp||!profilActif(patient)){rendreGroupe(zone,liste);return;}
 const avis=new Map(liste.map(s=>[s,evaluerProfil(s,patient,pp.causes)]));
 for(const [cle,titre] of Object.entries(STATUTS)){
  const groupe=liste.filter(s=>avis.get(s).statut===cle);if(!groupe.length)continue;
  const bloc=el("details","mx-statut");bloc.dataset.statut=cle;bloc.open=cle==="etudie"||cle==="a_preciser";
  bloc.append(el("summary","",titre+" · "+groupe.length));
  rendreGroupe(bloc,groupe,avis);zone.append(bloc);
 }
}
function rendreGroupe(zone,liste,avis,sansEntete){
 const compte=el("div","mx-compte");
 for(const [cle,f] of Object.entries(FORCES)){const n=liste.filter(s=>s.force===cle).length;if(!n)continue;const c=el("span","mx-pastille",COURT[cle]+" "+n);c.title=f.libelle;c.dataset.force=cle;compte.append(c);}
 if(!sansEntete)zone.append(compte);
 let groupeCourant="";
 for(const [cle,f] of Object.entries(FORCES)){
  const groupe=liste.filter(s=>s.force===cle);if(!groupe.length)continue;
  if(!sansEntete&&f.groupe!==groupeCourant){groupeCourant=f.groupe;zone.append(el("h3","mx-niveau",f.groupe));}
  for(const s of groupe){
   const d=el("details","mx-ligne-d mx-substance");d.dataset.force=cle;
   const resume=el("summary","");resume.append(el("span","",s.nom),el("b","",sansEntete==="gueris"?"Guérison rapportée":COURT[cle]));d.append(resume);
   const a=avis?.get(s);if(a){const p=el("p","mx-avis",a.raisons.join(" · "));p.dataset.statut=a.statut;d.append(p);}
   if(s.resume)d.append(el("p","mx-resume",s.resume));
   ligne(d,"Type",TYPES[s.type]||s.type);
   ligne(d,"Partie ou composé qui agit",s.partie);
   ligne(d,"Dose étudiée",s.dose);
   ligne(d,"Durée",s.duree);
   ligne(d,"Population",s.population);
   ligne(d,"Patients inclus",decrireProfil(s.profil,maladie.profil_patient?.causes));
   ligne(d,"Résultat",s.effet);
   ligne(d,"Mécanisme",s.mecanisme);
   ligne(d,"Réserve",s.condition&&("étudié en cas de "+s.condition.charAt(0).toLowerCase()+s.condition.slice(1)));
   ligne(d,"Prudence",s.prudence);
   const plage=plageEtudiee(s);if(plage)d.append(el("p","mx-etiq",plage));
   if(s.fiche)d.append(el("p","mx-etiq","Fiche détaillée dans la vue Substances : « "+s.fiche+" »."));
   d.append(el("p","mx-etiq",{forte:"Essai clinique",moyenne:"Essai clinique",faible:"Essais cliniques de qualité limitée",cas:"Cas rapporté : sans groupe de comparaison, ne prouve pas l’effet",preclinique:"Étude animale ou cellulaire : à confirmer chez l’humain",theorique:"Hypothèse : à vérifier par l’expérience"}[cle]+" · résultat repris de la source"));
   sources(d,[s.source,s.source2]);
   d.ontoggle=()=>{if(d.open&&s.zones?.length)document.dispatchEvent(new CustomEvent("xp-focus",{detail:s.zones[0]}));};
   zone.append(d);
  }
 }
 if(maladie.lacune&&!sansEntete)zone.append(el("p","mx-etiq",maladie.lacune));
}

// Pistes : jamais testées pour cette maladie, ni chez l'humain ni chez l'animal.
const STATUTS_P={etudie:"Correspond à la situation visée",a_preciser:"À préciser : la cause manque",hors:"Ne correspond pas à la situation visée",non_precise:"Situation non précisée"};
function cartePiste(h,a){
 const d=el("details","mx-ligne-d mx-hypothese");
 const s=el("summary","");s.append(el("span","",h.nom),el("b","","Piste"));d.append(s);
 if(a){const p=el("p","mx-avis",a.statut==="etudie"?"La cause saisie correspond à la situation visée":a.raisons.join(" · "));p.dataset.statut=a.statut;d.append(p);}
 d.append(el("p","mx-formulation",h.formulation));
 ligne(d,"Type",TYPES[h.type]||h.type);
 ligne(d,"Situation visée",h.situation);
 ligne(d,"Ce qui est abîmé",h.lesion);
 ligne(d,"Fait connu sur la molécule",h.fait_molecule);
 ligne(d,"Fait connu sur la maladie",h.fait_maladie);
 ligne(d,"Lien proposé par PRMR",h.lien);
 ligne(d,"Ce qu’il faut vérifier",h.a_verifier);
 ligne(d,"Prudence",h.prudence);
 d.append(el("p","mx-etiq",(h.recherche?h.recherche+" · ":"")+"Proposition PRMR : jamais testée, pas une preuve d’efficacité ni de sécurité"));
 sources(d,[h.source,h.source2]);
 d.ontoggle=()=>{if(d.open&&h.zones?.length)document.dispatchEvent(new CustomEvent("xp-focus",{detail:h.zones[0]}));};
 return d;
}
function rendrePistes(zone,{pistes,combinaisons,theoriques}){
 zone.append(el("p","mx-etiq mx-hyp-avert","Propositions jamais testées pour cette maladie, ni chez l’humain ni chez l’animal. Chacune part de faits publiés (ce que fait la molécule, ce qui est abîmé dans la maladie) et dit « pourrait éventuellement », jamais « guérit ». Elles orientent la recherche et la discussion avec le médecin ; elles ne servent pas à se soigner."));
 if(!pistes.length&&!combinaisons.length&&!theoriques.length){zone.append(el("p","mx-etiq","Pistes en cours de construction pour cette maladie."));return;}
 if(pistes.length){
  zone.append(el("h3","mx-niveau","Molécules à explorer"));
  const pp=maladie.profil_patient,actif=pp&&profilActif(patient);
  if(!actif)for(const h of pistes)zone.append(cartePiste(h));
  else for(const [k,t] of Object.entries(STATUTS_P)){
   const g=pistes.filter(h=>evaluerProfil(h,{cause:patient.cause},pp.causes).statut===k);if(!g.length)continue;
   const bloc=el("details","mx-statut");bloc.dataset.statut=k;bloc.open=k!=="hors";bloc.append(el("summary","",t+" · "+g.length));
   for(const h of g)bloc.append(cartePiste(h,evaluerProfil(h,{cause:patient.cause},pp.causes)));zone.append(bloc);
  }
 }
 if(theoriques.length){zone.append(el("h3","mx-niveau","Cibles et simulations"));rendreGroupe(zone,theoriques,null,true);}
 if(combinaisons.length){
  zone.append(el("h3","mx-niveau","Combinaisons jamais testées ensemble"));
  for(const g of [...combinaisons].sort((a,b)=>APPUI[cleAppui(a)].rang-APPUI[cleAppui(b)].rang))zone.append(carteGuerison(g));
 }
}

function rendreDroite(){
 const zone=$("mx-substances");zone.replaceChildren();
 // Profil saisi : on compare à toutes les études, le stade ne filtre plus.
 const liste=substancesPour(maladie,maladie.profil_patient&&profilActif(patient)?"":stade);
 const st=maladie.stades?.find(x=>x.id===stade);
 $("mx-titre-stade").textContent=st?st.nom:"";
 const gueris=pourGueris(maladie,liste),testes=pourTestes(liste),pistes=pourPistes(maladie,liste,maladie.profil_patient&&profilActif(patient)?"":stade);
 $("mx-n-guerison").textContent=gueris.obtenues.length+gueris.cas.length;
 $("mx-n-substances").textContent=testes.length;
 $("mx-n-pistes").textContent=pistes.pistes.length+pistes.combinaisons.length+pistes.theoriques.length;
 for(const b of document.querySelectorAll("[data-onglet]"))b.setAttribute("aria-pressed",String(b.dataset.onglet===onglet));
 if(onglet==="guerison")rendreGueris(zone,gueris);else if(onglet==="pistes")rendrePistes(zone,pistes);else rendreSubstancesListe(zone,testes);
 rendreGraphes(liste);
}

// ---- Graphiques : uniquement des valeurs publiées ou des comptes du registre ----
const RANG_PREUVE={forte:6,moyenne:5,faible:4,cas:3,preclinique:2,theorique:1};
const COULEUR_TYPE={medicament:"#5fc8ff",naturel:"#3fe6b0",regime:"#ffc94a",geste:"#d7a6ff"};
const coupe=(t,n)=>t.length>n?t.slice(0,n-1)+"…":t;

function rendreGraphes(liste){
 // 1. Niveau de preuve : nombre de substances par niveau, empilé par type.
 const g1=$("mx-g-preuve");g1.replaceChildren();
 const niveaux=Object.keys(FORCES),max1=Math.max(1,...niveaux.map(k=>liste.filter(s=>s.force===k).length));
 g1.setAttribute("viewBox","0 0 360 "+(30+niveaux.length*26));
 niveaux.forEach((k,i)=>{const y=8+i*26;let x=96;
  g1.append(svg("text",{x:90,y:y+12,"text-anchor":"end",fill:FORCES[k].couleur},COURT[k]));
  for(const t of Object.keys(COULEUR_TYPE)){const n=liste.filter(s=>s.force===k&&s.type===t).length;if(!n)continue;const w=n/max1*230;g1.append(svg("rect",{x,y,width:Math.max(2,w-1),height:16,rx:2,fill:COULEUR_TYPE[t]}));x+=w;}
  const tot=liste.filter(s=>s.force===k).length;g1.append(svg("text",{x:x+5,y:y+12},tot));
 });
 let lx=10;for(const [t,c] of Object.entries(COULEUR_TYPE).filter(([t])=>t!=="geste"||liste.some(s=>s.type==="geste"))){const y=20+niveaux.length*26;const g=liste.some(s=>s.type==="geste");g1.append(svg("rect",{x:lx,y:y-9,width:10,height:10,rx:2,fill:c}),svg("text",{x:lx+14,y},{medicament:"Médicament",naturel:"Plante, naturel",regime:g?"Mode de vie":"Régime, mode de vie",geste:"Geste"}[t]));lx+=t==="medicament"?100:g?(t==="regime"?90:105):115;}
 // 2. Effet mesuré : rapports de risque publiés avec IC 95 % (échelle log).
 const g2=$("mx-g-effet");g2.replaceChildren();
 const chiffres=liste.map(s=>({s,r:rapportPublie(s)})).filter(x=>x.r).sort((a,b)=>a.r.rr-b.r.rr);
 $("mx-g-effet-vide").hidden=chiffres.length>0;g2.style.display=chiffres.length?"":"none";
 $("mx-g-effet-vide").textContent="Aucun rapport de risque avec intervalle publié dans les essais retenus pour ce choix. Le résultat écrit de chaque substance reste dans l’onglet Testés.";
 if(chiffres.length){
  const bas=Math.min(...chiffres.map(x=>x.r.bas)),hautMax=Math.max(1.2,...chiffres.map(x=>x.r.haut));
  const h=34+chiffres.length*22,lo=Math.log(bas*0.8),hi=Math.log(hautMax*1.15),X=v=>150+180*(Math.log(v)-lo)/(hi-lo);
  g2.setAttribute("viewBox","0 0 360 "+h);
  for(const v of [0.01,0.05,0.1,0.25,0.5,1,2].filter(v=>Math.log(v)>=lo&&Math.log(v)<=hi)){g2.append(svg("path",{d:"M"+X(v)+" 4V"+(h-18),stroke:v===1?"#9fe9f1":"#23485a","stroke-dasharray":v===1?"":"2 3"}),svg("text",{x:X(v),y:h-6,"text-anchor":"middle"},String(v).replace(".",",")));}
  g2.append(svg("text",{x:X(1)-4,y:h-20,"text-anchor":"end",fill:"#3fe6b0"},"◀ bénéfice"));
  chiffres.forEach(({s,r},i)=>{const y=14+i*22,c=FORCES[s.force].couleur;
   g2.append(svg("text",{x:144,y:y+4,"text-anchor":"end"},coupe(s.nom,22)),svg("path",{d:"M"+X(r.bas)+" "+y+"H"+X(r.haut),stroke:c,"stroke-width":2}),svg("rect",{x:X(r.rr)-4,y:y-4,width:8,height:8,fill:c}),svg("text",{x:Math.min(352,X(r.haut)+4),y:y+4,fill:c},String(r.rr).replace(".",",")));});
 }
 // 3. Balance : niveau de preuve du bénéfice (droite) et précautions écrites dans la fiche (gauche).
 const g3=$("mx-g-balance");g3.replaceChildren();
 const lignes=liste.slice(0,10),h3=30+lignes.length*22,mid=170;
 g3.setAttribute("viewBox","0 0 360 "+h3);
 g3.append(svg("text",{x:mid-4,y:12,"text-anchor":"end",fill:"#ffb15c"},"◀ précautions"),svg("text",{x:mid+4,y:12,fill:"#3fe6b0"},"preuve ▶"),svg("path",{d:"M"+mid+" 18V"+(h3-4),stroke:"#9fe9f1"}));
 lignes.forEach((s,i)=>{const y=22+i*22,p=(s.prudence?1:0)+(s.condition?1:0),b=RANG_PREUVE[s.force];
  g3.append(svg("text",{x:6,y:y+11},coupe(s.nom,17)));
  if(p)g3.append(svg("rect",{x:mid-p*24,y,width:p*24-1,height:14,rx:2,fill:"#ff9a3c"}));
  g3.append(svg("rect",{x:mid+1,y,width:b*19,height:14,rx:2,fill:FORCES[s.force].couleur}),svg("text",{x:mid+b*19+5,y:y+11,fill:FORCES[s.force].couleur},COURT[s.force]));
 });
 const t=svg("title",{},"Droite : niveau de preuve publié (forte à théorique). Gauche : nombre de précautions écrites dans la fiche (prudence, population étudiée restreinte). Ce n’est pas un score de risque.");g3.append(t);
}

function choisir(id){
 const avant=maladie;
 maladie=registre.maladies.find(m=>m.id===id)||registre.maladies[0];
 if(active()){const url=new URL(location.href);url.searchParams.set("maladie",maladie.id);if(stade)url.searchParams.set("stade",stade);else url.searchParams.delete("stade");history.replaceState(null,"",url);}
 // Maladie propre à un sexe (sein, prostate, utérus) : le corps affiché suit.
 if(active()&&maladie.sexe&&maladie.sexe!==sexe())document.querySelector('#sex-choice [data-sex="'+maladie.sexe+'"]')?.click();
 rendreListe();rendreMaladie();rendreProfil();rendreDroite();envoyerAtlas();
 // Nouvelle maladie : on revient au corps entier pour voir tous les organes touchés.
 if(avant&&avant!==maladie&&active())document.dispatchEvent(new CustomEvent("xp-focus",{detail:""}));
}

async function demarrer(){
 try{registre=await (await fetch("./research-data/maladies.json")).json();}
 catch{$("mx-liste").textContent="Registre indisponible.";return;}
 const regle=$("mx-regle");
 for(const [cle,f] of Object.entries(APPUI)){const p=el("p","mx-legende");p.dataset.appui=cle;p.append(el("b","",f.libelle+" — "),registre.regle_appui?.[cle]||"");regle.append(p);}
 for(const [cle,f] of Object.entries(FORCES)){const p=el("p","mx-legende");p.dataset.force=cle;p.append(el("b","",f.libelle+" — "),registre.regle_force[cle]);regle.append(p);}
 $("mx-recherche").oninput=rendreListe;
 $("mx-stade").onchange=()=>{stade=$("mx-stade").value;choisir(maladie.id);};
 for(const b of document.querySelectorAll("[data-onglet]"))b.onclick=()=>{onglet=b.dataset.onglet;rendreDroite();};
 $("sex-choice").addEventListener("click",()=>setTimeout(envoyerAtlas));
 document.addEventListener("xp-atlas-ready",envoyerAtlas);
 document.addEventListener("xp-vue",e=>{if(e.detail==="maladies")choisir(maladie.id);});
 choisir(params.get("maladie")||registre.maladies[0].id);
}
demarrer();

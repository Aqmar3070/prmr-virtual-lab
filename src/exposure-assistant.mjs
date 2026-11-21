// Assistant de saisie. Une proposition passe par le formulaire et ses contrôles d’unités.
import {lireRecit,connaissances} from "./exposure-narrative.mjs";
import {lireDocument} from "./exposure-document.mjs";

const $=id=>document.getElementById(id);
const serveur="https://bwhlsackoaxwwrgxympl.supabase.co";
const clePublique="sb_publishable_rD9clzwIzk1v7vm7gCI_Kw_kFcCtw9B";
let client;
async function session(){
 if(!client){
  const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm");
  client=createClient(serveur,clePublique);
 }
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)throw Error("Connectez-vous à votre espace de recherche PRMR, puis revenez ici.");
 return client;
}
export function initialiserAssistant({produits,proposer,appliquer,restaurer,bilan,scenario}){
 const reponse=$("xa-answer"),propositions=$("xa-proposals"),note=$("xa-note");
 function analyser(){
  const prises=lireRecit(note.value,produits);
  propositions.replaceChildren();
  if(!prises.length){
   reponse.textContent=(note.value.trim()?"Aucune prise identifiable dans ce passage. ":"")+(bilan()||"Exemple : je bois 33 cl de bière à 5 % chaque jour pendant deux semaines.");
   return;
  }
  const calculees=prises.filter(p=>p.row);
  appliquer(calculees);
  reponse.textContent=calculees.length?"Calcul actualisé. "+bilan():"Résultat documentaire disponible. Les quantités restent à préciser.";
  const themes=new Set();
  for(const {produit,theme,notes,row} of prises){
   const info=document.createElement("p");
   info.textContent=[produit.name,row?row.qty+" "+produit.unit+" par jour sur "+row.end+" jour(s).":"",...notes].filter(Boolean).join(" · ");
   propositions.append(info);
   const bouton=document.createElement("button");bouton.textContent="Ajuster · "+produit.name;
   bouton.onclick=()=>proposer(produit,row);propositions.append(bouton);
   if(theme&&!themes.has(theme)){
    themes.add(theme);
    for(const [titre,detail,source,url] of connaissances[theme]){
     const article=document.createElement("article"),h=document.createElement("strong"),p=document.createElement("p"),a=document.createElement("a");
     h.textContent=titre;p.textContent=detail;a.textContent=source;a.href=url;article.append(h,p,a);propositions.append(article);
    }
   }
  }
 }
 $("xa-read").onclick=analyser;
 function parler(){if(!window.speechSynthesis)return;const message=new SpeechSynthesisUtterance(reponse.textContent||bilan()||"Aucune prise enregistrée.");message.lang="fr-FR";speechSynthesis.cancel();speechSynthesis.speak(message);}
 $("xa-speak").disabled=!window.speechSynthesis;$("xa-speak").onclick=parler;
 const Reconnaissance=window.SpeechRecognition||window.webkitSpeechRecognition;
 const boutonMicro=$("xa-mic");
 if(!Reconnaissance){boutonMicro.disabled=true;boutonMicro.title="Dictée indisponible dans ce navigateur";}
 else{
  let actif=false,instance=null,base="",segment="",termine=false,reprises=0;
  function marquer(etat){actif=etat;boutonMicro.textContent=etat?"Terminer la dictée":"Dicter";boutonMicro.setAttribute("aria-pressed",String(etat));}
  function ecouter(){
   if(!actif||instance)return;
   const micro=new Reconnaissance();instance=micro;segment="";micro.lang="fr-FR";micro.continuous=true;micro.interimResults=true;
   micro.onresult=e=>{
    segment=Array.from(e.results,r=>r[0].transcript).join(" ").trim();
    if(segment)reprises=0;
    note.value=[base,segment].filter(Boolean).join(" ");
   };
   micro.onerror=e=>{
    if(e.error==="no-speech"||e.error==="aborted")return;
    marquer(false);termine=false;reponse.textContent="Dictée interrompue ("+e.error+"). Le récit est conservé.";
   };
   micro.onend=()=>{
    instance=null;base=note.value.trim();
    if(actif&&++reprises<5){setTimeout(ecouter,250);return;}
    marquer(false);
    if(termine){termine=false;analyser();}else if(reprises>=5)reponse.textContent="Microphone silencieux. Le récit est conservé, vous pouvez reprendre.";
   };
   try{micro.start();}catch{instance=null;marquer(false);reponse.textContent="Microphone indisponible. Le récit est conservé.";}
  }
  boutonMicro.onclick=()=>{
   if(actif){marquer(false);termine=true;if(instance)instance.stop();else{termine=false;analyser();}return;}
   if(instance)return;
   window.speechSynthesis?.cancel();base=note.value.trim();reprises=0;termine=false;marquer(true);
   reponse.textContent="Écoute en cours. Cliquez sur Terminer la dictée après votre dernière phrase.";ecouter();
  };
 }
 const statut=$("xa-file-status");
 function action(id,fn){const bouton=$(id);bouton.onclick=async()=>{bouton.disabled=true;statut.textContent="Traitement en cours…";
  try{await fn();}catch(e){statut.textContent=e.message||"Service indisponible.";}finally{bouton.disabled=false;}};}
 let lecture=0;
 async function importer(){
  const numero=++lecture,fichier=$("xa-file").files[0];
  if(!fichier)return;
  const progression=texte=>{if(numero===lecture)statut.textContent=texte;};
  progression("Lecture du document…");
  try{
   const texte=await lireDocument(fichier,progression);
   if(numero!==lecture)return;
   if(!texte.trim())throw Error("Aucun texte lisible détecté dans le document.");
   note.value=texte;analyser();progression("Texte extrait de "+fichier.name+". Vous pouvez le corriger dans le récit et relancer le calcul.");
  }catch(e){progression("Lecture impossible. "+e.message);}
 }
 $("xa-file").onchange=importer;$("xa-extract").onclick=importer;
 action("xa-history",async()=>{
  const projet=$("xa-projects").value;if(!projet)throw Error("Choisissez votre projet.");
  const api=await session();const {data,error}=await api.from("simulation_runs").select("created_at,parameters,results").eq("project_id",projet).eq("model_name","Explorateur d’exposition").order("created_at",{ascending:false}).limit(30);
  if(error)throw error;
  const liste=$("xa-history-list");liste.replaceChildren();
  for(const ligne of data){
   const bloc=document.createElement("details"),titre=document.createElement("summary");
   titre.textContent=new Date(ligne.created_at).toLocaleString("fr-FR")+" · "+(ligne.parameters?.prises||[]).map(p=>p.nom).join(", ");bloc.append(titre);
   const unites={ethanolMl:"mL d’alcool pur",ethanolG:"g d’alcool pur",sugarG:"g de sucres",caffeineMg:"mg de caféine"};
   for(const texte of [...Object.entries(ligne.results?.apports||{}).map(([k,v])=>v+" "+(unites[k]||k)),...(ligne.results?.reperes||[]).map(r=>r.reason)]){
    const p=document.createElement("p");p.textContent=texte;bloc.append(p);
   }
   if(bloc.childElementCount===1)bloc.append("Aucun apport quantifiable ni repère enregistré ce jour.");
   const ouvrir=document.createElement("button");ouvrir.textContent="Ouvrir le graphique enregistré";ouvrir.onclick=()=>{try{restaurer(ligne.parameters);statut.textContent="Scénario chargé.";}catch(e){statut.textContent=e.message;}};
   bloc.append(ouvrir);liste.append(bloc);
  }
  statut.textContent=data.length+" scénario(s) retrouvé(s).";
 });
 $("xa-projects").onchange=()=>{$("xa-history-list").replaceChildren();$("xa-history").click();};
 action("xa-projects-load",async()=>{
  const api=await session();const {data,error}=await api.from("research_projects").select("id,title").order("created_at",{ascending:false});
  if(error)throw error;
  $("xa-projects").replaceChildren(...data.map(p=>new Option(p.title,p.id)));
  statut.textContent=data.length?"Projet chargé.":"Créez un projet dans votre espace privé.";if(data.length)$("xa-history").click();
 });
 action("xa-save",async()=>{
  const projet=$("xa-projects").value;if(!projet)throw Error("Chargez et choisissez un projet.");
  const {parametres,resultats}=scenario();if(!parametres.prises.length)throw Error("Enregistrez une prise dans le scénario.");
  const api=await session();const {error}=await api.from("simulation_runs").insert({project_id:projet,model_name:"Explorateur d’exposition",model_version:"2",status:"completed",parameters:parametres,results:resultats,provenance:"Prises vérifiées par l’utilisateur et repères du registre PRMR",finished_at:new Date().toISOString()});
  if(error)throw error;statut.textContent="Scénario enregistré dans le projet privé.";
 });
}

// Assistant de saisie. Une proposition passe par le formulaire et ses contrôles d’unités.
import {fold} from "./exposure-evidence.mjs";

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
function lireFichier(fichier){
 return new Promise((resolve,reject)=>{
  const lecteur=new FileReader();lecteur.onload=()=>resolve(lecteur.result);
  lecteur.onerror=()=>reject(Error("Lecture du fichier impossible."));lecteur.readAsDataURL(fichier);
 });
}
export function initialiserAssistant({produits,proposer,bilan,scenario}){
 const reponse=$("xa-answer"),propositions=$("xa-proposals"),note=$("xa-note");
 function afficher(prises){
  propositions.replaceChildren();
  for(const prise of prises){
   const terme=fold(prise.nom||"").trim();
   if(!terme)continue;
   const trouves=[...produits.values()].filter(p=>fold(p.name)===terme);
   if(!trouves.length)trouves.push(...[...produits.values()].filter(p=>fold(p.name).includes(terme)).slice(0,8));
   if(!trouves.length){const info=document.createElement("p");info.textContent="Référence à préciser dans le catalogue : "+prise.nom;propositions.append(info);}
   for(const p of trouves.slice(0,8)){
    const compatible=fold(prise.unite||"")===fold(p.unit);
    const bouton=document.createElement("button");
    bouton.textContent="Vérifier · "+p.name+(compatible&&prise.quantite!=null?" · "+prise.quantite+" "+p.unit:" · quantité à préciser");
    bouton.onclick=()=>proposer(p,{...prise,quantite:compatible?prise.quantite:null,apres:compatible?prise.apres:null});
    propositions.append(bouton);
   }
  }
 }
 function analyser(){
  propositions.replaceChildren();
  const texte=note.value.trim();
  if(!texte){reponse.textContent=bilan()||"Ajoutez une prise ou décrivez un produit.";return;}
  if(texte.includes("?")){reponse.textContent=bilan()||"Aucune prise enregistrée pour ce jour. Décrivez la substance et sa quantité.";return;}
  const prises=texte.split(/[;\n]+/).map(ligne=>{
   const dose=ligne.match(/(\d+(?:[.,]\d+)?)\s*(mg|mL|g)\b/i);
   return {nom:(dose?ligne.slice(0,dose.index):ligne).replace(/[, :]+$/,"").trim(),quantite:dose?Number(dose[1].replace(",",".")):null,unite:dose?.[2]};
  });
  afficher(prises);reponse.textContent="Choisissez la référence, vérifiez la quantité et les jours, puis enregistrez.";
 }
 $("xa-read").onclick=analyser;
 function parler(){if(!window.speechSynthesis)return;const message=new SpeechSynthesisUtterance(reponse.textContent||bilan()||"Aucune prise enregistrée.");message.lang="fr-FR";speechSynthesis.cancel();speechSynthesis.speak(message);}
 $("xa-speak").disabled=!window.speechSynthesis;$("xa-speak").onclick=parler;
 const Reconnaissance=window.SpeechRecognition||window.webkitSpeechRecognition;
 $("xa-mic").disabled=!Reconnaissance;
 if(!Reconnaissance)$("xa-mic").title="Dictée indisponible dans ce navigateur";
 else $("xa-mic").onclick=()=>{
  const micro=new Reconnaissance();micro.lang="fr-FR";
  micro.onstart=()=>{$("xa-mic").disabled=true;reponse.textContent="Écoute en cours…";};
  micro.onresult=e=>{note.value=e.results[0][0].transcript;analyser();parler();};
  micro.onerror=()=>{reponse.textContent="Dictée interrompue ou microphone indisponible.";};
  micro.onend=()=>{$("xa-mic").disabled=false;};micro.start();
 };
 const statut=$("xa-file-status");
 function action(id,fn){const bouton=$(id);bouton.onclick=async()=>{bouton.disabled=true;statut.textContent="Traitement en cours…";
  try{await fn();}catch(e){statut.textContent=e.message||"Service indisponible.";}finally{bouton.disabled=false;}};}
 action("xa-extract",async()=>{
  if(!$("xa-consent").checked)throw Error("Confirmez l’envoi du document ou du texte.");
  const fichier=$("xa-file").files[0];
  if(!fichier&&!note.value.trim())throw Error("Sélectionnez un fichier ou saisissez du texte.");
  if(fichier&&fichier.size>4*1024*1024)throw Error("Taille maximale du document : 4 Mo.");
  const api=await session();
  const {data,error}=await api.functions.invoke("exposure-intake",{body:{texte:note.value.slice(0,8000),document:fichier?await lireFichier(fichier):null}});
  if(error)throw Error("Extraction IA indisponible. Vérifiez la connexion et le déploiement du service.");
  reponse.textContent=data.observations.join(" ")||"Aucune observation explicite extraite.";
  afficher(data.prises);statut.textContent="Extraction terminée. Vérifiez chaque proposition avec le document original.";
  $("xa-consent").checked=false;
 });
 action("xa-projects-load",async()=>{
  const api=await session();const {data,error}=await api.from("research_projects").select("id,title").order("created_at",{ascending:false});
  if(error)throw error;
  $("xa-projects").replaceChildren(...data.map(p=>new Option(p.title,p.id)));
  statut.textContent=data.length?"Choisissez le projet de destination.":"Créez un projet dans votre espace privé.";
 });
 action("xa-save",async()=>{
  const projet=$("xa-projects").value;if(!projet)throw Error("Chargez et choisissez un projet.");
  const {parametres,resultats}=scenario();if(!parametres.prises.length)throw Error("Enregistrez une prise dans le scénario.");
  const api=await session();const {error}=await api.from("simulation_runs").insert({project_id:projet,model_name:"Explorateur d’exposition",model_version:"2",status:"completed",parameters:parametres,results:resultats,provenance:"Prises vérifiées par l’utilisateur et repères du registre PRMR",finished_at:new Date().toISOString()});
  if(error)throw error;statut.textContent="Scénario enregistré dans le projet privé.";
 });
}

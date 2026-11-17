// PRMR Cloud Workspace — accès sécurisé aux données via Supabase Auth + RLS.
// La clé publishable est publique par conception. Ne jamais ajouter de clé service_role ici.
const SUPABASE_URL = "https://bwhlsackoaxwwrgxympl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rD9clzwIzk1v7vm7gCI_Kw_kFcCtw9B";
const SUPABASE_SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

export function initCloud(handlers){
 const $=id=>document.getElementById(id);
 // Seul l'accueil porte le balisage de l'espace privé. Sans cette garde, le
 // module s'attachait à des éléments absents sur research.html : la première
 // ligne levait « Cannot read properties of null » et interrompait toute
 // l'initialisation du laboratoire sur cette page.
 if(!$("cloud-projects")||!$("cloud-message"))return {available:false};
 const el=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(css)e.className=css;return e};
 const msg=(message,kind="")=>{const n=$("cloud-message");n.textContent=message;n.dataset.kind=kind;};
 let client=null,loggedUser=null,projects=[],projectId=null,loadSeq=0;
 const setButtonStates=(loading=false)=>{
  const logged=Boolean(loggedUser);
  for(const id of ["cloud-save-molecule","cloud-save-simulation","cloud-create-experiment","cloud-refresh"])$(id).disabled=loading || !logged || !projectId;
  $("cloud-create-project").disabled=loading || !logged;
 };
 function showAuth(){
  const authenticated=Boolean(loggedUser);
  $("cloud-auth-forms").hidden=authenticated;
  $("cloud-signed-in").hidden=!authenticated;
  $("cloud-workbench").hidden=!authenticated;
  $("cloud-user").textContent=loggedUser?.email??"Compte connecté";
  $("cloud-auth-indicator").textContent=authenticated?"Session active":"Connexion nécessaire";
  $("cloud-auth-indicator").className=authenticated?"pill success":"pill";
  setButtonStates();
 }
 async function whoAmI(){
  if(!client)return;
  const {data,error}=await client.auth.getUser();
  loggedUser=error?null:(data?.user??null);
  showAuth();
  if(loggedUser){
   await loadProjects();
   msg("Session active. Projets et enregistrements synchronisés avec Supabase.","good");
  }else{
   projects=[];projectId=null;resetCloudLists();
  }
 }
 function resetCloudLists(){
  $("cloud-projects").replaceChildren();
  $("cloud-molecules").replaceChildren();
  $("cloud-simulations").replaceChildren();
  $("cloud-experiments").replaceChildren();
  $("cloud-project-empty").textContent="Connectez-vous pour retrouver vos projets.";
 }
 async function safeAction(description,action){
  if(!client){msg("Connexion Supabase impossible : bibliothèque cliente indisponible.","bad");return}
  msg(description+"…");
  try{await action();}catch(err){msg(description+" : "+(err.message||"Erreur inconnue"),"bad")}
 }
 async function loadProjects(){
  const userId=loggedUser?.id;
  if(!userId)return;
  const {data,error}=await client.from("research_projects").select("id,title,research_area,status,created_at").order("created_at",{ascending:false}).limit(80);
  if(error)throw error;
  if(loggedUser?.id!==userId)return;
  projects=data||[];
  if(!projects.some(p=>p.id===projectId))projectId=projects[0]?.id??null;
  const sel=$("cloud-projects");sel.replaceChildren();
  if(!projects.length){
   const empty=el("option","Aucun projet créé");empty.value="";sel.append(empty);
   $("cloud-project-empty").textContent="Aucun projet enregistré : créez votre premier espace de recherche.";
  }else {
   $("cloud-project-empty").textContent=projects.length+" projet(s) privé(s) disponible(s).";
   for(const p of projects){
    const option=el("option",p.title+" — "+p.research_area);option.value=p.id;sel.append(option);
   }
   sel.value=projectId;
  }
  setButtonStates();
  await loadRecords();
 }
 async function loadRecords(){
  const id=projectId, seq=++loadSeq;
  ["cloud-molecules","cloud-simulations","cloud-experiments"].forEach(x=>$(x).replaceChildren());
  if(!id){setButtonStates();return}
  const specs=[
   {table:"molecules",fields:"id,name,source_type,created_at,smiles",out:"cloud-molecules",label:r=>r.name,detail:r=>(r.source_type||"") +" · "+(r.smiles||"SMILES absent")},
   {table:"simulation_runs",fields:"id,model_name,model_version,status,created_at,provenance",out:"cloud-simulations",label:r=>r.model_name+" · "+r.model_version,detail:r=>r.status+" · "+r.provenance},
   {table:"experiments",fields:"id,title,status,evidence_type,created_at",out:"cloud-experiments",label:r=>r.title,detail:r=>r.status+" · "+r.evidence_type}
  ];
  const results=await Promise.all(specs.map(s=>client.from(s.table).select(s.fields).eq("project_id",id).order("created_at",{ascending:false}).limit(25)));
  if(seq!==loadSeq || projectId!==id || !loggedUser)return;
  for(let i=0;i<specs.length;i++){
   const spec=specs[i],{data,error}=results[i],dest=$(spec.out);
   if(error){dest.append(el("p","Accès indisponible : "+error.message,"cloud-muted"));continue}
   if(!(data||[]).length){dest.append(el("p","Aucun enregistrement dans ce projet.","cloud-muted"));continue}
   for(const r of data){
    const div=el("div",undefined,"cloud-record");
    const t=el("strong",spec.label(r));const d=el("small",spec.detail(r));
    const dt=el("small",new Date(r.created_at).toLocaleString("fr-FR"));
    div.append(t,d,dt);dest.append(div);
   }
  }
  setButtonStates();
 }
 $("cloud-projects").addEventListener("change",e=>{projectId=e.target.value||null;setButtonStates();safeAction("Chargement du projet",loadRecords)});
 $("cloud-signup").addEventListener("click",()=>safeAction("Inscription",async()=>{
  const email=$("cloud-email").value.trim(),password=$("cloud-password").value;
  if(password.length<12)throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
  if(!email)throw new Error("Adresse e-mail manquante.");
  const {data,error}=await client.auth.signUp({
   email,password,options:{emailRedirectTo:"https://aqmar3070.github.io/prmr-virtual-lab/"}
  });
  if(error)throw error;
  if(data?.session){await whoAmI();msg("Compte créé et session ouverte.","good")}
  else msg("Vérifiez le message de confirmation dans votre messagerie. Si le lien renvoie ailleurs, configurez l'URL de redirection dans Supabase Auth.", "good");
 }));
 $("cloud-login").addEventListener("click",()=>safeAction("Connexion",async()=>{
  const email=$("cloud-email").value.trim(),password=$("cloud-password").value;
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error)throw error;
  $("cloud-password").value="";
  await whoAmI();
  msg("Session vérifiée, espace de recherche chargé.","good");
 }));
 $("cloud-signout").addEventListener("click",()=>safeAction("Déconnexion",async()=>{
  const {error}=await client.auth.signOut();if(error)throw error;
  loggedUser=null;projectId=null;showAuth();resetCloudLists();msg("Déconnexion réussie.","good");
 }));
 $("cloud-create-project").addEventListener("click",()=>safeAction("Création du projet",async()=>{
  if(!loggedUser)throw new Error("Connectez-vous.");
  const title=$("cloud-new-project").value.trim(),research_area=$("cloud-research-area").value;
  if(!title)throw new Error("Nom de projet manquant.");
  const {data,error}=await client.from("research_projects").insert({title,research_area,status:"active"}).select("id").single();
  if(error)throw error;
  $("cloud-new-project").value="";projectId=data.id;
  await loadProjects();msg("Projet enregistré dans Supabase avec accès privé.","good");
 }));
 $("cloud-save-molecule").addEventListener("click",()=>safeAction("Enregistrement de la molécule",async()=>{
  if(!projectId)throw new Error("Sélectionnez d'abord un projet.");
  const molecule=handlers.getMolecule();
  if(!molecule)throw new Error("Aucune structure RDKit validée. Analysez une molécule dans l'atelier.");
  const {error}=await client.from("molecules").insert({
   project_id:projectId,name:molecule.name,smiles:molecule.smiles,
   source_type:"calculated",source_reference:"RDKit.js · calcul local non clinique",
   descriptors:molecule.descriptors||{}
  });
  if(error)throw error;
  await loadRecords();msg("Structure et descripteurs sauvegardés dans le projet privé.","good");
 }));
 $("cloud-save-simulation").addEventListener("click",()=>safeAction("Enregistrement de la simulation",async()=>{
  if(!projectId)throw new Error("Sélectionnez d'abord un projet.");
  const r=handlers.getSimulation();
  if(!r || !r.prediction)throw new Error("La simulation analytique n'est pas disponible.");
  const {error}=await client.from("simulation_runs").insert({
   project_id:projectId,model_name:"PK/PD oral · un compartiment",model_version:"1.1",
   status:"completed",parameters:r.parameters,
   results:r.prediction,uncertainty:r.uncertainty,
   provenance:"Calcul analytique basé sur des hypothèses fictives; aucune calibration expérimentale.",
   finished_at:new Date().toISOString()
  });
  if(error)throw error;
  await loadRecords();msg("Simulation hypothétique et provenance sauvegardées.","good");
 }));
 $("cloud-create-experiment").addEventListener("click",()=>safeAction("Création de l'expérience",async()=>{
  if(!projectId)throw new Error("Sélectionnez d'abord un projet.");
  const title=$("cloud-experiment-title").value.trim();
  if(!title)throw new Error("Titre manquant.");
  const {error}=await client.from("experiments").insert({
   project_id:projectId,title,method:"Hypothèse documentaire à préciser",
   evidence_type:"hypothesis",status:"planned",
   protocol:{purpose:"registre de recherche, aucun protocole de dosage"}
  });
  if(error)throw error;
  $("cloud-experiment-title").value="";
  await loadRecords();msg("Hypothèse de recherche enregistrée; aucune expérience clinique effectuée.","good");
 }));
 $("cloud-refresh").addEventListener("click",()=>safeAction("Actualisation",async()=>{await loadProjects();msg("Données synchronisées depuis Supabase.","good")}));
 async function start(){
  try{
   // Import dynamique : une indisponibilité du CDN n'interrompt pas les autres moteurs PRMR.
   const {createClient}=await import(SUPABASE_SDK);
   client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:"implicit"}
   });
   client.auth.onAuthStateChange((_event,_session)=>{
    // Les requêtes vers Supabase ne doivent pas être lancées directement dans ce callback.
    setTimeout(()=>{whoAmI().catch(e=>msg("Actualisation de session : "+e.message,"bad"));},0);
   });
   await whoAmI();
   msg("Supabase connecté. Connexion utilisateur requise pour enregistrer des données.","good");
  }catch(e){msg("Client Supabase indisponible : "+e.message,"bad");$("cloud-auth-indicator").textContent="Connexion impossible"}
 }
 showAuth();start();
}

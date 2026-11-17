// PRMR Phase 5 / Human clinical renal research. Educational anatomy, not segmented human medical imaging.
import * as T from "../vendor/three/build/three.module.js";
import {OrbitControls} from "../vendor/three/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "../vendor/three/examples/jsm/libs/meshopt_decoder.module.js";
import {buildLocalHuman} from "./r08_human_local.mjs";
const $=id=>document.getElementById(id);
const CATALOG=[
{key:"ace",name:"IEC : ramipril, lisinopril, énalapril",type:"established",target:"SRAA / hypertension / albuminurie",trial:"KDIGO 2024 ; essais REIN/AIPRI",result:"Réduction du risque de progression chez des groupes avec albuminurie ; traitement de fond selon indication.",limit:"Surveiller potassium, tension, créatinine. Ne pas associer IEC + ARA2.",url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/"},
{key:"arb",name:"ARA2 : losartan, irbésartan, valsartan",type:"established",target:"SRAA / néphropathie albuminurique",trial:"RENAAL ; IDNT ; KDIGO 2024",result:"Réduction d'événements rénaux chez des patients sélectionnés, notamment avec diabète et albuminurie.",limit:"Bénéfice populationnel, pas de restitution anatomique prouvée. Risque hyperkaliémie.",url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/"},
{key:"dapa",name:"Dapagliflozine",type:"established",target:"SGLT2 / rein–cœur",trial:"DAPA-CKD (n=4 304)",result:"HR 0,61 : réduction relative de 39 % du critère composite rénal ou décès rénal/cardiovasculaire dans la population étudiée.",limit:"Ne démontre pas la repousse des néphrons ; indications et surveillance à individualiser.",url:"https://doi.org/10.1056/NEJMoa2024816"},
{key:"empa",name:"Empagliflozine",type:"established",target:"SGLT2 / progression rénale",trial:"EMPA-KIDNEY (n=6 609)",result:"HR 0,72 : réduction relative de 28 % du critère composite progression rénale ou décès cardiovasculaire.",limit:"Ne signifie pas une guérison. Surveillance de l'état volémique et des effets indésirables.",url:"https://doi.org/10.1056/NEJMoa2204233"},
{key:"cana",name:"Canagliflozine",type:"established",target:"SGLT2 / MRC diabétique albuminurique",trial:"CREDENCE",result:"Démonstration d'un bénéfice sur un critère composite rénal et cardiovasculaire dans une population diabétique.",limit:"Populations, autorisations et précautions propres à la molécule.",url:"https://doi.org/10.1056/NEJMoa1811744"},
{key:"fine",name:"Finérénone",type:"established",target:"Récepteur minéralocorticoïde non stéroïdien",trial:"FIDELIO-DKD ; FIGARO-DKD",result:"FIDELIO-DKD : HR 0,82 pour le critère composite rénal chez des patients avec diabète de type 2 et MRC.",limit:"Surveillance du potassium ; pas de preuve de régénération rénale complète.",url:"https://doi.org/10.1056/NEJMoa2025845"},
{key:"sema",name:"Sémaglutide",type:"established",target:"GLP-1 / MRC avec diabète de type 2",trial:"FLOW (n≈3 533)",result:"HR 0,76 : réduction relative de 24 % du critère composite rénal/cardiovasculaire de FLOW.",limit:"Résultats propres à la MRC associée au diabète de type 2 ; pas de guérison complète.",url:"https://doi.org/10.1056/NEJMoa2403347"},
{key:"combo",name:"Finérénone + empagliflozine",type:"established",target:"Combinaison déjà étudiée",trial:"CONFIDENCE (2025)",result:"À 180 jours, réduction de l'albuminurie 29 % supérieure à finérénone seule et 32 % supérieure à empagliflozine seule.",limit:"Critère albuminurie : ne démontre ni régénération des organes ni bénéfice rénal à long terme équivalent.",url:"https://doi.org/10.1056/NEJMoa2410659"},
{key:"statin",name:"Statines : atorvastatine, rosuvastatine",type:"established",target:"Risque cardiovasculaire lié à la MRC",trial:"KDIGO 2024",result:"Réduction de risque cardiovasculaire selon profil ; ne constitue pas un traitement régénérant du rein.",limit:"Indication dépend du risque cardiovasculaire et du contexte clinique.",url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/"},
{key:"iga",name:"Sparsentan, iptacopan, atrasentan, sibeprenlimab, budésonide ciblé",type:"specific",target:"Néphropathie primitive à IgA",trial:"PROTECT, APPLAUSE-IgAN, ALIGN, VISIONARY et autres",result:"Approches spécifiques à une étiologie glomérulaire ; résultats sur protéinurie et, selon traitement, évolution du DFG.",limit:"Ne pas extrapoler ces traitements à toutes les MRC ; statut réglementaire dépend du pays et de la date.",url:"https://kdigo.org/guidelines/iga-nephropathy/"},
{key:"anemia",name:"Fer et agents de l'érythropoïèse",type:"specific",target:"Anémie associée à la MRC",trial:"KDIGO : recommandations dédiées",result:"Traitent une complication hématologique de la MRC, sans restaurer la filtration néphronique.",limit:"Risque et bénéfice selon hémoglobine, fer et comorbidités.",url:"https://kdigo.org/guidelines/anemia-in-ckd/"},
{key:"cells",name:"Rilparencel / cellules rénales autologues",type:"experimental",target:"Réparation cellulaire",trial:"REGEN-006 / NCT05099770 (phase 3)",result:"Programme expérimental évaluant une thérapie cellulaire rénale en MRC diabétique.",limit:"Aucune restauration complète démontrée ; disponibilité et statut à vérifier dans le registre.",url:"https://clinicaltrials.gov/study/NCT05099770"},
{key:"anti",name:"Antifibrosants et cibles TGF-β / sénescence",type:"experimental",target:"Fibrose rénale / réparation",trial:"Revue 2026 et recherches translationnelles",result:"Mécanismes biologiques étudiés, sans preuve de renversement complet de la fibrose chronique chez l'humain.",limit:"Ni traitement recommandé hors indication, ni preuve de régénération.",url:"https://academic.oup.com/ckj/article/19/9/sfag275/8759698"}
];
const tier={established:"Bénéfice clinique documenté",specific:"Indication rénale spécifique",experimental:"Expérimental / non validé"};
function evidence(){
 const q=$("evidence-search").value.toLocaleLowerCase("fr").trim(),filter=$("evidence-filter").value;
 const found=CATALOG.filter(r=>(filter==="all"||r.type===filter)&&[r.name,r.target,r.trial,r.result,r.limit].join(" ").toLocaleLowerCase("fr").includes(q));
 const root=$("evidence-list");root.replaceChildren();
 for(const d of found){
  const article=document.createElement("article");article.className="entry";
  const tag=document.createElement("span");tag.className="tag";tag.textContent=tier[d.type];
  const name=document.createElement("h3");name.textContent=d.name;
  const info=document.createElement("p");info.textContent=d.target+" · "+d.trial;
  const r=document.createElement("p");r.textContent="Résultat publié : "+d.result;
  const l=document.createElement("p");l.textContent="Limite : "+d.limit;
  const a=document.createElement("a");a.href=d.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Étude ou recommandation source";
  article.append(tag,name,info,r,l,a);root.append(article);
 }
 if(!found.length){const p=document.createElement("p");p.textContent="Aucune entrée correspondant à ces critères.";root.append(p)}
}
$("evidence-search").addEventListener("input",evidence);$("evidence-filter").addEventListener("change",evidence);evidence();
const NAMES={
kidneys:["Reins","Filtration glomérulaire, tubules, équilibre hydrique et électrolytique."],
heart:["Cœur","Débit circulatoire, pression artérielle et syndrome cardiorénal."],
lungs:["Poumons","Échanges respiratoires ; impact des désordres acido-basiques et de la surcharge hydrique."],
liver:["Foie","Métabolisme et biotransformation de médicaments."],
brain:["Cerveau","Conséquences neurologiques possibles de l'urémie et des désordres électrolytiques."],
stomach:["Estomac","Absorption et tolérance digestive."],
intestines:["Intestins","Microbiote, absorption et métabolites urémiques."],
pancreas:["Pancréas","Métabolisme du glucose, diabète et risque rénal."],
bladder:["Vessie","Stockage urinaire ; distincte de la capacité de filtration des reins."],
spleen:["Rate","Organe immunitaire et hématologique."],
vessels:["Vaisseaux","Axes vasculaires artériels et veineux ; hémodynamique rénale."]
};
const canvas=$("human-canvas"),status=$("model-status");
let renderer;
try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});}
catch(err){status.textContent="WebGL indisponible sur cet appareil ; les données cliniques restent accessibles.";throw err;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color("#0b2532");
const camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(3,2.1,8);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2;controls.maxDistance=20;controls.target.set(0,0,0);
scene.add(new T.HemisphereLight(0xe0f3ff,0x253344,2.7));
const key=new T.DirectionalLight(0xfff4e9,3.2);key.position.set(-4,8,6);scene.add(key);
const rim=new T.DirectionalLight(0x75d8e3,2.4);rim.position.set(4,2,-6);scene.add(rim);
const body=new T.Group();scene.add(body);const structures=new T.Group();scene.add(structures);
const organs={};let chosen="kidneys",isolated=false,shellVisible=true;
const mat=(color,opacity=1)=>new T.MeshStandardMaterial({color,metalness:.04,roughness:.62,transparent:opacity<1,opacity,side:T.DoubleSide,depthWrite:opacity>=1});
function ell(group,x,y,z,sx,sy,sz,color,opacity=1){const mesh=new T.Mesh(new T.SphereGeometry(1,28,18),mat(color,opacity));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);group.add(mesh);return mesh;}
function tube(group,coords,r,color,opacity=1){const curve=new T.CatmullRomCurve3(coords.map(c=>new T.Vector3(...c)));const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(16,coords.length*9),r,9,false),mat(color,opacity));group.add(m);return m;}
function capsule(group,a,b,r,color,opacity=1){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=new T.Vector3().subVectors(end,start);const cyl=new T.Mesh(new T.CylinderGeometry(r*.86,r,d.length(),16,1),mat(color,opacity));cyl.position.copy(start).add(end).multiplyScalar(.5);cyl.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());group.add(cyl);ell(group,...a,r,r,r,color,opacity);ell(group,...b,r,r,r,color,opacity);}
function organ(id){const g=new T.Group();g.name=id;structures.add(g);organs[id]=g;return g;}
const skin="#9acbd1",alpha=.10;
ell(body,0,1.59,0,.40,.50,.33,skin,alpha); // skull
ell(body,0,1.86,.03,.31,.30,.30,skin,alpha);
capsule(body,[0,1.24,0],[0,1.04,0],.18,skin,alpha);
ell(body,0,.43,0,.63,.88,.34,skin,alpha);
ell(body,0,-.50,0,.51,.39,.36,skin,alpha);
for(const s of [-1,1]){
 capsule(body,[s*.61,.99,0],[s*.88,.10,.02],.18,skin,alpha);
 capsule(body,[s*.88,.10,.02],[s*.89,-.54,.06],.135,skin,alpha);
 ell(body,s*.89,-.65,.08,.16,.21,.10,skin,alpha);
 capsule(body,[s*.25,-.65,0],[s*.31,-1.64,0],.245,skin,alpha);
 capsule(body,[s*.31,-1.64,0],[s*.32,-2.42,.04],.17,skin,alpha);
 ell(body,s*.32,-2.56,.17,.22,.12,.38,skin,alpha);
}
const kidney=organ("kidneys");for(const s of [-1,1]){const k=ell(kidney,s*.34,-.18,-.20,.19,.27,.13,"#b95769");k.rotation.z=s*.18;ell(kidney,s*.32,-.18,-.08,.065,.11,.03,"#e4a0a4");tube(kidney,[[s*.33,-.32,-.1],[s*.27,-.59,-.07],[s*.12,-.84,.02]],.023,"#e5b29a");}
const heart=organ("heart");const h=ell(heart,-.12,.62,.13,.21,.29,.18,"#dc4b64");h.rotation.z=-.28;tube(heart,[[-.11,.75,.06],[-.12,.94,.09],[.05,1.01,.03]],.055,"#ca4250");
const lungs=organ("lungs");for(const s of [-1,1]){const l=ell(lungs,s*.27,.68,-.08,.24,.40,.24,"#a8a5c8");l.rotation.z=-s*.11;}tube(lungs,[[0,1.25,0],[0,1.0,0],[0,.85,0]],.06,"#9bb5ca");
const liver=organ("liver");const li=ell(liver,.20,.18,.05,.39,.22,.26,"#9f5750");li.rotation.z=.09;ell(liver,.40,.03,.1,.09,.12,.10,"#a2ad6b");
const brain=organ("brain");ell(brain,0,1.88,0,.27,.22,.27,"#d0a7b5");for(const s of [-1,1])for(let i=0;i<5;i++)tube(brain,[[s*.05,1.80+i*.027,.23],[s*.15,1.78+i*.031,.25],[s*.23,1.83+i*.03,.13]],.014,"#ba8194");
const stomach=organ("stomach");const st=ell(stomach,-.20,.05,.16,.19,.22,.15,"#c8847b");st.rotation.z=-.3;
const intestines=organ("intestines");for(let i=0;i<5;i++){const y=-.30-i*.13;tube(intestines,[[-.30,y,.18],[-.18,y+.055,.25],[0,y-.035,.27],[.18,y+.046,.24],[.30,y-.01,.15]],.051,"#ca967c");}
const pancreas=organ("pancreas");const pan=ell(pancreas,.02,-.08,.08,.33,.08,.11,"#e6c584");pan.rotation.z=.09;
const bladder=organ("bladder");ell(bladder,0,-.75,.11,.17,.17,.15,"#d99b80");
const spleen=organ("spleen");const sp=ell(spleen,-.43,.20,-.06,.10,.25,.12,"#994d76");sp.rotation.z=-.3;
const vessels=organ("vessels");tube(vessels,[[0,.92,-.15],[.1,.45,-.22],[.05,.05,-.23],[.04,-.48,-.18],[0,-.75,-.1]],.036,"#d55c64");tube(vessels,[[-.08,.92,-.25],[-.08,.45,-.25],[-.09,-.12,-.25],[-.06,-.65,-.23]],.042,"#557cca");
function select(id){if(!organs[id]&&!refGroups.has(id))return;chosen=id;update();}
function update(){
 if(refModel){updateReference();return;}
 for(const [id,g]of Object.entries(organs)){g.visible=!isolated||id===chosen;g.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.opacity=(id===chosen?1:.30);m.transparent=m.opacity<1;m.depthWrite=m.opacity>=1;}});}
 body.visible=shellVisible&&!isolated;
 for(const b of $("human-organs").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.organ===chosen));
 $("organ-info").textContent=NAMES[chosen][0]+" — "+NAMES[chosen][1]+" Repères schématiques, sans imagerie clinique.";
 $("toggle-body").textContent="Corps transparent : "+(shellVisible?"visible":"masqué");$("toggle-body").setAttribute("aria-pressed",String(shellVisible));
 $("toggle-isolate").setAttribute("aria-pressed",String(isolated));
 $("toggle-isolate").textContent=isolated?"Afficher tous les organes":"Isoler l'organe";
}
for(const [id,[label]] of Object.entries(NAMES)){const b=document.createElement("button");b.type="button";b.dataset.organ=id;b.textContent=label;b.addEventListener("click",()=>select(id));$("human-organs").append(b);}
$("toggle-body").addEventListener("click",()=>{shellVisible=!shellVisible;update()});
$("toggle-isolate").addEventListener("click",()=>{isolated=!isolated;update()});
$("reset-view").addEventListener("click",()=>{camera.position.set(3,2.1,8);controls.target.set(0,0,0);controls.update()});
const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null;
canvas.addEventListener("pointerdown",e=>{down=[e.clientX,e.clientY]});
canvas.addEventListener("pointerup",e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const meshes=[];if(!refModel)for(const [id,g]of Object.entries(organs))if(g.visible)g.traverse(o=>{if(o.isMesh){o.userData.organ=id;meshes.push(o)}});if(refModel){meshes.length=0;for(const item of refMeshes)if(item.mesh.visible)meshes.push(item.mesh)}const hits=raycaster.intersectObjects(meshes);if(hits.length)select(refModel?hits[0].object.userData.prmrKey:hits[0].object.userData.organ)});
function resize(){const box=canvas.getBoundingClientRect();if(box.width<10||box.height<10)return;renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();}
const obs=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;obs?.observe(canvas);window.addEventListener("resize",resize);
let active=true;const viewport=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{active=entries.some(e=>e.isIntersecting)},{rootMargin:"100px"}):null;viewport?.observe(canvas);
function animate(){requestAnimationFrame(animate);if(!active||document.hidden)return;controls.update();renderer.render(scene,camera);}
update();resize();animate();status.textContent="Initialisation de la base anatomique de référence…";

/* R06 reference atlas: licensed 147-structure catalog, male/female meshopt GLBs.
   BodyParts3D © DBCLS CC BY 4.0; female HRA/HuBMAP CC BY 4.0;
   female skin MakeHuman CC0; modified by open-anatomy-3d CC BY 4.0.
   Not a patient scan or a diagnosis tool. */
let refModel=null,refGroups=new Map(),refMeshes=[],refCatalog=[],refSex="male",refToken=0;

let referenceSource="local";
function installLocalBody(sex){
 const built=buildLocalHuman(T,sex);
 if(refModel)scene.remove(refModel);
 refModel=built.root;referenceSource="local";scene.add(refModel);
 refGroups=new Map();refMeshes=[];
 const known=new Map(refCatalog.map(x=>[x.key,x]));
 for(const [id,g]of Object.entries(built.groups)){
  const system=id==="skin"?"skin":id.startsWith("arteries")||id.startsWith("veins")||["aorta","coronary_arteries","vena_cava_inferior","vena_cava_superior","carotid_l","carotid_r"].includes(id)?"vessels":id.startsWith("nerves")?"nerves":["skull","ribs","spine_thoracic","femur_l","femur_r","pelvis"].includes(id)?"skeleton":id.startsWith("muscles")?"muscles":"organs";
  const record=known.get(id)||{key:id,label:id.replaceAll("_"," "),system};
  if(!known.has(id))refCatalog.push(record);
  g.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const normal=mesh.material,transparent=normal.clone(),highlight=normal.clone();
   transparent.transparent=true;transparent.opacity=.10;transparent.depthWrite=false;
   highlight.transparent=false;highlight.opacity=1;highlight.depthWrite=true;
   if(highlight.emissive){highlight.emissive.setHex(0x1f9e96);highlight.emissiveIntensity=.4}
   mesh.userData.prmrKey=id;
   refMeshes.push({mesh,rec:record,normal,transparent,highlight});
   if(!refGroups.has(id))refGroups.set(id,[]);
   refGroups.get(id).push(mesh);
  });
 }
 if(!refGroups.has(chosen))chosen=refGroups.has("kidney_l")?"kidney_l":"heart";
 isolated=false;refLayers={skin:true,skeleton:true,muscles:false,organs:true,vessels:true,nerves:false};
 body.visible=false;structures.visible=false;
 updateReference();refSearch();refFrame();
 status.textContent="Corps "+(sex==="female"?"féminin":"masculin")+" 3D local affiché ("+refGroups.size+" structures). Modèle éducatif ; chargement de la référence anatomique…";
}

let refLayers={skin:false,skeleton:true,muscles:false,organs:true,vessels:true,nerves:false};
let refVesselRoles={arteries:true,veins:true};
const refNames={skull:"Crâne",ribs:"Cage thoracique",pelvis:"Bassin",nerves_spinal:"Nerfs spinaux",muscles_torso:"Muscles du tronc",gallbladder:"Vésicule biliaire",adrenal_l:"Surrénale gauche",adrenal_r:"Surrénale droite",arteries_abdomen:"Artères abdominales",arteries_thorax:"Artères thoraciques",carotid_l:"Carotide gauche",carotid_r:"Carotide droite",coronary_arteries:"Artères coronaires",veins_abdomen:"Veines abdominales",veins_thorax:"Veines thoraciques",pulmonary_vessels:"Vaisseaux pulmonaires",ureter_l:"Uretère gauche",ureter_r:"Uretère droit",colon:"Côlon",small_intestine:"Intestin grêle",trachea:"Trachée",kidney_l:"Rein gauche",kidney_r:"Rein droit",heart:"Cœur",lung_l:"Poumon gauche",lung_r:"Poumon droit",liver:"Foie",brain:"Cerveau",pancreas:"Pancréas",stomach:"Estomac",spleen:"Rate",bladder:"Vessie",aorta:"Aorte",vena_cava_inferior:"Veine cave inférieure",vena_cava_superior:"Veine cave supérieure",uterus:"Utérus"};
const refSystems={skin:"Peau",skeleton:"Squelette",muscles:"Muscles",organs:"Organes",vessels:"Artères et veines",nerves:"Nerfs"};
function refLabel(x){return refNames[x.key]||x.label||x.key}
function updateReference(){
 body.visible=false;structures.visible=false;
 for(const item of refMeshes){
  const picked=item.rec.key===chosen;
  item.mesh.visible=isolated?picked:(refLayers[item.rec.system]===true&&(item.rec.system!=="vessels"||refVesselRoles[/^(vena|veins)/.test(item.rec.key)?"veins":"arteries"]));
  item.mesh.material=picked?item.highlight:item.rec.system==="skin"?item.transparent:item.normal;
 }
 for(const b of document.querySelectorAll("[data-system-layer]")){
  const on=refLayers[b.dataset.systemLayer];b.setAttribute("aria-pressed",String(on));
  b.textContent=(on?"✓ ":"○ ")+refSystems[b.dataset.systemLayer];
 }
 for(const b of document.querySelectorAll("[data-vessel-role]"))b.setAttribute("aria-pressed",String(refVesselRoles[b.dataset.vesselRole]));
 for(const b of document.querySelectorAll("[data-sex]"))b.setAttribute("aria-pressed",String(b.dataset.sex===refSex));
 for(const b of document.querySelectorAll("[data-structure]"))b.setAttribute("aria-pressed",String(b.dataset.structure===chosen));
 $("toggle-isolate").textContent=isolated?"Réafficher les systèmes":"Isoler la structure";$("toggle-isolate").setAttribute("aria-pressed",String(isolated));
 $("toggle-body").textContent=refLayers.skin?"Masquer la peau":"Afficher la peau";$("toggle-body").setAttribute("aria-pressed",String(refLayers.skin));
 const selected=refCatalog.find(x=>x.key===chosen);
 const info=$("organ-info");info.replaceChildren();
 if(selected){const p=document.createElement("p");p.className="muted";p.textContent=refLabel(selected)+" · "+(refSystems[selected.system]||selected.system)+" · Maillage anatomique de référence, non clinique. Aucun diagnostic, débit sanguin ni lésion n'est représenté.";info.append(p);
 if(["kidney_l","kidney_r","ureter_l","ureter_r"].includes(selected.key)){const b=document.createElement("button");b.type="button";b.textContent="Explorer le néphron en 3D";b.addEventListener("click",()=>document.getElementById("microanatomy")?.scrollIntoView({behavior:"smooth",block:"start"}));info.append(b)}
 }else{info.textContent="Sélectionner une structure anatomique."}
}
function refSearch(){
 const root=$("structure-list");root.replaceChildren();
 const term=$("structure-search").value.trim().toLowerCase();
 for(const r of refCatalog.filter(x=>x.system!=="joints"&&(!x.sex||x.sex===refSex)&&([refLabel(x),x.key,x.system].join(" ").toLowerCase().includes(term))).slice(0,90)){
  const b=document.createElement("button");b.className="structure-chip";b.type="button";b.dataset.structure=r.key;b.textContent=refLabel(r);
  b.addEventListener("click",()=>{select(r.key);refFocus(r.key)});
  root.append(b);
 }
 updateReference();
}
function refFocus(id){
 const nodes=refGroups.get(id)||[];if(!nodes.length)return;
 const box=new T.Box3();for(const node of nodes)box.expandByObject(node);
 const center=box.getCenter(new T.Vector3()),length=Math.max(.06,...box.getSize(new T.Vector3()).toArray());
 controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(length*1.6,length*.7,length*2.3));
 camera.near=.001;camera.far=100;camera.updateProjectionMatrix();controls.update();
}
function refFrame(){
 const box=new T.Box3().setFromObject(refModel),center=box.getCenter(new T.Vector3());
 const length=Math.max(.7,...box.getSize(new T.Vector3()).toArray());
 controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(length*.85,length*.22,length*1.7));
 controls.minDistance=length*.08;controls.maxDistance=length*7;camera.near=.001;camera.far=100;camera.updateProjectionMatrix();controls.update();
}
async function loadReference(sex){
 const token=++refToken;refSex=sex;
 installLocalBody(sex);
 status.textContent="Corps "+(sex==="female"?"féminin":"masculin")+" visible ; téléchargement des structures de référence en cours…";
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 let gltf=null;
 const tail="anatomy-"+sex+".glb";
 const urls=["https://cdn.jsdelivr.net/npm/open-anatomy-3d@0.1.0/models/"+tail,
 "https://raw.githubusercontent.com/MervinR07/open-anatomy-3d/main/packages/open-anatomy-3d/models/"+tail];
 for(const url of urls){try{gltf=await loader.loadAsync(url);break}catch(err){console.warn("[PRMR R06] Source de modèle indisponible",url,err)}}
 if(token!==refToken)return;
 if(!gltf){status.textContent="Corps "+(sex==="female"?"féminin":"masculin")+" 3D local actif ; modèle anatomique de référence non disponible sur ce réseau. Sélection, rotation et organes restent fonctionnels.";updateReference();return}
 if(refModel)scene.remove(refModel);
 refModel=gltf.scene;referenceSource="reference";scene.add(refModel);refGroups=new Map();refMeshes=[];
 const map=new Map(refCatalog.map(x=>[x.key,x]));
 const box=new T.Box3().setFromObject(refModel);
 const center=box.getCenter(new T.Vector3());
 refModel.position.set(-center.x,-center.y,-center.z);
 refModel.updateMatrixWorld(true);
 refModel.traverse(node=>{
  if(!node.isMesh)return;
  let ancestor=node,rec=null;
  while(ancestor){if(map.has(ancestor.name)){rec=map.get(ancestor.name);break}ancestor=ancestor.parent}
  if(!rec)return;
  const raw=Array.isArray(node.material)?node.material[0]:node.material;
  const normal=(raw||new T.MeshStandardMaterial()).clone();
  if(rec.system==="skin"){normal.transparent=true;normal.opacity=.13;normal.depthWrite=false;normal.side=T.DoubleSide}
  const transparent=normal.clone();transparent.transparent=true;transparent.opacity=rec.system==="skin"?.13:.24;transparent.depthWrite=false;
  const highlight=normal.clone();highlight.transparent=false;highlight.opacity=1;highlight.depthWrite=true;
  if(highlight.emissive){highlight.emissive.setHex(0x158a83);highlight.emissiveIntensity=.40}
  node.material=normal;node.userData.prmrKey=rec.key;
  refMeshes.push({mesh:node,rec,normal,transparent,highlight});
  if(!refGroups.has(rec.key))refGroups.set(rec.key,[]);
  refGroups.get(rec.key).push(node);
 });
 if(!refMeshes.length){scene.remove(refModel);installLocalBody(sex);status.textContent="Noms des structures du modèle distant incompatibles : modèle local détaillé conservé.";return}
 if(!refGroups.has(chosen))chosen=refGroups.has("kidney_l")?"kidney_l":refMeshes[0].rec.key;
 isolated=false;updateReference();refSearch();refFrame();
 status.textContent="Atlas humain "+(sex==="female"?"féminin":"masculin")+" chargé : "+refGroups.size+" structures anatomiques, "+refMeshes.length+" maillages. Source : BodyParts3D / HuBMAP, CC BY 4.0. Non validé pour diagnostiquer une maladie.";
}
function setupReferenceControls(){
 const controls=$("human-systems");
 for(const [key,name] of Object.entries(refSystems)){
  const b=document.createElement("button");b.dataset.systemLayer=key;b.type="button";b.textContent=name;
  b.addEventListener("click",()=>{refLayers[key]=!refLayers[key];isolated=false;if(refModel)updateReference()});
  controls.append(b);
 }
 const artery=document.createElement("button");artery.type="button";artery.dataset.vesselRole="arteries";artery.textContent="Artères";
 const veins=document.createElement("button");veins.type="button";veins.dataset.vesselRole="veins";veins.textContent="Veines";
 for(const b of [artery,veins])b.addEventListener("click",()=>{refVesselRoles[b.dataset.vesselRole]=!refVesselRoles[b.dataset.vesselRole];refLayers.vessels=true;isolated=false;if(refModel)updateReference()});
 controls.append(artery,veins);
 for(const b of document.querySelectorAll("[data-sex]"))b.addEventListener("click",()=>{if(refSex!==b.dataset.sex)loadReference(b.dataset.sex)});
 $("show-all-layers").addEventListener("click",()=>{refLayers=Object.fromEntries(Object.keys(refSystems).map(k=>[k,true]));refVesselRoles={arteries:true,veins:true};isolated=false;if(refModel)updateReference()});
 $("structure-search").addEventListener("input",()=>{if(refModel)refSearch()});
 $("toggle-body").addEventListener("click",()=>{if(refModel){refLayers.skin=!refLayers.skin;updateReference()}});
 $("reset-view").addEventListener("click",()=>{if(refModel){refLayers={skin:false,skeleton:true,muscles:false,organs:true,vessels:true,nerves:false};refVesselRoles={arteries:true,veins:true};isolated=false;updateReference();refFrame()}});
}
async function launchReference(){
 setupReferenceControls();
 try{
  const res=await fetch("./research-data/r05_human_anatomy_catalog.json",{cache:"force-cache"});
  if(!res.ok)throw Error("Catalogue indisponible");
  refCatalog=await res.json();
  $("human-organs").replaceChildren();
  for(const r of refCatalog.filter(x=>["kidney_l","kidney_r","heart","lung_l","lung_r","liver","brain","pancreas","stomach","spleen","bladder","aorta"].includes(x.key))){
   const b=document.createElement("button");b.dataset.structure=r.key;b.type="button";b.textContent=refLabel(r);
   b.addEventListener("click",()=>{select(r.key);refFocus(r.key)});
   $("human-organs").append(b);
  }
  await loadReference("male");
 }catch(e){status.textContent="Atlas anatomique détaillé inaccessible : "+e.message+". Modèle schématique conservé."}
}

launchReference();

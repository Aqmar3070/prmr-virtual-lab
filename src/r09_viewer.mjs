/**
 * PRMR R09 — a real interactive WebGL 3D scene (Three.js MIT, vendored locally).
 * Dog: licensed CT-derived organ GLBs + sculpted coat; fully provenance-tagged.
 * Other five animals: independent animated-free 3D anatomical *concept meshes*.
 * No image billboards, cropped posters, or false claims of lesion detection.
 */
import * as T from "../vendor/three/build/three.module.js";
import {OrbitControls} from "../vendor/three/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "../vendor/three/examples/jsm/libs/meshopt_decoder.module.js";
import {ORGAN_MODES,SPECIES_ANATOMY,organAssessment,ORGANS_INTERACTIONS} from "./r09_organ_catalog.mjs";
import {makeSpeciesGroups,disposeOrganGroup} from "./r09_organ_geometry.mjs";
import {createAnatomyViewer as fallback2D} from "./r08_anatomy.mjs";
const ORGAN_ORDER=Object.keys(ORGAN_MODES).filter(x=>x!=="all");
const C=Math.PI;
const IDs=new Set(ORGAN_ORDER);
/* Espèces dont l'anatomie provient de modèles réels importés, et non d'une
   construction procédurale. Les cinq espèces procédurales ont été retirées :
   seule une anatomie acquise est affichée dans ce laboratoire. */
export const SCANNED_SPECIES=Object.freeze({
 dog:{visceral:"./assets/vet3d/dog-visceral.glb",coat:"./assets/vet3d/dog-coat.glb",
  mode:"canine-CT-derived-hybrid-GLB",
  scanOrgans:["kidneys","liver","heart"]},
 cat:{visceral:"./assets/vet3d/cat-visceral.glb",coat:"./assets/vet3d/cat-coat.glb",
  mode:"feline-CT-derived-hybrid-GLB",
  scanOrgans:["kidneys","liver","digestive"]}
});
function kindFromName(name){
 const n=(name||"").toLowerCase();
 if(/kidney|renal|urinary-bladder/.test(n))return "kidneys";
 if(/heart|aorta|venae-cavae|great-vessels|pulmonary-trunk|pulmonary-veins/.test(n))return "heart";
 if(/lungs|trachea|thyroid/.test(n))return "lungs";
 if(/liver/.test(n))return "liver";
 if(/brain/.test(n))return "brain";
 if(/pancreas/.test(n))return "pancreas";
 if(/small-intestine|large-intestine|stomach|esophagus|spleen/.test(n))return "digestive";
 return null;
}
function disposeMeshes(root){
 root?.traverse?.(o=>{
  o.geometry?.dispose?.();
  for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){
   m.map?.dispose?.();m.normalMap?.dispose?.();m.dispose?.();
  }
 });
}
function makeViewer(canvas,{species="dog",organ="kidneys",isolated=false,onRender=null,onOrganPick=null}={}){
 const unsupported={supported:false,isTrue3D:false,set(){},setOrgan(){},setBodyVisible(){},setIsolated(){},setLinksVisible(){},destroy(){},get mode(){return "unavailable"}};
 if(!canvas||!SPECIES_ANATOMY[species])species="dog";
 let renderer;
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance",preserveDrawingBuffer:true})}catch(err){
  const simple=fallback2D(canvas,{species,organ:ORGAN_MODES[organ]&&["kidneys","heart","liver","lungs","all"].includes(organ)?organ:"all",onRender});
  return {...simple,isTrue3D:false,setOrgan(id){simple.setOrgan(["kidneys","heart","liver","lungs","all"].includes(id)?id:"all")},setBodyVisible(){},setIsolated(){},setLinksVisible(){}};
 }
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.34;
 renderer.setClearColor(0x092333,0);
 const scene=new T.Scene();scene.background=new T.Color("#082b38");
 scene.fog=new T.FogExp2("#082b38",.028);
 const camera=new T.PerspectiveCamera(37,1,.01,180);
 camera.position.set(3.6,2.3,6.8);
 const controls=new OrbitControls(camera,canvas);
 controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;
 controls.minDistance=.5;controls.maxDistance=35;
 controls.minPolarAngle=.08;controls.maxPolarAngle=C-.08;
 const ambient=new T.HemisphereLight(0xd4f0ff,0x371a1d,2.0);scene.add(ambient);
 const key=new T.DirectionalLight(0xffefdf,4.0);key.position.set(-3,6,7);scene.add(key);
 const rim=new T.DirectionalLight(0x8acbdc,2.1);rim.position.set(5,4,-4);scene.add(rim);
 const fill=new T.DirectionalLight(0xf5a09c,.7);fill.position.set(-4,-2,-2);scene.add(fill);
 const root=new T.Group();scene.add(root);
 const lineRoot=new T.Group();root.add(lineRoot);
 const back=new T.Mesh(new T.SphereGeometry(120,20,14),new T.MeshBasicMaterial({color:0x0a303f,side:T.BackSide}));
 scene.add(back);
 let current=species,focus=ORGAN_MODES[organ]?organ:"kidneys",bodyVisible=!isolated,only=!!isolated,linksOn=false;
 let mode="procedural-preview",sourceStatus="NOT_VALIDATED",organs={},ghost=null,dogReal=null,realByOrgan=null;
 let visibility=true,alive=true,raf=0,renderCount=0,activeInput={renal:"normal",hepatic:"normal",disease:"fibrotic"};
 let sceneToken=0,raycaster=new T.Raycaster(),pointer=new T.Vector2(),pointerStart=null,observer=null,resizeObserver=null;
 function clear(){
  if(root){
   for(const child of [...root.children]){root.remove(child);if(child!==lineRoot)disposeMeshes(child)}
   if(lineRoot.parent!==root)root.add(lineRoot);lineRoot.clear();
  }
  organs={};ghost=null;dogReal=null;realByOrgan=null;
 }
 function resize(){
  if(!alive)return;
  const rect=canvas.getBoundingClientRect();if(rect.width<=5||rect.height<=5)return;
  const w=Math.round(rect.width),h=Math.round(rect.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  request();
 }
 function paint(){
  raf=0;if(!alive||!visibility)return;
  controls.update();
  renderer.render(scene,camera);
  renderCount++;
  canvas.dataset.anatomyRender=String(renderCount);
  canvas.dataset.anatomySpecies=current;
  canvas.dataset.anatomyOrgan=focus;
  canvas.dataset.anatomyEngine="webgl-three";
  canvas.dataset.anatomySource=mode;
  canvas.dataset.anatomyModelFidelity=sourceStatus;
  onRender?.({species:current,organ:focus,count:renderCount,source:mode});
 }
 function request(){if(alive&&visibility&&!raf)raf=requestAnimationFrame(paint)}
 function frameView(target=undefined){
  const object=target||root;
  const box=new T.Box3().setFromObject(object);
  if(box.isEmpty())return;
  const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),radius=Math.max(size.x,size.y,size.z,.1);
  controls.target.copy(center);
  camera.position.copy(center).add(SCANNED_SPECIES[current]&&mode===SCANNED_SPECIES[current].mode
    ?new T.Vector3(radius*1.62,radius*.56,radius*.48)
    :new T.Vector3(radius*.87,radius*.46,radius*1.44));
  camera.near=Math.max(.01,radius/1000);camera.far=Math.max(100,radius*80);camera.updateProjectionMatrix();
  controls.minDistance=radius*.22;controls.maxDistance=radius*11;
  controls.update();request();
 }
 function groupCenter(o){
  const box=new T.Box3().setFromObject(o);return box.isEmpty()?new T.Vector3():box.getCenter(new T.Vector3());
 }
 function interactions(){
  lineRoot.clear();
  if(!linksOn||only)return;
  for(const [key,link]of Object.entries(ORGANS_INTERACTIONS)){
   if(!organs[link.a]||!organs[link.b])continue;
   const a=groupCenter(organs[link.a]),b=groupCenter(organs[link.b]),mid=a.clone().lerp(b,.5);mid.y+=.17;
   const geometry=new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3([a,mid,b]).getPoints(24));
   const line=new T.Line(geometry,new T.LineDashedMaterial({color:0x63e3d4,transparent:true,opacity:.77,dashSize:.055,gapSize:.039}));
   line.computeLineDistances();line.userData={interaction:key,description:link.description};lineRoot.add(line);
  }
 }
 function assessmentColor(id){
  const state=organAssessment(activeInput),intensity=state.attention[id];
  return intensity==="severe"?0xff633f:intensity==="moderate"?0xf3a34c:intensity==="mild"?0xecc47b:null;
 }
 function organVisibility(){
  for(const [id,g]of Object.entries(organs)){
   const focused=focus==="all"||focus===id;
   g.visible=focus==="all"||focused||!only;
   g.traverse(o=>{
    if(!o.isMesh)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){
     m.transparent=!focused||m.userData?.translucent||false;
     m.opacity=focused?1:0.18;
     m.depthWrite=focused;
     m.side=T.DoubleSide;
     if(m.emissive){
      const warning=assessmentColor(id);
      m.emissive.setHex(warning&&focused?warning:0x000000);
      m.emissiveIntensity=warning&&focused?.13:0;
     }
     m.needsUpdate=true;
    }
   });
  }
  if(ghost)ghost.visible=bodyVisible&&!only;
  if(dogReal&&dogReal.coat)dogReal.coat.visible=bodyVisible&&!only;
  interactions();
  if(only&&focus!=="all"&&organs[focus])frameView(organs[focus]);else frameView();
  request();
 }
 function generated(speciesId){
  clear();
  const built=makeSpeciesGroups(speciesId);
  organs=built.organs;ghost=built.body;
  for(const g of Object.values(organs))root.add(g);
  root.add(ghost);
  mode="species-specific-procedural";
  sourceStatus="EDUCATIONAL_NOT_VALIDATED";
  organVisibility();
 }
 async function scannedSpecies(token,species){
  const spec=SCANNED_SPECIES[species];if(!spec)return;
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const load=url=>new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
  try{
   const [visceral,coat]=await Promise.all([
    load(spec.visceral),load(spec.coat)
   ]);
   if(!alive||token!==sceneToken||current!==species){disposeMeshes(visceral.scene);disposeMeshes(coat.scene);return}
   clear();
   // Both GLBs share the original source coordinates: retain their relative registration.
   const raw=new T.Group();raw.add(visceral.scene,coat.scene);
   const coatBox=new T.Box3().setFromObject(coat.scene);
   if(coatBox.isEmpty())throw new Error("Géométrie importée inexploitable pour "+species);
   const center=coatBox.getCenter(new T.Vector3()),size=coatBox.getSize(new T.Vector3());
   const scale=4.65/Math.max(size.x,size.y,size.z,.1);
   raw.scale.setScalar(scale);raw.position.copy(center).multiplyScalar(-scale);
   const keyed={};const targetNames={};
   function register(node,inherited=null){
    const id=kindFromName(node.name)||inherited;
    if(node.isMesh){
     if(id){
      if(!keyed[id])keyed[id]=new T.Group();
      keyed[id].name=id;
      // geometry is expressed within full source transforms; put a cloned THREE mesh into an independently toggled object without breaking world registration.
      node.updateWorldMatrix(true,false);
      const copy=node.clone(false);
      copy.geometry=node.geometry;copy.material=node.material?.clone?.()||node.material;
      if(id&&copy.material){
       const visualColors={kidneys:"#bf686e",heart:"#bd4e5a",lungs:"#d68e98",liver:"#a7585a",brain:"#d3a1b1",digestive:"#df968b",pancreas:"#e1c186"};
       const collection=Array.isArray(copy.material)?copy.material:[copy.material];
       for(const m of collection){
        m.color?.set(visualColors[id]||"#d6a1a0");
        m.roughness=.54;m.metalness=0;
        if("clearcoat" in m)m.clearcoat=.18;
        m.needsUpdate=true;
       }
      }
      const inv=new T.Matrix4().copy(visceral.scene.matrixWorld).invert();copy.matrix.multiplyMatrices(inv,node.matrixWorld);copy.matrixAutoUpdate=false;
      keyed[id].add(copy);targetNames[node.name]=id;
     }
    }
    for(const child of node.children||[])register(child,id);
   }
   visceral.scene.updateMatrixWorld(true);
   register(visceral.scene);
   const collected=new T.Group();
   for(const [id,g]of Object.entries(keyed)){const wrapper=new T.Group();wrapper.name=id;wrapper.add(g);organs[id]=wrapper;collected.add(wrapper)}
   root.add(raw);
   // Keep original coat but disable duplicate raw visceral meshes; only our organ toggles are selectable.
   visceral.scene.visible=false;
   raw.add(collected);
   // Visual shell must be a genuinely transparent overlay, not an opaque white dog.
   coat.scene.traverse(obj=>{
    if(!obj.isMesh)return;
    const list=Array.isArray(obj.material)?obj.material:[obj.material];
    obj.material=list.map(m=>{
     const translucent=m.clone();
     translucent.transparent=true;
     translucent.opacity=.115;
     translucent.depthWrite=false;
     translucent.side=T.DoubleSide;
     translucent.roughness=.67;
     translucent.color?.set("#a7cbd5");
     return translucent;
    });
    if(obj.material.length===1)obj.material=obj.material[0];
   });
   ghost=null;dogReal={coat:coat.scene,raw,meshGroups:collected};
   mode=spec.mode;
   sourceStatus="CT_DERIVED_AND_MODELED_NOT_DIAGNOSTIC";
   canvas.dataset.anatomySource=mode;
   canvas.dataset.anatomyModelFidelity=sourceStatus;
   delete canvas.dataset.anatomyLoadingError;
   // If a subset is absent, preserve an explicitly synthetic placeholder, never mislabel it.
   const fallback=makeSpeciesGroups(species);disposeOrganGroup(fallback.body);
   for(const [id,g]of Object.entries(fallback.organs)){
    if(!organs[id]){g.userData.fallback=true;organs[id]=g;root.add(g)}
    else disposeOrganGroup(g);
   }
   organVisibility();
   canvas.dataset.canineScanNodes=String(Object.keys(targetNames).length);
   delete canvas.dataset.anatomyPending;
  }catch(e){
   if(!alive||token!==sceneToken)return;
   canvas.dataset.anatomyLoadingError=e.message||String(e);
   canvas.dataset.anatomySource=mode;
   console.warn("[PRMR-R09] Canine CT model unavailable:",e);
   mode="species-specific-procedural";
   sourceStatus="EDUCATIONAL_NOT_VALIDATED";
   delete canvas.dataset.anatomyPending;
   generated(current);
   request();
  }
 }
 function setSpecies(id){
  if(!SPECIES_ANATOMY[id])return;
  current=id;canvas.dataset.anatomySpecies=id;const token=++sceneToken;
  // Le corps géométrique était construit d'abord, puis remplacé par les
  // organes issus de scanner une fois le fichier arrivé : on voyait donc
  // toujours la version brute clignoter avant la vraie. Quand un scanner
  // existe pour cette espèce, on l'attend. La version géométrique ne
  // revient que s'il échoue — c'est déjà ce que fait scannedSpecies dans
  // son bloc d'erreur, en rappelant request().
  if(SCANNED_SPECIES[id]){canvas.dataset.anatomyPending="1";scannedSpecies(token,id);return}
  generated(id);
 }
 function select(id){
  if(!ORGAN_MODES[id])return;
  focus=id;canvas.dataset.anatomyOrgan=id;organVisibility();
 }
 const onPick=e=>{
  if(pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;
  const rect=canvas.getBoundingClientRect();if(!rect.width)return;
  pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const candidates=[];for(const [id,g]of Object.entries(organs))g.traverse(o=>{if(o.isMesh&&g.visible){o.userData.pickId=id;candidates.push(o)}});
  const hits=raycaster.intersectObjects(candidates,false);
  if(hits.length){const id=hits[0].object.userData.pickId;select(id);onOrganPick?.(id)}
 };
 const pointerDown=e=>{pointerStart=[e.clientX,e.clientY]};
 canvas.addEventListener("pointerdown",pointerDown);
 canvas.addEventListener("pointerup",onPick);
 controls.addEventListener("change",request);
 const reset=()=>frameView(only&&focus!=="all"?organs[focus]:root);
 canvas.addEventListener("dblclick",reset);
 const resized=()=>resize();
 if("ResizeObserver"in window){resizeObserver=new ResizeObserver(resized);resizeObserver.observe(canvas)}
 else window.addEventListener("resize",resized);
 if("IntersectionObserver"in window){
  observer=new IntersectionObserver(entries=>{visibility=entries.some(e=>e.isIntersecting);if(visibility)request()},{rootMargin:"140px"});
  observer.observe(canvas);
 }
 const vis=()=>{visibility=!document.hidden;if(visibility)request()};
 document.addEventListener("visibilitychange",vis);
 canvas.style.touchAction="none";canvas.tabIndex=0;
 resize();setSpecies(species);
 /* Point d'ancrage d'un organe, en pixels du canevas : le centre de son
    groupe projeté à l'écran. L'étiquette posée par src/r20_callouts.mjs s'y
    rattache. Recalculé à la demande, puisque l'animal tourne. */
 const _a=new T.Vector3(),_b=new T.Box3();
 function ancres(){
  const rect=canvas.getBoundingClientRect(),points={};
  for(const [id,groupe] of Object.entries(organs)){
   if(!groupe.visible)continue;
   _b.makeEmpty();_b.expandByObject(groupe);
   if(_b.isEmpty())continue;
   _b.getCenter(_a);_a.project(camera);
   points[id]={x:(_a.x*.5+.5)*rect.width,y:(-_a.y*.5+.5)*rect.height,visible:_a.z<1};
  }
  return points;
 }
 return {
  supported:true,isTrue3D:true,ancres,
  set(p){
   if(p.species&&p.species!==current)setSpecies(p.species);
   if(p.organ&&p.organ!==focus)select(p.organ);
   if(p.inputs){activeInput=p.inputs;organVisibility()}
  },
  setOrgan(id){select(id)},
  setBodyVisible(v){bodyVisible=Boolean(v);organVisibility()},
  setIsolated(v){only=Boolean(v);organVisibility()},
  setLinksVisible(v){linksOn=Boolean(v);interactions();request()},
  get mode(){return focus},
  get source(){return mode},
  destroy(){
   alive=false;sceneToken++;cancelAnimationFrame(raf);
   controls.dispose();observer?.disconnect();resizeObserver?.disconnect();
   if(!resizeObserver)window.removeEventListener("resize",resized);
   document.removeEventListener("visibilitychange",vis);
   canvas.removeEventListener("pointerdown",pointerDown);canvas.removeEventListener("pointerup",onPick);
   canvas.removeEventListener("dblclick",reset);clear();renderer.dispose();renderer.forceContextLoss();
  }
 };
}
export {ORGAN_MODES};
export const createAnatomyViewer=makeViewer;

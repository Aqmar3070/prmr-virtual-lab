import * as T from "../vendor/three/build/three.module.js";
import {OrbitControls} from "../vendor/three/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "../vendor/three/examples/jsm/libs/meshopt_decoder.module.js";

const styles={skin:[0x70d9f7,.09],organs:[0x62b5d3,.68],muscles:[0x997ab5,.26],skeleton:[0x96c9db,.24],vessels:[0x64aecc,.3],nerves:[0xf1cc87,.65]};
const labels={organs:"Organes",muscles:"Muscles",skin:"Peau",skeleton:"Squelette",vessels:"Vaisseaux",nerves:"Nerfs",brain:"Cerveau",lung:"Poumon",heart:"Cœur",liver:"Foie",kidney:"Rein",calf:"Mollet",foot:"Pied",hand:"Main",small_intestine:"Intestin grêle",stomach:"Estomac",colon:"Côlon",spleen:"Rate",pancreas:"Pancréas",bladder:"Vessie",aorta:"Aorte",skull:"Crâne",spinal_cord:"Moelle épinière",foot_muscles:"Muscles du pied",skin_1:"Peau",eye:"Œil",femur:"Fémur",ribs:"Côtes",breast:"Sein",uterus:"Utérus",ovary:"Ovaire",diaphragm:"Diaphragme",cerebellum:"Cervelet",quadriceps:"Quadriceps"};
function nameOf(key){
 const side=key.match(/_([lr])$/),base=side?key.slice(0,-2):key;
 return (labels[base]||base.replaceAll("_"," "))+(side?(side[1]==="l"?" · gauche":" · droite"):"");
}
const $=id=>document.getElementById(id),stage=$("xa-stage"),focus=$("xa-focus");
const canvas=document.createElement("canvas");canvas.tabIndex=0;canvas.setAttribute("aria-label","Atlas anatomique en 3D. Glisser pour tourner. Molette ou pincement pour zoomer. Flèches pour tourner au clavier.");
let renderer,ctx;
try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));}catch{ctx=canvas.getContext("2d");}
stage.prepend(canvas);
const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.001,100);
scene.add(new T.HemisphereLight(0xe5faff,0x30435d,1.8));const light=new T.DirectionalLight(0xd9faff,2.5);light.position.set(-2,4,3);scene.add(light);
const controls=new OrbitControls(camera,canvas);controls.enablePan=true;controls.zoomToCursor=true;controls.screenSpacePanning=true;controls.minZoom=.35;controls.maxZoom=100;
const layers=new Set(Object.keys(styles).filter(s=>s!=="nerves"));
let root=null,items=[],bounds,scale=1,token=0,sex=null,signals=[],current=null;
const cache=new Map(),loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
function draw(){
 if(!root||!stage.clientWidth||!stage.clientHeight)return;
 if(renderer){renderer.render(scene,camera);return;}
 camera.updateMatrixWorld();
 const mat=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).elements;
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 for(const item of items){
  if(!item.mesh.visible)continue;
  const xyz=item.samples,material=item.mesh.material,bright=item.active||item===current;
  ctx.fillStyle="#"+material.color.getHexString();ctx.globalAlpha=Math.min(.96,material.opacity*(bright?1:.8));
  const radius=Math.min(4,Math.max(.9,w/330)*Math.sqrt(camera.zoom));
  for(let i=0;i<xyz.length;i+=3){
   const x=xyz[i],y=xyz[i+1],z=xyz[i+2];
   ctx.fillRect((1+mat[0]*x+mat[4]*y+mat[8]*z+mat[12])*w/2,(1-mat[1]*x-mat[5]*y-mat[9]*z-mat[13])*h/2,radius,radius);
  }
 }
 ctx.globalAlpha=1;
}
function resize(){
 const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
 const half=scale*.52,aspect=w/h;camera.top=half;camera.bottom=-half;camera.left=-half*aspect;camera.right=-camera.left;camera.updateProjectionMatrix();
 if(renderer)renderer.setSize(w,h,false);else{canvas.width=w;canvas.height=h;}
 draw();
}
function paint(){
 const isolated=$("xa-isolate").checked&&current;
 for(const it of items){
  const [color,opacity]=it.mesh.name.startsWith("lung_")?[0xe3918f,.83]:styles[it.layer];const signal=signals.find(s=>s.zone===it.mesh.name||(s.zone==="kidney_l"&&it.mesh.name==="kidney_r"));
  it.active=!!signal;it.mesh.visible=isolated?it===current:layers.has(it.layer);
  const m=it.mesh.material;m.color.set(signal?(signal.sign>0?0x32e5ae:0xff9c37):color);m.opacity=(signal || it===current) ? .94 : opacity;m.emissive.copy(m.color);m.emissiveIntensity=signal ? .45 : .09;
 }draw();
}
function frame(target){
 if(!root)return;current=target||null;const box=current?current.box:bounds,c=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
 const dir=new T.Vector3(0,0,1);
 camera.position.copy(c).addScaledVector(dir,scale*2);controls.target.copy(c);
 const aspect=Math.max(.15,stage.clientWidth/stage.clientHeight);
 camera.zoom=Math.min(35,scale/Math.max(size.y,size.x/aspect,scale*.025))*(current ? .8 : .93);camera.updateProjectionMatrix();controls.update();paint();
}
function choose(key){
 if(key.startsWith("toes_")){
  const foot=items.find(i=>i.mesh.name==="foot_"+key.slice(-1));
  if(!foot)return;
  choose(foot.mesh.name);
  const toeBox=foot.box.clone();
  toeBox.min.z+=toeBox.getSize(new T.Vector3()).z*.72;
  const centre=toeBox.getCenter(new T.Vector3());
  camera.position.add(centre.clone().sub(controls.target));controls.target.copy(centre);
  zoom(1.8);controls.update();focus.value=key;return;
 }const it=items.find(i=>i.mesh.name===key);focus.value=it?key:"";if(it){layers.add(it.layer);syncLayers();}frame(it);}
function syncLayers(){for(const el of $("xa-layers").querySelectorAll("input"))el.checked=layers.has(el.value);}
for(const [key,label] of Object.entries(labels).filter(([key])=>key in styles)){
 const wrap=document.createElement("label"),input=document.createElement("input");input.type="checkbox";input.value=key;input.checked=layers.has(key);
 input.onchange=()=>{if(input.checked)layers.add(key);else layers.delete(key);paint();};wrap.append(input," "+label);$("xa-layers").append(wrap);
}
let surfaces;
function ajusterMaillage(mesh, geometrie, transformation){
 const copie=geometrie.clone().applyMatrix4(transformation);
 mesh.geometry=copie;
 mesh.position.set(0,0,0);
 mesh.quaternion.identity();
 mesh.scale.set(1,1,1);
 mesh.updateMatrixWorld(true);
}
function recalage(source,cible){
 const dimensions=cible.getSize(new T.Vector3()).divide(source.getSize(new T.Vector3()));
 const origine=source.getCenter(new T.Vector3());
 const translation=cible.getCenter(new T.Vector3()).sub(origine.multiply(dimensions));
 return new T.Matrix4().makeScale(dimensions.x,dimensions.y,dimensions.z).setPosition(translation);
}
async function preparerModele(next){
 const corps=(await loader.loadAsync("./assets/human3d/anatomy-"+next+".glb")).scene;
 corps.updateMatrixWorld(true);
 if(!surfaces)surfaces=loader.loadAsync("./assets/human3d/lung-surfaces.glb").catch(err=>{surfaces=null;throw err;});
 const poumons=(await surfaces).scene;
 poumons.updateMatrixWorld(true);
 const cage=new T.Box3();
 for(const cote of ["l","r"])cage.expandByObject(corps.getObjectByName("ribs_"+cote));
 const dimensions=cage.getSize(new T.Vector3()),centre=cage.getCenter(new T.Vector3());
 dimensions.multiply(new T.Vector3(.86,.84,.86));
 const cible=new T.Box3().setFromCenterAndSize(centre,dimensions);
 const transformation=recalage(new T.Box3().setFromObject(poumons),cible);
 for(const cote of ["l","r"]){
  const surface=poumons.getObjectByName("lung_"+cote);
  ajusterMaillage(corps.getObjectByName(surface.name),surface.geometry,transformation.clone().multiply(surface.matrixWorld));
 }
 if(next==="female"){
  // Recaler le groupe musculaire sur le fémur homologue, sans la déformation vers les bras.
  const reference=await chargerModele("male");
  for(const cote of ["l","r"]){
   const femur="femur_"+cote;
   const correction=recalage(new T.Box3().setFromObject(reference.getObjectByName(femur)),new T.Box3().setFromObject(corps.getObjectByName(femur)));
   for(const groupe of ["quadriceps","hamstrings","adductors"]){
    const nom=groupe+"_"+cote, muscle=reference.getObjectByName(nom);
    // Les attributs quantifiés doivent être convertis en flottants avant le recalage.
    const geo=muscle.geometry.clone(), pos=geo.getAttribute("position");
    const valeurs=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++)valeurs.set([pos.getX(i),pos.getY(i),pos.getZ(i)],i*3);
    geo.setAttribute("position",new T.BufferAttribute(valeurs,3));
    ajusterMaillage(corps.getObjectByName(nom),geo,correction.clone().multiply(muscle.matrixWorld));geo.dispose();
   }
  }
 }
 return corps;
}
function chargerModele(sexe){
 if(!cache.has(sexe))cache.set(sexe,preparerModele(sexe).catch(err=>{cache.delete(sexe);throw err;}));
 return cache.get(sexe);
}
async function model(next){
 const id=++token;sex=next;current=null;focus.replaceChildren(new Option("Corps entier",""));
 if(root)scene.remove(root);root=null;items=[];stage.parentNode.classList.remove("xa-ready");$("xa-message").textContent="Chargement du maillage 3D…";
 try{
  if(!renderer&&!ctx)throw Error();
  const obj=await chargerModele(next);if(id!==token)return;
  root=obj;root.updateMatrixWorld(true);scene.add(root);
  root.traverse(mesh=>{if(!mesh.isMesh)return;const layer=mesh.parent.name in styles?mesh.parent.name:"organs";
   if(!mesh.userData.xpMaterial){mesh.material=new T.MeshPhongMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});mesh.userData.xpMaterial=true;}
   let samples=null;
   if(ctx){if(!mesh.userData.xpPoints){const pos=mesh.geometry.attributes.position,arr=[],v=new T.Vector3(),budget=layer==="skin"?6500:550;
    for(let j=0;j<pos.count;j+=Math.max(1,Math.ceil(pos.count/budget))){v.fromBufferAttribute(pos,j).applyMatrix4(mesh.matrixWorld);arr.push(v.x,v.y,v.z);}mesh.userData.xpPoints=new Float32Array(arr);}
    samples=mesh.userData.xpPoints;}
   items.push({mesh,layer,samples,box:new T.Box3().setFromObject(mesh)});
  });
  bounds=new T.Box3().setFromObject(root);scale=bounds.getSize(new T.Vector3()).y;
  for(const layer of Object.keys(styles)){const group=document.createElement("optgroup");group.label=labels[layer];for(const it of items.filter(i=>i.layer===layer).sort((a,b)=>nameOf(a.mesh.name).localeCompare(nameOf(b.mesh.name),"fr")))group.append(new Option(nameOf(it.mesh.name),it.mesh.name));focus.append(group);}
  for(const [key,label] of [["toes_l","Orteils gauches"],["toes_r","Orteils droits"]])focus.append(new Option(label,key));
  stage.parentNode.classList.add("xa-ready");resize();frame(null);$("xa-message").textContent=items.length+" structures · "+(ctx?"rendu 3D en points":"surfaces 3D")+" · molette sur la zone pour zoomer · glisser pour tourner · clic droit + glisser pour déplacer";
 }catch{if(id!==token)return;cache.delete(next);sex=null;$("xa-message").textContent="Atlas 3D indisponible · vue de référence affichée.";}
}
for(const bouton of document.querySelectorAll("[data-structure]"))bouton.onclick=()=>choose(bouton.dataset.structure);
focus.onchange=()=>choose(focus.value);$("xa-isolate").onchange=paint;
function zoom(factor){camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.35,100);camera.updateProjectionMatrix();draw();}
$("xa-in").onclick=()=>zoom(1.4);$("xa-out").onclick=()=>zoom(1/1.4);$("xa-reset").onclick=()=>choose("");
canvas.onkeydown=e=>{if(!root)return;const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(e.key==="ArrowRight")s.theta+=.15;else if(e.key==="ArrowLeft")s.theta-=.15;else if(e.key==="ArrowUp")s.phi-=.15;else if(e.key==="ArrowDown")s.phi+=.15;else return;e.preventDefault();s.makeSafe();camera.position.setFromSpherical(s).add(controls.target);controls.update();};
controls.addEventListener("change",draw);new ResizeObserver(resize).observe(stage);
document.addEventListener("xp-atlas",e=>{signals=e.detail.signals;if(e.detail.sex!==sex)model(e.detail.sex);else paint();});
document.addEventListener("xp-focus",e=>choose(e.detail));model(document.querySelector("#sex-choice [aria-pressed=true]")?.dataset.sex||"male");
document.dispatchEvent(new Event("xp-atlas-ready"));

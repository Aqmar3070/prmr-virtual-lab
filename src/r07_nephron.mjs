/** PRMR R07 — exploratory nephron microanatomy. NOT CT, histology, measured flow, or clinical simulator. */
import * as T from "../vendor/three/build/three.module.js";
import {OrbitControls} from "../vendor/three/examples/jsm/controls/OrbitControls.js";
const $=id=>document.getElementById(id);
const PARTS={
 glomerulus:{label:"Glomérule et capsule de Bowman",type:"Filtration",note:"Barrière de filtration : endothélium fenestré, membrane basale glomérulaire, podocytes. Les maillages ne représentent pas les cellules individuellement."},
 afferent:{label:"Artériole afférente",type:"Circulation",note:"Apporte le sang au glomérule ; contrôle hémodynamique."},
 efferent:{label:"Artériole efférente",type:"Circulation",note:"Draine le sang du glomérule et participe à la pression intraglomérulaire."},
 proximal:{label:"Tubule proximal",type:"Transport tubulaire",note:"Réabsorption de sodium, glucose et autres solutés ; site fonctionnel de SGLT2."},
 descending:{label:"Branche descendante de l'anse de Henlé",type:"Concentration urinaire",note:"Perméabilité à l'eau et mécanisme de concentration médullaire."},
 ascending:{label:"Branche ascendante de l'anse de Henlé",type:"Concentration urinaire",note:"Transport de sels, gradient cortico-médullaire ; représentation non quantitative."},
 distal:{label:"Tubule distal",type:"Transport tubulaire",note:"Régulation ionique et équilibre électrolytique."},
 collecting:{label:"Tube collecteur",type:"Urine finale",note:"Régulation finale de l'eau et du sodium, sous contrôle hormonal."},
 capillaries:{label:"Capillaires péritubulaires / vasa recta",type:"Microcirculation",note:"Échanges avec les tubules et la médullaire, sans mesure de perfusion réelle."},
 cortex:{label:"Cortex rénal",type:"Topographie",note:"Repère spatial approximatif ; un rein contient de nombreux néphrons, non un seul."},
 medulla:{label:"Médullaire rénale",type:"Topographie",note:"Région médullaire schématique ; pyramides et architecture ne sont pas fidèlement reconstruites."}
};
export function mountNephron(){
 const canvas=$("nephron-canvas");if(!canvas)return;
 const info=$("nephron-info"),picker=$("nephron-parts"),status=$("nephron-status");
 let renderer;
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=T.SRGBColorSpace}
 catch(e){status.textContent="WebGL indisponible ; représentation microscopique 3D non accessible.";return}
 const scene=new T.Scene();scene.background=new T.Color("#092332");
 const camera=new T.PerspectiveCamera(42,1,.01,80);camera.position.set(4.2,1.9,6.8);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=14;controls.target.set(0,0,0);
 scene.add(new T.HemisphereLight(0xe6f8ff,0x1b2231,2.7));const light=new T.DirectionalLight(0xffeee0,3.2);light.position.set(-4,6,6);scene.add(light);
 const groups={};const all=new T.Group();scene.add(all);let current="glomerulus",mode="both",only=false,showZones=true;let active=true;
 const palettes={blood:0xcf5368,filtrate:0x69e9ca,tissue:0x9dadd1};
 function mat(color,opacity=1){return new T.MeshStandardMaterial({color,roughness:.59,metalness:.07,transparent:opacity<1,opacity,depthWrite:opacity>=1,side:T.DoubleSide})}
 function group(key){const g=new T.Group();g.name=key;groups[key]=g;all.add(g);return g}
 function ell(g,x,y,z,sx,sy,sz,c,a=1){const m=new T.Mesh(new T.SphereGeometry(1,24,16),mat(c,a));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.userData.part=g.name;g.add(m);return m}
 function tube(g,pts,r,c,opacity=1){const curve=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)));const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(32,pts.length*14),r,10,false),mat(c,opacity));m.userData.part=g.name;g.add(m);return m}
 const P=(x,y,z)=>[x,y,z];
 const glom=group("glomerulus");
 ell(glom,-.86,1.02,0,.51,.46,.48,0xe1af91,.15);
 // Multiple coiled glomerular loops, not capillary-resolved segmentation
 for(let i=0;i<7;i++){const points=[];for(let n=0;n<=36;n++){const t=n/36*Math.PI*2,rot=i*.7;points.push(P(-.86+.33*Math.sin(t)*Math.cos(rot)+.035*Math.sin(4*t),1.02+.26*Math.cos(t),.31*Math.sin(t)*Math.sin(rot)+.06*Math.cos(t*3)))}tube(glom,points,.034,0xd46b78)}
 const aff=group("afferent");tube(aff,[P(-2.15,1.48,.20),P(-1.7,1.43,.16),P(-1.35,1.18,.10),P(-1.12,1.03,.06)],.082,0xc85368);
 const eff=group("efferent");tube(eff,[P(-.60,1.23,-.12),P(-.36,1.44,-.28),P(.1,1.43,-.35),P(.36,1.20,-.42)],.068,0xc65b73);
 const proximal=group("proximal");
 tube(proximal,[P(-.45,.92,.12),P(-.03,.89,.24),P(.12,1.12,.28),P(.38,.95,.35),P(.30,.62,.35),P(-.02,.58,.37),P(-.02,.29,.32),P(.39,.22,.31),P(.49,-.16,.30)],.095,0x5bd7bf);
 const desc=group("descending");tube(desc,[P(.49,-.16,.30),P(.48,-.65,.27),P(.38,-1.13,.28),P(.38,-1.66,.29),P(.42,-1.84,.26)],.063,0x62c4d9);
 const asc=group("ascending");tube(asc,[P(.42,-1.84,.26),P(.69,-1.94,.22),P(.94,-1.76,.21),P(.94,-1.14,.19),P(.98,-.52,.14),P(.94,.10,.11)],.068,0x7ca4ec);
 const dist=group("distal");tube(dist,[P(.94,.10,.11),P(1.12,.45,.18),P(.92,.74,.20),P(1.28,.88,.13),P(1.53,.66,.09),P(1.39,.34,.06),P(1.54,.09,.06)],.076,0xe9c178);
 const coll=group("collecting");tube(coll,[P(1.54,.69,.03),P(1.56,.05,.03),P(1.56,-.64,.02),P(1.56,-1.47,.02),P(1.56,-2.10,.02)],.086,0xe8ae74);
 const caps=group("capillaries");
 for(let j=0;j<5;j++){const p=[];for(let n=0;n<=38;n++){const t=n/38*Math.PI*2;p.push(P(-.26+.87*(j/5)+.07*Math.sin(4*t+j),-.55+.65*Math.sin(t),-.39+.07*Math.cos(5*t+j)))}tube(caps,p,.017,0xb95b8e,.91)}
 for(let j=0;j<3;j++)tube(caps,[P(.65+j*.14,.43,-.32),P(.7+j*.16,-.53,-.33),P(.69+j*.16,-1.62,-.32),P(.72+j*.16,-1.89,-.33)],.023,0x5474bd,.9);
 const cortex=group("cortex");ell(cortex,-.05,.99,0,2.22,.73,.88,0x5da9b1,.055);
 const medulla=group("medulla");ell(medulla,.42,-1.05,0,1.50,1.20,.66,0x9589c2,.055);
 for(const id of Object.keys(PARTS)){const b=document.createElement("button");b.type="button";b.dataset.nephron=id;b.textContent=PARTS[id].label;b.addEventListener("click",()=>{current=id;drawState();focus(id)});picker.append(b)}
 const makeLegend=(label,type)=>{const b=document.createElement("button");b.type="button";b.dataset.nephronMode=type;b.textContent=label;b.addEventListener("click",()=>{mode=type;drawState()});$("nephron-modes").append(b)};
 makeLegend("Sang et ultrafiltrat","both");makeLegend("Parcours sanguin","blood");makeLegend("Parcours tubulaire","filtrate");
 $("nephron-isolate").addEventListener("click",()=>{only=!only;drawState()});
 $("nephron-zones").addEventListener("click",()=>{showZones=!showZones;drawState()});
 $("nephron-reset").addEventListener("click",()=>{only=false;mode="both";showZones=true;current="glomerulus";controls.target.set(0,0,0);camera.position.set(4.2,1.9,6.8);drawState()});
 function focus(id){const box=new T.Box3().setFromObject(groups[id]);if(box.isEmpty())return;const center=box.getCenter(new T.Vector3()),size=Math.max(.23,...box.getSize(new T.Vector3()).toArray());controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(size*1.9,size*.7,size*2.5));controls.update()}
 function drawState(){
  const blood=new Set(["afferent","efferent","glomerulus","capillaries"]),filtrate=new Set(["glomerulus","proximal","descending","ascending","distal","collecting"]);
  for(const [id,g]of Object.entries(groups)){
   const isRegion=id==="cortex"||id==="medulla",selected=current===id;
   g.visible=only?selected:isRegion?showZones:mode==="both"||(mode==="blood"?blood.has(id):filtrate.has(id));
   g.traverse(m=>{if(!m.isMesh)return;const material=m.material;const original=m.userData.baseOpacity??(m.userData.baseOpacity=material.opacity);material.opacity=selected?Math.max(.70,original):original;material.transparent=material.opacity<1;material.depthWrite=material.opacity>=1;material.emissive.setHex(selected?0x386d70:0);material.emissiveIntensity=selected?.20:0});
  }
  for(const b of picker.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.nephron===current));
  for(const b of $("nephron-modes").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.nephronMode===mode));
  $("nephron-isolate").setAttribute("aria-pressed",String(only));
  $("nephron-zones").setAttribute("aria-pressed",String(showZones));
  info.textContent=PARTS[current].label+" — "+PARTS[current].note;
 }
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null;
 canvas.addEventListener("pointerdown",e=>down=[e.clientX,e.clientY]);
 canvas.addEventListener("pointerup",e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>8)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const meshes=[];for(const [id,g]of Object.entries(groups))if(g.visible&&id!=="cortex"&&id!=="medulla")g.traverse(m=>{if(m.isMesh)meshes.push(m)});const hits=raycaster.intersectObjects(meshes);if(hits[0]){current=hits[0].object.userData.part;drawState()}});
 function resize(){const r=canvas.getBoundingClientRect();if(r.width<6||r.height<6)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
 const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;ro?.observe(canvas);window.addEventListener("resize",resize);
 if(typeof IntersectionObserver!=="undefined"){const io=new IntersectionObserver(entries=>{active=entries.some(x=>x.isIntersecting)},{rootMargin:"120px"});io.observe(canvas)}
 function render(){requestAnimationFrame(render);if(!active||document.hidden)return;controls.update();renderer.render(scene,camera)}
 drawState();resize();render();status.textContent="Néphron pédagogique 3D : 11 sous-structures ; flux sanguin et trajet tubulaire indiqués par des couleurs, sans calcul de débit ni filtration.";
}
mountNephron();

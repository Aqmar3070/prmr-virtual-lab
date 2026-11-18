/**
 * PRMR-R09 – species-specific volumetric preview geometry.
 *
 * The CPU constructs actual indexed 3-D triangle meshes, vascular and duct tubes
 * with normals, PBR materials, and separate editable organ nodes. They are NOT
 * scans or anatomically accurate segmentations. Only the credited canine GLB,
 * loaded in r09_viewer.mjs, has CT-derived anatomical source geometry.
 */
import * as T from "../vendor/three/build/three.module.js";
import {buildBodySurface} from "./r12_body_surface.mjs";
import {SPECIES_ANATOMY} from "./r09_organ_catalog.mjs";
const PI=Math.PI,TAU=PI*2;
const COL={
 kidneys:["#953e44","#c26866","#762b42"],heart:["#a72839","#dc6570","#5b2538"],
 lungs:["#b86372","#e68c97","#824c6b"],liver:["#793337","#b45a50","#5a2d3d"],
 brain:["#c98992","#edb3af","#a96c78"],digestive:["#bc7373","#eba3a0","#98565a"],
 pancreas:["#d7ab68","#f4d08f","#a66a4d"]
};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rnd=(x,y,z,seed)=>Math.sin(x*13.417+seed*2.7)*Math.cos(y*14.09+z*3.09)+.55*Math.sin(x*25.59-z*37.18+y*8.83+seed);
function mat(hex,roughness=.5,metalness=.02){
 return new T.MeshPhysicalMaterial({color:hex,roughness,metalness,clearcoat:.31,clearcoatRoughness:.32,side:T.DoubleSide});
}
function color3(hex){return new T.Color(hex)}
function sculpt(kind,center,radii,color,seed=1,{fold=.0,notch=0,taper=0,texture=.018}={}){
 const g=new T.SphereGeometry(1,52,32);
 const pos=g.getAttribute("position"),vcolor=[];
 const base=color3(color),secondary=new T.Color("#f0bbb5");
 for(let i=0;i<pos.count;i++){
  let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  let cx=x,cy=y,cz=z;
  const rough=rnd(x,y,z,seed);
  let detail=1+texture*rough;
  if(kind==="kidney"){
   // Hilum notches the medial edge of each kidney; retain a rounded lateral cortex.
   const n=Math.exp(-Math.pow((x+.57)*3.2,2)-Math.pow(y*2.3,2));
   cx=x+notch*n*.52;
   cy=y*(1-.11*n);
   detail*=1+.016*Math.sin((x+z)*23);
  }else if(kind==="heart"){
   const apex=(1-y)/2;
   cx=x*(.92-.43*apex)+.20*y;
   cz=z*(.97-.35*apex);
   cy=y+.14*Math.sin(2.3*x+z);
   detail*=1+.02*Math.sin(8*x+3*z);
  }else if(kind==="lung"){
   cx=x*(.78+.2*y);
   cy=y;
   cz=z*(.85+.10*y);
   detail*=1+.045*Math.sin(6*y+2.2*z);
  }else if(kind==="liver"){
   cy=y*(.57+.25*(1-x*x));
   cx=x*(1.08-.09*y);
   cz=z*(.83+.14*x);
   detail*=1+.04*Math.sin(3.5*x+2*z);
  }else if(kind==="brain"){
   const n=fold*(.022*Math.sin(x*24+y*12+seed)+.017*Math.cos(y*27+z*16)+.012*Math.sin(z*38-x*10));
   detail+=n;
  }else if(kind==="stomach"){
   cx=x+.21*y*y;
   cz=z-.19*x*y;
   detail*=1+.037*Math.cos(x*7+y*9);
  }else if(kind==="cecum"){
   cx=x*(1+.10*Math.sin(y*4));
   detail*=1+.07*Math.cos(y*12+x*4);
  }else if(kind==="pancreas"){
   detail*=1+.09*Math.sin(x*16)*Math.cos(y*12);
  }
  pos.setXYZ(i,center[0]+cx*radii[0]*detail,center[1]+cy*radii[1]*detail,center[2]+cz*radii[2]*detail);
  const paint=base.clone().lerp(secondary,clamp(.11+.06*rough,0,.23));
  vcolor.push(paint.r,paint.g,paint.b);
 }
 g.setAttribute("color",new T.Float32BufferAttribute(vcolor,3));
 g.computeVertexNormals();
 const material=new T.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.52,metalness:0,clearcoat:.32,clearcoatRoughness:.45,side:T.DoubleSide});
 const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={organSurface:kind,synthetic:true};
 return mesh;
}
function path(points,radius,color,segments=34){
 const p=points.map(a=>new T.Vector3(...a)),curve=new T.CatmullRomCurve3(p,false,"catmullrom",.35);
 const mesh=new T.Mesh(new T.TubeGeometry(curve,segments,radius,7,false),mat(color,.42));
 mesh.castShadow=true;return mesh;
}
function group(name){const g=new T.Group();g.name=name;g.userData={organId:name,source:"procedural-anatomical-hypothesis",validation:"not_anatomically_verified"};return g}
function kidney(sp){
 const g=group("kidneys");const a=sp.torso[0]/1.28,b=sp.torso[1]/.60;
 for(const zsgn of [-1,1]){
  const center=[.49*a,.02*b,zsgn*.34];
  g.add(sculpt("kidney",center,[.225*a,.30*b,.18],COL.kidneys[0],zsgn*3,{notch:zsgn<0?1:-1,texture:.025}));
  g.add(sculpt("pancreas",[center[0]-.045,center[1]+.29,center[2]],[.14,.095,.11],"#d8a56f",1,{texture:.08}));
  const pelvis=[center[0]-.14,center[1]-.055,center[2]-zsgn*.13];
  g.add(path([pelvis,[.48,-.36,zsgn*.24],[.84,-.63,zsgn*.12],[1.0,-.69,0]],.024,"#f2c19a",32));
  g.add(path([[.31,.08,0],[.39,.02,zsgn*.12],pelvis],.026,"#a43545",22));
  g.add(path([[.30,-.025,0],[.40,-.09,zsgn*.11],pelvis],.022,"#6481b2",22));
 }
 g.add(sculpt("stomach",[1.02*a,-.71*b,0],[.23,.25,.22],"#b97979",3,{texture:.019}));
 g.add(path([[.26,.72,0],[.29,.34,0],[.27,-.42,0]],.046,"#a52f3b"));
 return g;
}
function heart(sp){
 const g=group("heart"),b=sp.torso[1]/.60;
 g.add(sculpt("heart",[-.56,.12*b,0],[.285,.35,.24],COL.heart[0],2,{texture:.028}));
 g.add(sculpt("heart",[-.65,.36*b,.11],[.16,.16,.13],"#bd5365",6,{texture:.026}));
 g.add(sculpt("heart",[-.40,.39*b,-.09],[.14,.16,.14],"#97414e",4,{texture:.021}));
 const pipelines=[
 [[-.52,.39,.04],[-.62,.64,.05],[-.44,.79,.09],[-.16,.72,.07]],
 [[-.41,.44,-.08],[-.23,.68,-.14],[-.10,.65,-.14]],
 [[-.75,.36,.08],[-.90,.65,.14],[-.93,.74,.18]],
 [[-.51,.54,.04],[-.51,.78,.03],[-.57,.93,.07]]
 ];
 pipelines.forEach((p,i)=>g.add(path(p,i===0?.075:.055,i===1?"#69739e":i===2?"#84516b":"#b63440",30)));
 const vessel=[
 [[-.63,.47,.18],[-.81,.18,.19],[-.73,-.13,.16],[-.55,-.28,.14]],
 [[-.48,.50,.20],[-.34,.23,.22],[-.30,.01,.18],[-.51,-.19,.16]],
 [[-.57,.37,-.20],[-.83,.07,-.18],[-.70,-.16,-.16]]
 ];
 vessel.forEach((p,i)=>g.add(path(p,.012,i===2?"#58739d":"#d04451",22)));
 return g;
}
function lungs(sp){
 const g=group("lungs"),sideCount=[sp.leftLung,sp.rightLung];let index=0;
 for(let side=0;side<2;side++){
  const sign=side===0?-1:1,count=sideCount[side];
  for(let i=0;i<count;i++){
   const u=count===1?0:(i-(count-1)/2)/(count-1);
   const center=[-.73+.12*u,.15+u*.15,sign*(.275+.09*Math.sin(i*.8))];
   const sx=(count===1?.37:.26)*sp.torso[0]/1.28,sy=(count===1?.46:.30)*sp.torso[1]/.60;
   const piece=sculpt("lung",center,[sx,sy,.20],COL.lungs[index%3],index+4,{texture:.027});
   piece.rotation.z=.09*u*g.scale.x;
   g.add(piece);index++;
  }
 }
 g.add(path([[-.92,.86,0],[-.88,.61,0],[-.79,.32,0]],.062,"#deb1a8",20));
 for(let i=0;i<12;i++){
  const y=.42+i*.035;
  g.add(path([[-.89,y,0],[-.80,y+.013,0]],.011,"#e4c0ba",10));
 }
 for(const sign of [-1,1]){
  g.add(path([[-.79,.34,0],[-.72,.22,sign*.13],[-.68,.11,sign*.32]],.041,"#e2b4a8"));
  for(let branch=0;branch<3;branch++){
   const u=branch-1;
   g.add(path([[-.67,.17,sign*.32],[-.64+.10*u,.12+.16*u,sign*.40],[-.61+.15*u,.10+.20*u,sign*.50]],.016,"#c8958e",18));
  }
 }
 return g;
}
function brain(sp){
 const g=group("brain"),smooth=sp.brain==="smooth",r=smooth?.20:.29;
 const [hx,hy,_,ha,hb]=sp.head;
 for(const s of [-1,1]){
  const base=[hx-.08,hy+.30,s*(smooth?.12:.16)];
  const mesh=sculpt("brain",base,[ha*.62,hb*.44,r],COL.brain[s<0?0:1],6+s,{fold:smooth?.10:1,texture:smooth?.012:.017});
  g.add(mesh);
  if(!smooth)for(let i=0;i<7;i++){
   const angle=i*TAU/7;
   g.add(path([[base[0]-.16+Math.cos(angle)*.08,base[1]+Math.sin(angle)*.12,base[2]+s*.20],
    [base[0],base[1]+Math.sin(angle+.8)*.15,base[2]+s*.23],
    [base[0]+.16,base[1]+Math.sin(angle+1.3)*.09,base[2]+s*.17]],.008,"#a46d7a"));
  }
 }
 const c=[hx+.20,hy+.20,0];
 g.add(sculpt("brain",c,[.18,.17,.27],"#c98c8b",5,{fold:.45,texture:.014}));
 for(let i=0;i<9;i++)g.add(path([[c[0]-.14+i*.035,c[1]-.15,c[2]+.18],
  [c[0]-.12+i*.035,c[1],c[2]+.22]],.008,"#ae727d",10));
 g.add(path([[hx+.18,hy+.19,0],[hx+.32,hy-.03,0],[hx+.40,hy-.24,0]],.08,"#e6baac"));
 if(smooth){
  for(const s of [-1,1])g.add(sculpt("brain",[hx-.41,hy+.28,s*.12],[.17,.13,.14],"#d9a2a6",2,{texture:.012}));
 }
 return g;
}
function liver(sp){
 const g=group("liver"),x=sp.torso[0]/1.28;
 const lobes=sp.id==="pig"?5:sp.id==="mouse"||sp.id==="rat"?4:3;
 for(let i=0;i<lobes;i++){
  const z=(i-(lobes-1)/2)*.21;
  const cx=-.20+.08*Math.cos(i*2);
  g.add(sculpt("liver",[cx,-.27,z],[.48*x,.25,.17+(i===1?.07:0)],COL.liver[i%3],7+i,{texture:.018}));
 }
 if(sp.gallbladder){
  g.add(sculpt("stomach",[-.12,-.53,.23],[.11,.16,.082],"#78904b",3,{texture:.017}));
  g.add(path([[-.13,-.45,.22],[-.16,-.35,.13],[-.27,-.38,.07]],.019,"#9aab67"));
 }
 return g;
}
function pancreas(sp){
 const g=group("pancreas");
 g.add(sculpt("pancreas",[.02,-.48,-.26],[.39,.11,.12],COL.pancreas[0],11,{texture:.052}));
 for(let i=0;i<18;i++){
  const x=-.31+i*.035;
  g.add(sculpt("pancreas",[x,-.45+.026*Math.sin(i*.9),-.20+.04*Math.sin(i*.7)],[.045,.042,.04],COL.pancreas[i%3],i+18,{texture:.035}));
 }
 g.add(path([[-.30,-.49,-.26],[.00,-.49,-.23],[.32,-.46,-.29]],.018,"#bba073"));
 return g;
}
function digestive(sp){
 const g=group("digestive");const x=sp.torso[0]/1.28;
 g.add(sculpt("stomach",[-.02,-.41,-.20],[.33*x,.28,.20],COL.digestive[1],13,{texture:.023}));
 g.add(path([[-.02,-.01,-.20],[-.02,-.17,-.20],[-.10,-.24,-.20]],.065,"#b96e76",18));
 // Juxtaposed small intestine loops in the ventral abdomen.
 for(let row=0;row<3;row++){
  const pts=[];
  for(let i=0;i<=40;i++){
   const t=i/40,phase=t*PI*3;
   pts.push([.15+.46*t,-.57-row*.055+.12*Math.sin(phase),
    -.31+row*.29+.12*Math.cos(phase)]);
  }
  g.add(path(pts,.052,COL.digestive[row%3],90));
 }
 if(sp.cecum==="very-large"||sp.cecum==="large"){
  const rad=sp.cecum==="very-large"?.28:.21;
  g.add(sculpt("cecum",[.73,-.67,.36],[rad,.23,.25],COL.digestive[2],24,{texture:.03}));
  g.add(path([[.59,-.58,.35],[.80,-.50,.40],[.96,-.60,.41]],.045,"#d28a86"));
 }else if(sp.cecum==="spiral-colon"){
  const pts=[];
  for(let i=0;i<=75;i++){const t=i/75,ang=t*PI*5.5,r=.29*(1-t*.66);
   pts.push([.44+r*Math.cos(ang),-.59+(.1*t),r*Math.sin(ang)])}
  g.add(path(pts,.052,"#c7837b",120));
 }else{
  g.add(sculpt("cecum",[.68,-.68,.32],[.15,.18,.13],COL.digestive[2],19,{texture:.023}));
 }
 g.add(path([[.65,-.66,-.30],[.86,-.60,-.20],[.95,-.72,0]],.068,"#c07d7c"));
 return g;
}
function body(sp){
 const g=new T.Group();g.name="body-envelope";
 const [a,b,c]=sp.torso,[hx,hy,hz,ha,hb,hc]=sp.head;
 const material=new T.MeshPhysicalMaterial({color:sp.bodyColor,metalness:.03,roughness:.7,transparent:true,opacity:.095,depthWrite:false,side:T.DoubleSide});
 const wireMat=new T.LineBasicMaterial({color:"#8feae7",transparent:true,opacity:.21,depthWrite:false});
 function shell(center,radii,style="torso",rotate=0){
  const geo=new T.SphereGeometry(1,30,20),p=geo.getAttribute("position");
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   const deform=style==="torso"?1+.05*Math.sin(x*3)+.026*Math.cos(y*8):1;
   p.setXYZ(i,center[0]+radii[0]*x*deform,center[1]+radii[1]*y,center[2]+radii[2]*z);
  }
  geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);mesh.rotation.z=rotate;g.add(mesh);
  const lattice=new T.LineSegments(new T.WireframeGeometry(geo),wireMat);lattice.rotation.z=rotate;g.add(lattice);
 }
 shell([0,0,0],[a,b,c]);shell([-.8,.20,0],[.52,b*.75,c*.78],"neck",.12);
 shell([hx,hy,hz],[ha,hb,hc]);
 const snout=sp.id==="pig"?-.38:-.31;
 shell([hx+snout,hy-.16,.03],[sp.id==="pig"?.35:.26,.20,.24]);
 for(const sign of [-1,1]){
  const ear=sp.ear==="long"?.60:sp.ear==="floppy"?.28:.20;
  shell([hx-.08,hy+hb+.13,sign*.26],[.14,ear,.10]);
  for(const x of [-.93,.96]){
   shell([x,-b*.48-sp.legs*.41,sign*c*.74],[.18,sp.legs*.68,.15],"limb",x>0?.09:-.08);
   shell([x-.08,-b*.55-sp.legs,sign*c*.80],[.27,.11,.22]);
  }
 }
 if(sp.tail>.3){
  const pts=[];for(let i=0;i<=25;i++){let t=i/25;pts.push([a*.91+t*sp.tail,.1+.3*Math.sin(t*PI*(sp.id==="pig"?2:1)),.08+.05*Math.sin(t*PI)])}
  const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  g.add(new T.Mesh(new T.TubeGeometry(curve,36,.055,6,false),material));
 }
 g.userData={species:sp.id,validation:"outline illustration not anatomically validated"};return g;
}
export function makeSpeciesGroups(species){
 const config={...(SPECIES_ANATOMY[species]||SPECIES_ANATOMY.dog),id:species};
 const organs={
  kidneys:kidney(config),heart:heart(config),lungs:lungs(config),
  liver:liver(config),brain:brain(config),digestive:digestive(config),pancreas:pancreas(config)
 };
 const centers={};for(const [id,g]of Object.entries(organs)){centers[id]=new T.Box3().setFromObject(g).getCenter(new T.Vector3())}
 return {organs,body:buildBodySurface(config),centers};
}
export function disposeOrganGroup(root){
 root?.traverse(obj=>{
  obj.geometry?.dispose();
  if(obj.material){
   const materials=Array.isArray(obj.material)?obj.material:[obj.material];
   for(const m of materials)m.dispose();
  }
 });
}

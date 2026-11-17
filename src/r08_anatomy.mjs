/**
 * PRMR-R08 — Transparent animal mesh with internal organ systems.
 * Canvas2D 3D projection, no WebGL/GLB, no network, no anatomical calibration.
 * The model is educational: shapes/relative placements are schematics.
 */
export const ORGAN_MODES=Object.freeze({
 kidneys:{label:"Reins",color:"#62eed2"},
 heart:{label:"Cœur",color:"#ff718b"},
 liver:{label:"Foie",color:"#ffbf75"},
 lungs:{label:"Poumons",color:"#92bfff"},
 all:{label:"Tous les organes",color:"#d9c8fc"}
});
export const ANATOMY_SPECIES=Object.freeze({
 mouse:{body:[1.22,.60,.49],head:[-1.02,.25,0,.45,.42,.37],snout:-1.51,leg:.57,ear:.35,tail:1.4},
 rat:{body:[1.35,.56,.49],head:[-1.13,.24,0,.45,.40,.39],snout:-1.60,leg:.61,ear:.26,tail:1.7},
 pig:{body:[1.42,.79,.63],head:[-1.24,.18,0,.62,.57,.53],snout:-1.90,leg:.64,ear:.35,tail:.52},
 dog:{body:[1.37,.62,.51],head:[-1.19,.32,0,.53,.51,.43],snout:-1.74,leg:.92,ear:.46,tail:1.00},
 nhp:{body:[1.07,.71,.56],head:[-1.00,.49,0,.54,.52,.44],snout:-1.53,leg:.78,ear:.22,tail:1.25},
 rabbit:{body:[1.27,.63,.53],head:[-1.08,.28,0,.49,.49,.40],snout:-1.58,leg:.60,ear:.86,tail:.20}
});
const C=Math.PI,T=C*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function makeAnimal(id){
 const s=ANATOMY_SPECIES[id]||ANATOMY_SPECIES.mouse;
 const [bx,by,bz]=s.body,[hx,hy,hz,ha,hb,hc]=s.head;
 const ellipses=[],add=(name,x,y,z,a,b,c,tilt=0)=>ellipses.push({name,x,y,z,a,b,c,tilt});
 add("thorax",.13,0,0,bx,by,bz);
 add("cou",-.78,.12,0,.52,by*.78,bz*.84,.18);
 add("tête",hx,hy,hz,ha,hb,hc);
 add("museau",s.snout,.09,.05,id==="pig"?.35:.33,id==="pig"?.29:.20,.25);
 if(id==="pig")add("groin",s.snout-.29,.05,.09,.09,.18,.27);
 for(const z of [-1,1]){
  let earY=hy+hb+s.ear*.52;
  if(id==="dog")earY=hy+.24;
  add("oreille",hx-.10,earY,z*.28,id==="rabbit"?.14:.20,id==="rabbit"?.70:s.ear*.71,.14,z*.08);
  for(const x of [-.92,.94]){
   const extra=id==="rabbit"&&x>0?.11:0;
   add("membre",x,-by*.42-s.leg*.38,z*bz*.80,.19+extra,s.leg*.67,.15,x>.0?-.06:.06);
   add("patte",x-.08,-by*.58-s.leg*.93,z*bz*.82,.26,.12,.22);
  }
 }
 const tail=[];
 if(id==="rabbit")add("queue",bx+.08,.12,0,.22,.20,.21);
 else for(let i=0;i<=27;i++){
  const u=i/27;
  tail.push([bx*.94+s.tail*u,.21+(id==="dog"?.55:id==="pig"?.22:.28)*Math.sin(C*u*(id==="pig"?2:1)),.05+.18*Math.sin(C*u*1.3)]);
 }
 return {ellipses,tail};
}
export function rotatePoint([x,y,z],yaw,pitch){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const X=cy*x+sy*z,Z=-sy*x+cy*z;
 return [X,cp*y-sp*Z,sp*y+cp*Z];
}
function position(xyz,v){
 const r=rotatePoint(xyz,v.yaw,v.pitch),perspective=4.8/(4.8-r[2]*.20);
 return [v.w/2+r[0]*v.scale*perspective,v.h/2-r[1]*v.scale*perspective,r[2]];
}
function sphere(e,theta,phi){
 const U=Math.sin(phi)*Math.cos(theta),V=Math.cos(phi),W=Math.sin(phi)*Math.sin(theta),a=e.tilt||0;
 return [e.x+e.a*U*Math.cos(a)-e.b*V*Math.sin(a),e.y+e.a*U*Math.sin(a)+e.b*V*Math.cos(a),e.z+e.c*W];
}
function polyline(ctx,arr,stroke,width){
 if(arr.length<2)return;
 ctx.beginPath();ctx.moveTo(arr[0][0],arr[0][1]);
 for(let i=1;i<arr.length;i++)ctx.lineTo(arr[i][0],arr[i][1]);
 ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();
}
function wire(ctx,e,v,near){
 const rgba=near?"rgba(102,241,239,.51)":"rgba(54,157,199,.24)";
 const send=(pts,w)=>{if(pts.length>1)polyline(ctx,pts,rgba,w)};
 for(let ring=1;ring<9;ring++){
  let current=[];
  for(let j=0;j<=24;j++){
   const xyz=sphere(e,T*j/24,C*ring/9);
   if((rotatePoint(xyz,v.yaw,v.pitch)[2]>0)===near)current.push(position(xyz,v));
   else{send(current,near?1.08:.63);current=[]}
  }
  send(current,near?1.08:.63);
 }
 for(let j=0;j<12;j++){
  let current=[];
  for(let k=0;k<=18;k++){
   const xyz=sphere(e,T*j/12,C*k/18);
   if((rotatePoint(xyz,v.yaw,v.pitch)[2]>0)===near)current.push(position(xyz,v));
   else{send(current,near?.94:.62);current=[]}
  }
  send(current,near?.94:.62);
 }
}
const centers={
 kidneys:[[.42,-.17,-.31],[.42,-.17,.31]],
 heart:[[-.49,.15,.0]],
 liver:[[-.05,-.16,.04]],
 lungs:[[-.54,.24,-.22],[-.54,.24,.22]]
};
export function organDefinitions(species="mouse",mode="kidneys"){
 // Anatomical locations and sizes are deliberately not calibrated or measurable.
 const selected=ORGAN_MODES[mode]?mode:"kidneys";
 return Object.entries(centers).flatMap(([kind,pts])=>pts.map(([x,y,z],i)=>({
  kind,x,y,z,selected:selected==="all"||selected===kind,
  color:ORGAN_MODES[kind].color,
  a:kind==="liver"?.43:kind==="kidneys"?.24:kind==="heart"?.23:.22,
  b:kind==="lungs"?.33:kind==="kidneys"?.31:kind==="heart"?.27:.22,
  c:kind==="liver"?.32:kind==="lungs"?.17:.18,
  sign:i===0?-1:1
 })));
}
function organSurface(o,theta,phi){
 let U=Math.sin(phi)*Math.cos(theta),V=Math.cos(phi),W=Math.sin(phi)*Math.sin(theta);
 if(o.kind==="kidneys"){
  const notch=Math.exp(-Math.pow((U+o.sign*.47)*2.2,2)-Math.pow(V*2.4,2));
  U*=1-.2*notch;V*=1-.12*notch;
 }else if(o.kind==="heart"){
  const taper=.59+.35*(V+1)/2;U*=taper;W*=taper;
 }else if(o.kind==="liver"){
  U*=1+.10*V;V*=.86+.12*U;
 }else{
  U*=.83+.16*(1+V)/2;
 }
 return [o.x+U*o.a,o.y+V*o.b,o.z+W*o.c];
}
function rgb(hex,mul,alpha=1){
 const v=[1,3,5].map(i=>clamp(Math.round(parseInt(hex.slice(i,i+2),16)*mul),0,255));
 return "rgba("+v.join(",")+","+alpha+")";
}
function organ(ctx,o,v){
 const faces=[],rows=11,cols=17;
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const a=organSurface(o,T*j/cols,C*i/rows),b=organSurface(o,T*(j+1)/cols,C*i/rows);
  const c=organSurface(o,T*j/cols,C*(i+1)/rows),d=organSurface(o,T*(j+1)/cols,C*(i+1)/rows);
  for(const tri of [[a,b,c],[b,d,c]]){
   const pp=tri.map(q=>position(q,v));
   faces.push({pp,z:(pp[0][2]+pp[1][2]+pp[2][2])/3})
  }
 }
 faces.sort((a,b)=>a.z-b.z);
 ctx.save();ctx.globalAlpha=o.selected?.95:.13;
 for(const f of faces){
  ctx.beginPath();ctx.moveTo(f.pp[0][0],f.pp[0][1]);
  ctx.lineTo(f.pp[1][0],f.pp[1][1]);ctx.lineTo(f.pp[2][0],f.pp[2][1]);ctx.closePath();
  ctx.fillStyle=rgb(o.color,.66+.38*clamp(f.z+.35,0,1));
  ctx.fill();
 }
 ctx.restore();
 // Highlighted organ outline and anatomical grid rings.
 if(o.selected){
  for(let k=1;k<6;k++){
   const pts=[];
   for(let j=0;j<=33;j++)pts.push(position(organSurface(o,T*j/33,C*k/6),v));
   polyline(ctx,pts,rgb(o.color,1.24,.53),.78);
  }
  for(let j=0;j<6;j++){
   const pts=[];
   for(let k=0;k<=25;k++)pts.push(position(organSurface(o,T*j/6,C*k/25),v));
   polyline(ctx,pts,rgb(o.color,1.1,.27),.68);
  }
 }
}
function background(ctx,w,h){
 ctx.fillStyle="#071a2a";ctx.fillRect(0,0,w,h);
 const grad=ctx.createRadialGradient(w*.52,h*.49,8,w*.52,h*.49,w*.68);
 grad.addColorStop(0,"#13546b");grad.addColorStop(.58,"#0b3346");grad.addColorStop(1,"#071a2a");
 ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 const s=Math.max(21,Math.round(w/24));
 ctx.strokeStyle="rgba(85,176,191,.09)";ctx.lineWidth=.7;
 for(let x=0;x<w;x+=s){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
 for(let y=0;y<h;y+=s){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.font="600 10px system-ui";ctx.fillStyle="rgba(187,233,234,.73)";
 ctx.fillText("PRMR · ATLAS ANATOMIQUE SCHÉMATIQUE",12,17);
}
function labels(ctx,v,mode){
 const active=mode==="all"?["kidneys","heart","liver","lungs"]:[mode];
 active.forEach((id,i)=>{
  const pts=centers[id];if(!pts)return;
  const anchor=position(pts[pts.length-1],v),x=clamp(anchor[0]+(anchor[0]<v.w*.5?65:-65),62,v.w-62);
  const y=clamp(anchor[1]+(mode==="all"?(i-1.5)*18:0),40,v.h-32);
  ctx.save();
  ctx.strokeStyle=rgb(ORGAN_MODES[id].color,1,.76);
  ctx.setLineDash([3,4]);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(anchor[0],anchor[1]);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=ORGAN_MODES[id].color;ctx.beginPath();ctx.arc(anchor[0],anchor[1],3,0,T);ctx.fill();
  const label=ORGAN_MODES[id].label,w=Math.max(62,Math.min(105,label.length*7.1+18)),left=clamp(x-w/2,4,v.w-w-4);
  ctx.fillStyle="rgba(6,31,46,.92)";ctx.strokeStyle=rgb(ORGAN_MODES[id].color,.91,.8);
  ctx.beginPath();if(typeof ctx.roundRect==="function")ctx.roundRect(left,y-12,w,23,7);else ctx.rect(left,y-12,w,23);ctx.fill();ctx.stroke();
  ctx.fillStyle="#f2ffff";ctx.font="600 11px system-ui";ctx.textAlign="center";
  ctx.fillText(label,left+w/2,y+3);ctx.restore();
 });
}
function renderScene(ctx,v,species,mode){
 background(ctx,v.w,v.h);
 const body=makeAnimal(species),organs=organDefinitions(species,mode);
 // Rear body lattice, organs, then front body lattice, never an opaque shell.
 for(const e of body.ellipses)wire(ctx,e,v,false);
 if(body.tail.length)polyline(ctx,body.tail.map(p=>position(p,v)),"rgba(105,234,236,.41)",1.5);
 for(const o of organs.filter(x=>!x.selected))organ(ctx,o,v);
 for(const o of organs.filter(x=>x.selected))organ(ctx,o,v);
 // Ureter paths, purely schematic, emphasize continuity.
 if(mode==="kidneys"||mode==="all"){
  for(const z of [-.31,.31]){
   polyline(ctx,[[.42,-.37,z],[.25,-.56,z*.75],[.04,-.79,0]].map(p=>position(p,v)),"rgba(255,191,126,.55)",1.35);
  }
 }
 for(const e of body.ellipses)wire(ctx,e,v,true);
 labels(ctx,v,mode);
 ctx.font="10px system-ui";ctx.textAlign="left";ctx.fillStyle="#a9cfda";
 ctx.fillText("Proportions et placements indicatifs · non issus d’imagerie",12,v.h-10);
}
/** Always-available rendering: Canvas2D instead of costly WebGL/glTF pipeline. */
export function createAnatomyViewer(canvas,{species="mouse",organ="kidneys",onRender}={}){
 const unsupported={supported:false,set(){},setOrgan(){},destroy(){},get mode(){return "unavailable"}};
 let ctx;try{ctx=canvas?.getContext("2d",{alpha:false})}catch{return unsupported}
 if(!ctx)return unsupported;
 let current=ANATOMY_SPECIES[species]?species:"mouse",focus=ORGAN_MODES[organ]?organ:"kidneys";
 let yaw=-.22,pitch=.10,zoom=1,raf=0,rendered=0,alive=true,pressed=false,px=0,py=0;
 const draw=()=>{
  raf=0;if(!alive)return;
  const box=canvas.getBoundingClientRect();
  const w=Math.max(5,Math.round(box.width)),h=Math.max(5,Math.round(box.height));
  const dpr=clamp(window.devicePixelRatio||1,1,2),W=Math.ceil(w*dpr),H=Math.ceil(h*dpr);
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  renderScene(ctx,{w,h,yaw,pitch,zoom,scale:Math.min(w/5.55,h/3.55)*zoom},current,focus);
  rendered++;
  canvas.dataset.anatomyRender=String(rendered);
  canvas.dataset.anatomySpecies=current;canvas.dataset.anatomyOrgan=focus;
  onRender?.({species:current,organ:focus,count:rendered});
 };
 const request=()=>{if(alive&&!raf)raf=requestAnimationFrame(draw)};
 const down=e=>{pressed=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture?.(e.pointerId)};
 const move=e=>{if(!pressed)return;yaw+=(e.clientX-px)*.009;pitch=clamp(pitch+(e.clientY-py)*.008,-.9,.9);px=e.clientX;py=e.clientY;request()};
 const up=e=>{pressed=false;try{canvas.releasePointerCapture?.(e.pointerId)}catch{}};
 const wheel=e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY<0?1.08:.92),.64,1.6);request()};
 const reset=()=>{yaw=-.22;pitch=.10;zoom=1;request()};
 const keyboard=e=>{
  let done=true;
  if(e.key==="ArrowLeft")yaw-=.13;else if(e.key==="ArrowRight")yaw+=.13;
  else if(e.key==="ArrowUp")pitch=clamp(pitch+.12,-.9,.9);
  else if(e.key==="ArrowDown")pitch=clamp(pitch-.12,-.9,.9);
  else if(e.key==="+"||e.key==="=")zoom=clamp(zoom*1.1,.64,1.6);
  else if(e.key==="-")zoom=clamp(zoom/1.1,.64,1.6);
  else if(e.key==="Home")reset();
  else done=false;
  if(done){e.preventDefault();request()}
 };
 canvas.tabIndex=0;canvas.style.touchAction="none";
 for(const [event,cb] of [["pointerdown",down],["pointermove",move],["pointerup",up],
 ["pointercancel",up],["wheel",wheel],["dblclick",reset],["keydown",keyboard]]){
  canvas.addEventListener(event,cb,event==="wheel"?{passive:false}:undefined)
 }
 const resized=()=>request();
 let observer=null;
 if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(resized);observer.observe(canvas)}
 else window.addEventListener("resize",resized);
 request();
 return {supported:true,
  set(p){let changed=false;
   if(p.species&&ANATOMY_SPECIES[p.species]&&p.species!==current){current=p.species;changed=true}
   if(p.organ&&ORGAN_MODES[p.organ]&&p.organ!==focus){focus=p.organ;changed=true}
   if(changed)request()
  },
  setOrgan(id){if(ORGAN_MODES[id]){focus=id;request()}},
  get mode(){return focus},
  destroy(){alive=false;cancelAnimationFrame(raf);observer?.disconnect();
   if(!observer)window.removeEventListener("resize",resized);
   for(const [event,cb] of [["pointerdown",down],["pointermove",move],["pointerup",up],["pointercancel",up],
    ["wheel",wheel],["dblclick",reset],["keydown",keyboard]])canvas.removeEventListener(event,cb);
  }
 };
}

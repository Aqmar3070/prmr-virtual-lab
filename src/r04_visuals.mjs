// PRMR R04 native Canvas 3D: mouse/touch rotation. No external 3D runtime.
// Molecules use true RDKit/ETKDG/MMFF conformer coordinates, not PK measurements.
// Anatomical scenes are conceptual geometries, not volumetric clinical imaging.
const PALETTE={C:"#a8c3d2",O:"#ff7e85",N:"#72aaff",Cl:"#76dc95",S:"#f8cd76",P:"#ebc87a",H:"#eff9ff"};
function rx(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]}
function ry(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0]*c+v[2]*s,v[1],v[2]*c-v[0]*s]}
function lightBall(ctx,x,y,r,col,shadow=10){
 const g=ctx.createRadialGradient(x-r*.38,y-r*.52,1,x,y,r*1.2);
 g.addColorStop(0,"#ffffff");g.addColorStop(.10,col);g.addColorStop(.65,col);g.addColorStop(1,"#111d34");
 ctx.beginPath();ctx.fillStyle=g;ctx.shadowBlur=shadow;ctx.shadowColor=col;ctx.arc(x,y,Math.max(1,r),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
}
function project(v,w,h,scale,ax,ay){
 const a=ry(rx(v,ax),ay),f=5/(5+a[2]/7);
 return {x:w/2+a[0]*scale*f,y:h/2-a[1]*scale*f,z:a[2],f};
}
function ellipsoid(cx,cy,cz,sx,sy,sz,col,degree=10){
 const result=[];
 for(let i=0;i<=degree;i++)for(let j=0;j<degree*2;j++){
  const u=Math.PI*i/degree,t=2*Math.PI*j/(degree*2);
  result.push({p:[cx+sx*Math.sin(u)*Math.cos(t),cy+sy*Math.cos(u),cz+sz*Math.sin(u)*Math.sin(t)],c:col,r:0.08});
 }
 return result;
}
function kindney(){
 // Educational conceptual mesh; interior/rim are symbolic.
 const nodes=[],edges=[];
 for(let a=0;a<17;a++)for(let b=0;b<30;b++){
  const u=(a+.4)*Math.PI/17,th=b*2*Math.PI/30;
  const v=Math.sin(u);
  const x=1.15*v*Math.cos(th)+.25*Math.cos(u)+.3*Math.sin(u)**2;
  const y=1.7*Math.cos(u),z=.63*v*Math.sin(th);
  const concavity=(x>0&&Math.abs(y)<.65)?0.23*(1-Math.abs(y)/.7):0;
  nodes.push({p:[x-concavity,y,z],c:b%9===0?"#ff978d":"#b25c8e",r:.044});
 }
 // coloured nephron pathways, nonphysiologic depiction
 for(let i=0;i<11;i++){
  const t=i*2*Math.PI/11;
  const prev=nodes.length;
  for(let j=0;j<24;j++){
   const q=j/23;
   nodes.push({p:[.1+(1-q)*Math.cos(t)*.85,-.95+q*1.9,(1-q)*Math.sin(t)*.47],c:i%2?"#6fe2ed":"#ffbc83",r:.07});
   if(j>0)edges.push([prev+j-1,prev+j,1]);
  }
 }
 return {atoms:nodes,bonds:edges,kind:"organ"};
}
function body(species,renal,hepatic){
 // Species-specific procedural 3D educational sculpture, NOT anatomical reconstruction.
 const kidneyColour=renal==="severe"?"#ff687b":renal==="moderate"?"#ffc17b":"#66f7da";
 const liverColour=hepatic==="severe"?"#f15e76":hepatic==="moderate"?"#f4b471":"#cd8cb4";
 const coat={mouse:"#b2d9d9",rat:"#a7bcc7",pig:"#d9a4ab",dog:"#cba778",nhp:"#947d75",rabbit:"#e4ced0"}[species]||"#9dc0c9";
 const details={mouse:"#8ec5c7",rat:"#7996a3",pig:"#e7b3b9",dog:"#8b7053",nhp:"#6c5655",rabbit:"#d7b7bb"}[species]||"#6ac4cc";
 const atoms=[],bonds=[];
 const add=(x,y,z,sx,sy,sz,colour,res=7)=>atoms.push(...ellipsoid(x,y,z,sx,sy,sz,colour,res));
 const wire=(p,q,steps,color,r=.045)=>{
  const first=atoms.length;
  for(let i=0;i<=steps;i++){
   const t=i/steps;atoms.push({p:[p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1]),p[2]+t*(q[2]-p[2])],c:color,r});
   if(i)bonds.push([first+i-1,first+i,1])
  }
 };
 const config={
 mouse:{body:[1.38,.62,.53],head:[-.99,.23,.02,.53,.49,.46],nose:-1.48,legs:.72,ear:.42,tail:1.8},
 rat:{body:[1.58,.55,.51],head:[-1.15,.26,0,.53,.42,.43],nose:-1.73,legs:.75,ear:.25,tail:2.1},
 pig:{body:[1.86,.84,.76],head:[-1.55,.21,0,.76,.72,.68],nose:-2.27,legs:.84,ear:.38,tail:.65},
 dog:{body:[1.74,.69,.56],head:[-1.47,.48,0,.62,.65,.49],nose:-2.18,legs:1.14,ear:.48,tail:1.08},
 nhp:{body:[1.18,.78,.61],head:[-1.2,.71,0,.64,.68,.53],nose:-1.7,legs:1.16,ear:.2,tail:1.6},
 rabbit:{body:[1.53,.66,.56],head:[-1.23,.36,0,.54,.55,.46],nose:-1.73,legs:.72,ear:.87,tail:.20}
 }[species]||{body:[1.5,.7,.6],head:[-1,.3,0,.6,.6,.5],nose:-1.7,legs:1,ear:.3,tail:.6};
 add(0,0,0,config.body[0],config.body[1],config.body[2],coat,9);
 const h=config.head;add(...h,details,8);
 // Frontal muzzle and ears, which make each species identifiable in silhouette.
 add(config.nose,.08,.14,species==="pig"?.45:.27,species==="pig"?.30:.20,.28,details,7);
 if(species==="pig")add(config.nose-.25,.10,.14,.1,.2,.34,"#f0a6b1",7);
 if(species==="dog")add(-1.76,.02,.25,.42,.28,.28,"#ede4d0",7);
 if(species==="nhp")add(-1.7,.54,.22,.32,.29,.32,"#bb9b8c",7);
 // Ear pair: long on rabbit, round on mouse/rat, drooping on dog.
 const ears=(species==="rabbit"||species==="dog")?[
  [h[0]-.12,h[1]+h[4]+config.ear*.5,.28,.17,config.ear,.18],
  [h[0]+.18,h[1]+h[4]+config.ear*.45,-.25,.15,config.ear*.83,.17]]:
  [[h[0]-.11,h[1]+h[4]+.2,.28,.23,config.ear,.19],
   [h[0]+.25,h[1]+h[4]+.1,-.28,.22,config.ear,.20]];
 ears.forEach(e=>add(...e,species==="pig"?"#e7b2b7":details,7));
 // Four articulated limbs, species-dependent stride. NHP arms are longer.
 const footY=-config.body[1]-config.legs*.8;
 for(const x of [-1.0,1.1])for(const z of [-.36,.36]){
  const limbStart=[x,-.35,z],limbEnd=[x+(x<0?-.12:.12),footY,z];
  add(limbStart[0],(limbStart[1]+limbEnd[1])/2,z,.19,Math.abs(limbStart[1]-limbEnd[1])*.57,.18,details,6);
  add(limbEnd[0],footY-.02,z+.12,.28,.14,.19,details,6);
 }
 // Distinctive curled pig tail, long thin rodent tail, short rabbit tail.
 const tailStart=[config.body[0]*.94,.20,-.08],base=atoms.length;
 if(species==="rabbit")add(config.body[0]+.10,.15,-.1,.28,.28,.27,"#f2e3e4",8);
 else{
  const steps=27;
  for(let j=0;j<=steps;j++){
   const t=j/steps;
   const x=tailStart[0]+config.tail*t;
   const y=species==="pig"?.21+.25*Math.sin(3.2*Math.PI*t):species==="dog"?.2+.74*Math.sin(Math.PI*t):.2+.26*Math.sin(1.4*Math.PI*t);
   const z=-.08+.20*Math.sin(2*Math.PI*t);
   atoms.push({p:[x,y,z],c:details,r:species==="pig"?.07:.045});
   if(j)bonds.push([base+j-1,base+j,1]);
  }
 }
 // Physiology concept overlay. Positions are illustrative and NOT actual organ mapping.
 add(.40,.00,config.body[2]+.11,.43,.29,.23,liverColour,7);
 add(.94,-.12,config.body[2]+.17,.26,.28,.2,kidneyColour,7);
 add(.89,-.20,-config.body[2]-.03,.22,.30,.17,kidneyColour,6);
 add(h[0]-.30,h[1]+.10,h[5]+.18,.085,.085,.085,"#102430",6);
 wire([-.12,-.15,config.body[2]+.05],[1.27,-.02,config.body[2]+.02],22,"#78ece3",.028);
 return {atoms,bonds,kind:"animal"};
}
export function create3D(canvas,{kind="kidney",model=null,species="mouse",renal="normal",hepatic="normal"}={}){
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("Canvas 2D indisponible");
 let current={kind,model,species,renal,hepatic},yaw=.25,pitch=-.18,dragging=false,lastX=0,lastY=0,raf=0,enabled=true,lastFrame=0,geometryCache=null;
 function paint(now=0){
  if(!enabled)return;
  raf=requestAnimationFrame(paint);
  if(now && now-lastFrame<38)return;
  lastFrame=now;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.clearRect(0,0,w,h);
  const grad=ctx.createRadialGradient(w*.5,h*.52,0,w*.5,h*.5,w*.67);
  grad.addColorStop(0,"#1b4960");grad.addColorStop(.60,"#102839");grad.addColorStop(1,"#091722");
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  // static science-grid backdrop
  ctx.lineWidth=dpr*.6;ctx.strokeStyle="#31798b1f";
  for(let i=0;i<12;i++){let y=h*i/12;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const content=geometryCache||(geometryCache=current.kind==="molecule"&&current.model?
   {atoms:current.model.a.map((c,i)=>({p:current.model.p[i],c:PALETTE[c]||"#cfe7e0",r:c==="Cl"?.29:c==="O"?.22:.19})),bonds:current.model.b,kind:"molecule"}:
   current.kind==="animal"?body(current.species,current.renal,current.hepatic):kindney());
  const values=content.atoms.map(x=>x.p),xs=values.map(v=>v[0]),ys=values.map(v=>v[1]);
  const extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),.6);
  const center=[(Math.max(...xs)+Math.min(...xs))/2,(Math.max(...ys)+Math.min(...ys))/2,0];
  const scale=Math.min(w*.72,h*.73)/extent;
  const points=content.atoms.map(a=>({...project([a.p[0]-center[0],a.p[1]-center[1],a.p[2]],w,h,scale,pitch,yaw),r:a.r*scale,c:a.c}));
  ctx.lineCap="round";
  for(const b of content.bonds){const [i,j,order]=b,p=points[i],q=points[j];if(!p||!q)continue;
   ctx.strokeStyle="#d2e4f0aa";ctx.lineWidth=Math.max(1,(content.kind==="molecule"?4:2)*dpr);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   if(order>1&&content.kind==="molecule"){ctx.lineWidth=1.4*dpr;ctx.strokeStyle="#66e0d5";ctx.beginPath();ctx.moveTo(p.x+3*dpr,p.y);ctx.lineTo(q.x+3*dpr,q.y);ctx.stroke()}
  }
  const list=points.map((p,i)=>({...p,i})).sort((a,b)=>a.z-b.z);
  for(const a of list){
   const r=Math.min(content.kind==="molecule"?16*dpr:14*dpr,Math.max(content.kind==="molecule"?3*dpr:1.7*dpr,a.r*(content.kind==="molecule"?1:.65)));
   lightBall(ctx,a.x,a.y,r,a.c,content.kind==="molecule"?5*dpr:2*dpr);
  }
  if(!dragging){yaw+=.0045}
 }
 const down=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)};
 const move=e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.008;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-lastY)*.008));lastX=e.clientX;lastY=e.clientY};
 const up=e=>{dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);
 canvas.addEventListener("pointercancel",up);canvas.style.touchAction="none";
 document.addEventListener("visibilitychange",()=>{if(document.hidden){enabled=false;cancelAnimationFrame(raf)}else if(!enabled){enabled=true;paint()}});
 paint();
 return {set(next){current={...current,...next};geometryCache=null},reset(){yaw=.25;pitch=-.18},destroy(){enabled=false;cancelAnimationFrame(raf);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up)}};
}

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
 const renalColor=renal==="severe"?"#ff7180":renal==="moderate"?"#ffb16b":"#83e4cc";
 const liverColor=hepatic==="severe"?"#fb6c80":hepatic==="moderate"?"#ffbe82":"#dd879a";
 const atoms=[],bonds=[];
 const add=(arr)=>atoms.push(...arr);
 // Simple horizontal anatomical conceptual silhouette; not anatomical geometry.
 add(ellipsoid(0,0,0,2.0,.77,.58,"#305d75",11));
 add(ellipsoid(-1.7,.2,.05,.68,.64,.57,"#3e8099",9));
 add(ellipsoid(-2.1,.78,.11,.31,.5,.22,"#5bbac2",7));
 add(ellipsoid(0.4,-.08,.28,.62,.27,.24,liverColor,8));
 add(ellipsoid(1.05,-.05,.40,.32,.43,.29,renalColor,8));
 add(ellipsoid(.7,-.2,-.38,.27,.32,.25,renalColor,8));
 // longer muzzle for dog or pig, shorter for primates
 if(species==="dog"||species==="pig")add(ellipsoid(-2.35,-.02,.05,.45,.27,.33,"#4b95aa",7));
 if(species==="rabbit")add(ellipsoid(-1.8,1.03,.27,.18,.74,.16,"#51b0b4",7));
 const prev=atoms.length;
 for(let i=0;i<35;i++){const x=-1.8+i*3.9/34;atoms.push({p:[x,.02,.66],c:"#78d2dd",r:.035});if(i)bondssafe(prev+i-1,prev+i)}
 function bondssafe(a,b){bonds.push([a,b,1])}
 return {atoms,bonds,kind:"animal"};
}
export function create3D(canvas,{kind="kidney",model=null,species="mouse",renal="normal",hepatic="normal"}={}){
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("Canvas 2D indisponible");
 let current={kind,model,species,renal,hepatic},yaw=.25,pitch=-.18,dragging=false,lastX=0,lastY=0,raf=0,enabled=true;
 function paint(){
  if(!enabled)return;
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
  const content=current.kind==="molecule"&&current.model?
   {atoms:current.model.a.map((c,i)=>({p:current.model.p[i],c:PALETTE[c]||"#cfe7e0",r:c==="Cl"?.29:c==="O"?.22:.19})),bonds:current.model.b,kind:"molecule"}:
   current.kind==="animal"?body(current.species,current.renal,current.hepatic):kindney();
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
  if(!dragging){yaw+=.0017}
  raf=requestAnimationFrame(paint);
 }
 const down=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)};
 const move=e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.008;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-lastY)*.008));lastX=e.clientX;lastY=e.clientY};
 const up=e=>{dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);
 canvas.addEventListener("pointercancel",up);canvas.style.touchAction="none";
 document.addEventListener("visibilitychange",()=>{if(document.hidden){enabled=false;cancelAnimationFrame(raf)}else if(!enabled){enabled=true;paint()}});
 paint();
 return {set(next){current={...current,...next}},reset(){yaw=.25;pitch=-.18},destroy(){enabled=false;cancelAnimationFrame(raf);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up)}};
}

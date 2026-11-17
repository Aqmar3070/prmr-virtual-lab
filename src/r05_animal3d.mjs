// PRMR-R05 : illustrations 3D artistiques WebGL. Ce ne sont PAS des reconstructions anatomiques.
const colors={mouse:["#e5edeb","#a8c0c8","#efaeb8"],rat:["#afa596","#786d66","#c79195"],pig:["#e8aab1","#c17c91","#efb5be"],dog:["#d8b07e","#76533f","#f2e4d6"],nhp:["#ad907e","#665653","#cba58f"],rabbit:["#f1f3f2","#bbc9ce","#edb3c1"]};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
function shapes(species){
 const col=colors[species]||colors.mouse,body=col[0],dark=col[1],skin=col[2];
 const s=[];
 const add=(x,y,z,a,b,c,color)=>s.push({x,y,z,a,b,c,col:rgb(color),
  material:color===col[2]?2:(["#102127","#1c2326"].includes(color)?3:(color==="#f8ffff"||color==="#ffffff"?4:color===col[1]?1:0))});
 const put=(arr,color)=>{for(const [x,y,z,a,b,c] of arr)add(x,y,z,a,b,c,color)};
 const p={mouse:[1.2,.63,.56],rat:[1.46,.63,.58],pig:[1.46,.84,.76],dog:[1.51,.68,.55],nhp:[1.13,.8,.64],rabbit:[1.22,.67,.57]}[species];
 add(.12,-.06,0,...p,body);
 add(.10,.20,.13,p[0]*.76,p[1]*.55,p[2]*.73,col[0]);
 const leg=species==="dog"?.79:species==="nhp"?.81:species==="pig"?.58:.53;
 for(const x of [-.68,1.02])for(const z of [-.39,.39]){
  add(x,-.70,z,.19,leg,.19,dark);add(x-.09,-1.25,z+.07,.28,.14,.25,body)
 }
 const hx=species==="pig"?-1.25:species==="dog"?-1.23:species==="nhp"?-1.02:-1.10;
 const hy=species==="nhp"?.58:species==="rabbit"?.33:.20;
 const h=species==="pig"?[.63,.62,.59]:[.52,.52,.49];
 add(hx,hy,0,...h,body);add(hx-.16,hy+.13,.18,h[0]*.70,h[1]*.71,h[2]*.78,col[0]);
 if(["mouse","rat"].includes(species)){
  put([[hx-.09,hy+.53,.30,.25,.30,.11],[hx+.29,hy+.54,-.24,.25,.28,.10]],skin);
  put([[hx-.60,hy-.14,.08,.40,.19,.27]],body);
  add(hx-.91,hy-.19,.13,.12,.10,.10,skin);
  for(let i=0;i<22;i++){const t=i/21;add(1.15+1.3*t,-.05+.29*Math.sin(4*t),.1+t*.14,.073*(1-.6*t),.07*(1-.6*t),.069*(1-.6*t),skin)}
 }else if(species==="pig"){
  add(hx-.58,hy-.1,.05,.48,.28,.37,skin);add(hx-.94,hy-.08,.15,.13,.22,.37,skin);
  put([[hx-.99,hy-.03,.40,.037,.06,.036],[hx-.99,hy-.03,-.13,.037,.06,.036]],dark);
  put([[hx-.25,hy+.61,.33,.2,.37,.11],[hx+.25,hy+.56,-.24,.18,.36,.11]],skin);
  for(let i=0;i<14;i++){const t=i/13;add(1.52+.55*t,.03+.22*Math.sin(2*Math.PI*t),.10,.07,.07,.07,skin)}
 }else if(species==="dog"){
  add(hx-.55,hy-.21,.12,.39,.22,.31,col[2]);add(hx-.90,hy-.21,.13,.13,.12,.15,"#1c2326");
  put([[hx+.16,hy-.05,.50,.26,.43,.11],[hx+.15,hy-.04,-.48,.26,.41,.11]],dark);
  add(-.56,-.13,.47,.33,.47,.21,col[2]);
  for(let i=0;i<13;i++){const t=i/12;add(1.36+.77*t,-.05+.69*t,.04,.12*(1-.6*t),.11*(1-.6*t),.09*(1-.6*t),dark)}
 }else if(species==="rabbit"){
  put([[hx-.21,hy+.92,.32,.18,.79,.12],[hx+.25,hy+.93,-.18,.18,.76,.12]],body);
  put([[hx-.20,hy+.95,.43,.10,.61,.045],[hx+.25,hy+.95,-.08,.10,.57,.05]],skin);
  add(hx-.48,hy-.17,.13,.33,.25,.30,col[0]);add(hx-.82,hy-.23,.21,.09,.07,.09,skin);
  add(1.38,-.08,-.07,.25,.25,.24,col[0]);add(.83,-1.20,.51,.39,.17,.30,body)
 }else if(species==="nhp"){
  add(hx-.14,hy-.10,.3,.47,.46,.30,skin);
  add(hx-.11,hy+.13,.49,.33,.25,.16,skin);
  add(-.45,-.65,.60,.18,.62,.17,dark);add(-.47,-1.18,.62,.24,.12,.22,skin);
  for(let i=0;i<17;i++){const t=i/16;add(1.06+1.08*t,-.17+.46*Math.sin(t*Math.PI),-.16+.38*Math.sin(t*2*Math.PI),.080*(1-.40*t),.08*(1-.40*t),.07*(1-.40*t),dark)}
 }
 // Paired glossy eyes, with highlights, on forward profile.
 const eyeX=species==="nhp"?hx-.22:hx-.29,ey=hy+.17,ez=species==="pig"?.57:.50;
 add(eyeX,ey,ez,.085,.093,.06,"#102127");
 add(eyeX-.024,ey+.027,ez+.054,.027,.026,.019,"#f8ffff");
 if(species==="nhp"){
  add(hx+.10,ey,.50,.087,.09,.06,"#102127");
  add(hx+.077,ey+.030,.557,.025,.024,.02,"#ffffff");
 }
 return s;
}
// Higher tessellation improves natural curvature. Vertex normals are ellipsoid-correct.
function geometry(parts){
 const data=[],rows=20,cols=28;
 const p=(o,i,j)=>{
  const a=i*Math.PI/rows,t=2*j*Math.PI/cols;
  const u=Math.sin(a)*Math.cos(t),v=Math.cos(a),w=Math.sin(a)*Math.sin(t);
  const N=[u/o.a,v/o.b,w/o.c],len=Math.hypot(...N)||1;
  return [o.x+u*o.a,o.y+v*o.b,o.z+w*o.c,N[0]/len,N[1]/len,N[2]/len,...o.col,o.material];
 };
 for(const o of parts)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const a=p(o,i,j),b=p(o,i+1,j),c=p(o,i,j+1),d=p(o,i+1,j+1);
  data.push(...a,...b,...c,...c,...b,...d)
 }
 return new Float32Array(data);
}
// Studio material shading: soft diffuse + subtle subsurface scatter + 3D coat microstructure.
// No reference photos or scientific anatomy are claimed.
const vert=[
"attribute vec3 aPos; attribute vec3 aNormal; attribute vec3 aColor; attribute float aMaterial;",
"uniform float uYaw,uPitch,uZoom;uniform vec2 uAspect;",
"varying vec3 vNormal,vColor,vPosition;varying float vMaterial;",
"void main(){float c=cos(uYaw),s=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);",
"mat3 Y=mat3(c,0.,-s,0.,1.,0.,s,0.,c);mat3 X=mat3(1.,0.,0.,0.,cp,sp,0.,-sp,cp);",
"vec3 p=X*Y*aPos;vNormal=normalize(X*Y*aNormal);vPosition=p;vColor=aColor;vMaterial=aMaterial;",
"gl_Position=vec4(p.x/(3.5*uAspect.x*uZoom),(p.y+.05)/(2.7*uAspect.y*uZoom),-p.z/11.,1.);}"
].join("\n");
const frag=[
"precision mediump float;varying vec3 vNormal,vColor,vPosition;varying float vMaterial;",
"float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}",
"float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
"return mix(mix(mix(hash(i),hash(i+vec3(1.,0.,0.)),f.x),mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),",
"mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}",
"void main(){vec3 N=normalize(vNormal),V=vec3(0.,0.,1.);",
"vec3 key=normalize(vec3(-.62,.92,1.48)),fill=normalize(vec3(.75,.18,.73));",
"float n=noise3(vPosition*40.),n2=noise3(vPosition*14.);",
"float fur=1.-step(1.5,vMaterial);float skin=step(1.5,vMaterial)*(1.-step(2.5,vMaterial));",
"float eyes=step(2.5,vMaterial);",
"vec3 micro=vec3(n-.5,n2-.5,n-.5);N=normalize(N+micro*(.039*fur+.012*skin));",
"float kd=max(dot(N,key),0.),fd=max(dot(N,fill),0.);",
"float ambient=.44+.10*clamp(N.y*.5+.5,0.,1.);",
"float rim=pow(1.-max(dot(N,V),0.),2.)*(.19+.05*skin);",
"float rough=(.28+fur*.48+skin*.15),specPower=mix(56.,12.,rough);",
"float spec=pow(max(dot(reflect(-key,N),V),0.),specPower);",
"float coat=(n-.5)*.15*fur+(n2-.5)*.058*skin;",
"vec3 c=vColor*(ambient+.66*kd+.23*fd+coat);",
"c+=vec3(.12,.26,.28)*rim;",
"c+=vec3(.34,.33,.28)*spec*(.24+skin*.18+eyes*.5);",
"c+=vColor*max(dot(-N,key),0.)*.055*skin;",
"gl_FragColor=vec4(clamp(c,0.,1.),1.);}"
].join("\n");
function shader(gl,type,source){
 const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
 return sh;
}
export function createAnimalSculpture(canvas,{species="mouse"}={}){
 const unsupported={supported:false,set(){},destroy(){}};
 let gl;try{gl=canvas?.getContext("webgl",{alpha:true,antialias:true,depth:true})}catch{return unsupported}
 if(!gl)return unsupported;
 let prog,buf;
 try{
  prog=gl.createProgram();gl.attachShader(prog,shader(gl,gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl,gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));buf=gl.createBuffer()
 }catch{return unsupported}
 let vertices=0,yaw=-.12,pitch=-.06,zoom=1,down=false,xx=0,yy=0,raf=0,active=true,inView=true,last=0;
 const upload=id=>{if(!colors[id])return;const v=geometry(shapes(id));vertices=v.length/10;gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STATIC_DRAW)};
 upload(species);
 function paint(ms=0){
  if(!active)return;
  raf=requestAnimationFrame(paint);if(ms-last<34)return;last=ms;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(w<4||h<4)return;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  for(const [name,off,len] of [["aPos",0,3],["aNormal",3,3],["aColor",6,3],["aMaterial",9,1]]){
   const loc=gl.getAttribLocation(prog,name);if(loc<0)continue;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,len,gl.FLOAT,false,40,off*4)
  }
  let aspect=w/h;
  gl.uniform2f(gl.getUniformLocation(prog,"uAspect"),Math.max(1,aspect/1.55),Math.max(1,1.55/aspect));
  gl.uniform1f(gl.getUniformLocation(prog,"uYaw"),yaw);
  gl.uniform1f(gl.getUniformLocation(prog,"uPitch"),pitch);
  gl.uniform1f(gl.getUniformLocation(prog,"uZoom"),zoom);
  gl.drawArrays(gl.TRIANGLES,0,vertices);
  if(!down)yaw+=.0022;
 }
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const pointerDown=e=>{down=true;xx=e.clientX;yy=e.clientY;canvas.setPointerCapture(e.pointerId)};
 const pointerMove=e=>{if(!down)return;yaw+=clamp((e.clientX-xx)*.009,-.3,.3);pitch=clamp(pitch+(e.clientY-yy)*.009,-.68,.68);xx=e.clientX;yy=e.clientY};
 const pointerUp=e=>{down=false;try{canvas.releasePointerCapture(e.pointerId)}catch{}};
 const wheel=e=>{e.preventDefault();zoom=clamp(zoom+Math.sign(e.deltaY)*.065,.72,1.5)};
 const reset=()=>{yaw=-.12;pitch=-.06;zoom=1};
 canvas.addEventListener("pointerdown",pointerDown);canvas.addEventListener("pointermove",pointerMove);canvas.addEventListener("pointerup",pointerUp);canvas.addEventListener("pointercancel",pointerUp);
 canvas.addEventListener("wheel",wheel,{passive:false});canvas.addEventListener("dblclick",reset);
 canvas.style.touchAction="none";
 const stop=()=>{active=false;cancelAnimationFrame(raf)};
 const resume=()=>{if(!active&&inView&&!document.hidden){active=true;last=0;paint()}};
 const visibility=()=>{if(document.hidden)stop();else resume()};
 document.addEventListener("visibilitychange",visibility);
 let observer=null;
 if("IntersectionObserver" in window){
  observer=new IntersectionObserver(es=>{inView=es.some(e=>e.isIntersecting);if(inView)resume();else stop()},{rootMargin:"110px"});observer.observe(canvas)
 }
 paint();
 return {supported:true,set(p){if(p.species&&colors[p.species]){upload(p.species);yaw=-.12;pitch=-.06;zoom=1}},destroy(){stop();observer?.disconnect();document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("pointerdown",pointerDown);canvas.removeEventListener("pointermove",pointerMove);canvas.removeEventListener("pointerup",pointerUp);canvas.removeEventListener("pointercancel",pointerUp);canvas.removeEventListener("wheel",wheel);canvas.removeEventListener("dblclick",reset);gl.deleteBuffer(buf);gl.deleteProgram(prog)}};
}

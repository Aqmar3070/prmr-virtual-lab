// PRMR-R07 -- no dependency GLB viewer for photo-textured single-view 3D reconstructions.
// Front texture is generated PRMR artwork. Depth and reverse are approximations, NOT anatomy.
import {createAnimalSculpture} from "./r05_animal3d.mjs?v=r07-photo-20261117";
const ALLOWED=new Set(["mouse","rat","pig","dog","nhp","rabbit"]);
const VS=[
 "attribute vec3 pos;attribute vec3 normal;attribute vec2 uv;",
 "uniform float yaw,pitch,zoom;uniform vec2 aspect;",
 "varying vec3 vN;varying vec2 vUV;",
 "void main(){float c=cos(yaw),s=sin(yaw),cp=cos(pitch),sp=sin(pitch);",
 "mat3 Y=mat3(c,0.,-s,0.,1.,0.,s,0.,c);mat3 X=mat3(1.,0.,0.,0.,cp,sp,0.,-sp,cp);",
 "vec3 p=X*Y*pos;vN=normalize(X*Y*normal);vUV=uv;",
 "gl_Position=vec4(p.x/(2.7*aspect.x*zoom),p.y/(2.1*aspect.y*zoom),-p.z/6.,1.);}"
].join("\n");
const FS=[
 "precision mediump float;uniform sampler2D tex;varying vec3 vN;varying vec2 vUV;",
 "void main(){vec4 C=texture2D(tex,vec2(vUV.x,1.-vUV.y));if(C.a<.12)discard;",
 "vec3 N=normalize(vN),L=normalize(vec3(-.45,.86,1.3)),R=normalize(vec3(.65,.18,.8));",
 "float d=max(0.,dot(N,L)),f=max(0.,dot(N,R));",
 "float rim=pow(1.-max(dot(N,vec3(0.,0.,1.)),0.),2.);",
 "vec3 shaded=C.rgb*(.73+.28*d+.10*f)+vec3(.042,.07,.09)*rim;",
 "gl_FragColor=vec4(clamp(shaded,0.,1.),C.a);}"
].join("\n");
function shader(gl,type,source){
 const x=gl.createShader(type);gl.shaderSource(x,source);gl.compileShader(x);
 if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){
  const error=gl.getShaderInfoLog(x);gl.deleteShader(x);throw Error(error)
 }
 return x;
}
function program(gl){
 const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,FS);
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
 gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 return p;
}
const TYPES={VEC3:3,VEC2:2,SCALAR:1};
export function unpack(data){
 const view=new DataView(data);
 if(view.byteLength<28||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||
 view.getUint32(8,true)!==view.byteLength)throw Error("Fichier GLB invalide");
 let offset=12,js=null,bin=-1,binLen=0;
 while(offset+8<=view.byteLength){
  const len=view.getUint32(offset,true),type=view.getUint32(offset+4,true);offset+=8;
  if(len>view.byteLength-offset)throw Error("Bloc GLB tronqué");
  if(type===0x4E4F534A)js=JSON.parse(new TextDecoder().decode(new Uint8Array(data,offset,len)));
  if(type===0x004E4942){bin=offset;binLen=len}
  offset+=len;
 }
 if(!js||bin<0)throw Error("GLB sans maillage binaire");
 const mesh=js.meshes?.[0]?.primitives?.[0];
 if(!mesh||mesh.mode!==4)throw Error("Triangles GLB absents");
 const accessor=n=>{
  const a=js.accessors[n],b=js.bufferViews[a?.bufferView];
  if(!a||!b||!TYPES[a.type]||b.byteStride)throw Error("Attribut glTF incompatible");
  const bytes=a.componentType===5126||a.componentType===5125?4:a.componentType===5123?2:0;
  if(!bytes)throw Error("Type glTF non pris en charge");
  const start=bin+(b.byteOffset||0)+(a.byteOffset||0),size=a.count*TYPES[a.type]*bytes;
  if(start+size>bin+binLen)throw Error("Attribut glTF invalide");
  const copy=new Uint8Array(data,start,size).slice().buffer;
  return a.componentType===5126?new Float32Array(copy):a.componentType===5125?new Uint32Array(copy):new Uint16Array(copy);
 };
 const image=js.images?.[0],v=js.bufferViews[image?.bufferView];
 if(!v||image.mimeType!=="image/webp")throw Error("Texture GLB absente");
 const offsetImage=bin+(v.byteOffset||0),len=v.byteLength;
 if(offsetImage+len>bin+binLen)throw Error("Texture GLB tronquée");
 return {pos:accessor(mesh.attributes.POSITION),normal:accessor(mesh.attributes.NORMAL),uv:accessor(mesh.attributes.TEXCOORD_0),
  indices:accessor(mesh.indices),image:new Blob([new Uint8Array(data,offsetImage,len)],{type:"image/webp"})};
}
function upload(gl,model,bitmap){
 const p=program(gl),buffers=[],attributes=[];
 for(const [name,data,dim] of [["pos",model.pos,3],["normal",model.normal,3],["uv",model.uv,2]]){
  const buf=gl.createBuffer(),loc=gl.getAttribLocation(p,name);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  buffers.push(buf);attributes.push({buf,loc,dim})
 }
 const indices=gl.createBuffer();buffers.push(indices);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,model.indices,gl.STATIC_DRAW);
 let indexType=gl.UNSIGNED_SHORT;
 if(model.indices instanceof Uint32Array){
  if(!gl.getExtension("OES_element_index_uint"))throw Error("Index 32 bit absent");
  indexType=gl.UNSIGNED_INT;
 }
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
 return {program:p,buffers,tex,attributes,indices,indexType,count:model.indices.length,
  dispose(){buffers.forEach(b=>gl.deleteBuffer(b));gl.deleteTexture(tex);gl.deleteProgram(p)}};
}
async function fetchModel(id,signal){
 const r=await fetch("./assets/animals-3d/"+id+".glb",{signal,cache:"force-cache"});
 if(!r.ok)throw Error("GLB non disponible : "+r.status);
 const n=Number(r.headers.get("content-length")||0);
 if(n>1200000)throw Error("GLB trop lourd");
 const bytes=await r.arrayBuffer();
 if(bytes.byteLength>1200000)throw Error("GLB trop lourd");
 return unpack(bytes);
}
export function createPhotoAnimalViewer(canvas,{species="mouse",onMode}={}){
 const unsupported={supported:false,set(){},destroy(){}};
 let gl;try{gl=canvas?.getContext("webgl",{alpha:true,antialias:true,depth:true})}catch{return unsupported}
 if(!gl)return unsupported;
 let gpu=null,backup=null,abort=null,token=0,activeSpecies="",raf=0,last=0,enabled=true,visible=true,pressed=false;
 let yaw=-.10,pitch=-.07,zoom=1,x=0,y=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const notify=(kind,description)=>onMode?.(kind,description);
 const stop=()=>{cancelAnimationFrame(raf);raf=0};
 const clear=()=>{stop();gpu?.dispose();gpu=null;backup?.destroy();backup=null};
 const paint=t=>{
  if(!enabled||!visible||document.hidden||!gpu)return;
  raf=requestAnimationFrame(paint);
  if(t-last<31)return;last=t;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
  const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(w<4||h<4)return;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  const g=gpu;gl.useProgram(g.program);
  for(const a of g.attributes){
   gl.bindBuffer(gl.ARRAY_BUFFER,a.buf);gl.enableVertexAttribArray(a.loc);
   gl.vertexAttribPointer(a.loc,a.dim,gl.FLOAT,false,0,0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.indices);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,g.tex);
  gl.uniform1i(gl.getUniformLocation(g.program,"tex"),0);
  gl.uniform1f(gl.getUniformLocation(g.program,"yaw"),yaw);
  gl.uniform1f(gl.getUniformLocation(g.program,"pitch"),pitch);
  gl.uniform1f(gl.getUniformLocation(g.program,"zoom"),zoom);
  const aspect=w/h;
  gl.uniform2f(gl.getUniformLocation(g.program,"aspect"),Math.max(1,aspect/1.5),Math.max(1,1.5/aspect));
  gl.drawElements(gl.TRIANGLES,g.count,g.indexType,0);
 };
 const down=e=>{pressed=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId)};
 const move=e=>{if(!pressed)return;yaw+=(e.clientX-x)*.008;pitch=clamp(pitch+(e.clientY-y)*.008,-1.1,1.1);x=e.clientX;y=e.clientY};
 const up=e=>{pressed=false;try{canvas.releasePointerCapture(e.pointerId)}catch{}};
 const wheel=e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY<0?1.08:.925),.65,1.9)};
 const reset=()=>{yaw=-.10;pitch=-.07;zoom=1};
 canvas.addEventListener("pointerdown",down);
 canvas.addEventListener("pointermove",move);
 canvas.addEventListener("pointerup",up);
 canvas.addEventListener("pointercancel",up);
 canvas.addEventListener("wheel",wheel,{passive:false});
 canvas.addEventListener("dblclick",reset);
 canvas.style.touchAction="none";
 const vis=()=>{if(document.hidden)stop();else if(gpu&&visible&&!raf)raf=requestAnimationFrame(paint)};
 document.addEventListener("visibilitychange",vis);
 let observer=null;
 if("IntersectionObserver" in window){
  observer=new IntersectionObserver(es=>{
   visible=es.some(e=>e.isIntersecting);
   if(!visible)stop();
   else if(gpu&&!raf&&!document.hidden)raf=requestAnimationFrame(paint)
  },{rootMargin:"160px"});observer.observe(canvas)
 }
 async function choose(id){
  if(!enabled||!ALLOWED.has(id)||id===activeSpecies)return;
  token++;const t=token;abort?.abort();abort=new AbortController();
  clear();activeSpecies=id;reset();notify("loading","Chargement de la sculpture phototexturée...");
  try{
   const model=await fetchModel(id,abort.signal);
   const img=await createImageBitmap(model.image);
   if(!enabled||t!==token){img.close?.();return}
   gpu=upload(gl,model,img);img.close?.();
   notify("photo3d","3D phototexturée · rotation 360° · arrière estimé, non anatomique");
   if(visible&&!document.hidden)raf=requestAnimationFrame(paint);
  }catch(error){
   if(!enabled||t!==token||error?.name==="AbortError")return;
   backup=createAnimalSculpture(canvas,{species:id});
   notify(backup.supported?"stylized":"static","GLB phototexturé absent : modèle schématique de secours.");
  }
 }
 choose(species);
 return {supported:true,set(next){if(next.species)choose(next.species)},
  destroy(){
   enabled=false;token++;abort?.abort();clear();observer?.disconnect();
   document.removeEventListener("visibilitychange",vis);
   canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);
   canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);
   canvas.removeEventListener("wheel",wheel);canvas.removeEventListener("dblclick",reset)
  }};
}

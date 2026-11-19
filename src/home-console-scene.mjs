import {renalAtlas} from "./renal-atlas.mjs";
import * as T from "../vendor/three/build/three.module.js";

// All console geometry is laid out against the actual link boxes. HTML owns
// the typography, focus, and hit targets at every breakpoint.
export function mountConsole(host, body) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const canvas = renderer.domElement;
  canvas.className = "home-console-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const panels = [...host.querySelectorAll(".home-panel")];
  const pedestal = host.querySelector(".home-platform");
  host.prepend(canvas);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, .1, 4000);
  camera.position.z = 1500;
  scene.add(new T.HemisphereLight(0xc5f8ff, 0x214b67, 1.5));
  const key = new T.DirectionalLight(0xc0f5ff, 2.3);
  key.position.set(-350, 600, 900);
  scene.add(key);
  const fill = new T.DirectionalLight(0x378cdf, 1.8);
  fill.position.set(400, -100, 480);
  scene.add(fill);
  const metal = new T.MeshStandardMaterial({color:0x153547, metalness:.48, roughness:.25});
  const glass = new T.MeshPhysicalMaterial({color:0x051521, metalness:.23, roughness:.23, clearcoat:1, transparent:true, opacity:.91});
  const edge = new T.LineBasicMaterial({color:0xa2f6ff,transparent:true,opacity:.95});
  const engraving=new T.LineBasicMaterial({color:0x72bfd7,transparent:true,opacity:.53,depthWrite:false});
  const beacons = new T.PointsMaterial({color:0x98eaff,size:2.4,sizeAttenuation:false,transparent:true,opacity:.88});
  const fine = new T.LineBasicMaterial({color:0x4c9fbd,transparent:true,opacity:.50});
  const bright = new T.MeshBasicMaterial({color:0x90f2ff});
  const aqua = new T.MeshPhongMaterial({color:0x57c4e7,emissive:0x072c40,shininess:95});
  const glowMap=document.createElement("canvas");glowMap.width=128;glowMap.height=48;
  const ink=glowMap.getContext("2d");ink.scale(128,48);
  const flare=ink.createRadialGradient(.5,.5,0,.5,.5,.5);
  flare.addColorStop(0,"#efffff");flare.addColorStop(.09,"#adffff");flare.addColorStop(.25,"rgba(30,198,255,.60)");flare.addColorStop(1,"rgba(0,132,210,0)");
  ink.fillStyle=flare;ink.fillRect(0,0,1,1);
  const glowMaterial=new T.SpriteMaterial({map:new T.CanvasTexture(glowMap),transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const renal=renalAtlas(body);
  const renalGeometry=new Set();
  renal.model.traverse(node=>{if(node.isMesh)renalGeometry.add(node.geometry);});
  let assembly, selected, lastSize = "", job = 0, visible = true, lastFrame = -100;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const highlight = new T.PointLight(0x8cecff,0,420,1);
  scene.add(highlight);

  function line(group, coords, material, loop=false) {
    const geometry = new T.BufferGeometry().setFromPoints(coords.map(p=>new T.Vector3(...p)));
    group.add(loop ? new T.LineLoop(geometry,material) : new T.Line(geometry,material));
  }
  function outline(w,h,z) {
    const x=w/2,y=h/2,k=Math.min(13,h*.14);
    return [[-x+k,y,z],[x-k,y,z],[x,y-k,z],[x,-y+k,z],[x-k,-y,z],[-x+k,-y,z],[-x,-y+k,z],[-x,y-k,z]];
  }
  function plate(group,w,h,z,depth,material) {
    const path=new T.Shape(outline(w,h,0).map(([x,y])=>new T.Vector2(x,y)));
    const geometry=new T.ExtrudeGeometry(path,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:1.4,bevelThickness:1.4});
    const mesh=new T.Mesh(geometry,material); mesh.position.z=z; group.add(mesh);
  }
  function ring(group,r,t,material,z) {
    const mesh=new T.Mesh(new T.TorusGeometry(r,t,8,128),material);
    mesh.position.z=z;group.add(mesh);return mesh;
  }
  function organView(group,w,h) {
    const model=renal.model.clone();
    model.scale.setScalar(Math.min(w*.60/renal.size.x,h*.91/renal.size.y));
    model.rotation.y=-.12;
    model.position.set(w*.15,h*.035,Math.max(45,h*.64));group.add(model);
  }
  function instrument(group, radius, sectors) {
    const segments=[];
    for (let i=0;i<60;i++) {
      const a=i*Math.PI/30, inner=radius*(i%5===0?.87:.94);
      segments.push(inner*Math.cos(a),inner*Math.sin(a),0,radius*Math.cos(a),radius*Math.sin(a),0);
    }
    const ticks=new T.BufferGeometry();
    ticks.setAttribute("position",new T.Float32BufferAttribute(segments,3));
    group.add(new T.LineSegments(ticks,fine));
    for (let k=0;k<sectors;k++) {
      const coords=[];
      for (let i=0;i<=34;i++) {
        const angle=(k+(i/34)*.78)*2*Math.PI/sectors;
        coords.push([radius*1.055*Math.cos(angle),radius*1.055*Math.sin(angle),2]);
      }
      line(group,coords,k===0?edge:fine);
    }
  }

  function floorNetwork(group,w,h) {
    // Two peripheral meshes leave a clear optical path to the atlas.
    for(const side of [-1,1]) {
      const rows=[],points=[],segments=[];
      for(let j=0;j<4;j++) {
        const row=[];
        for(let i=0;i<12;i++) {
          const wave=Math.sin(i*1.57+j*.91)*.017+Math.cos(i*.88-j)*.014;
          const x=side*w*(.16+i*.035+j*.009);
          const y=h*(-.215-j*.046+wave);
          const v=[x,y,-60-j*13+i*.9];
          row.push(v);points.push(...v);
          if(i)segments.push(...row[i-1],...v);
          if(j){
            segments.push(...rows[j-1][i],...v);
            if(i && (i+j)%2===0)segments.push(...rows[j-1][i-1],...v);
          }
        }
        rows.push(row);
      }
      const net=new T.BufferGeometry();
      net.setAttribute("position",new T.Float32BufferAttribute(segments,3));
      group.add(new T.LineSegments(net,fine));
      const geometry=new T.BufferGeometry();
      geometry.setAttribute("position",new T.Float32BufferAttribute(points,3));
      group.add(new T.Points(geometry,beacons));
    }
  }
  // Draw these marks on the inner glass face, beneath the anatomy.
  function panelEngraving(group,w,h,kind) {
    const segments=[];
    function track(points) {
      for(let i=1;i<points.length;i++) {
        for(const [x,y] of [points[i-1],points[i]])segments.push(x*w,y*h,4.6);
      }
    }
    if(kind==="proof"){
      for(let i=0;i<6;i++) track([[-.42,.27-i*.054],[-.34+(i%3)*.025,.27-i*.054]]);
      track([[.11,-.08],[.23,-.08],[.28,.04],[.36,.04],[.42,.18]]);
    }else if(kind==="anatomy"){
      for(const x of [-.36,-.07,.25])track([[x,.30],[x,.24],[x+.026,.24]]);
      track([[-.38,-.06],[-.22,-.06],[-.17,.03],[-.10,.03]]);
    }else if(kind==="clinical"){
      track([[-.44,.29],[-.34,.29],[-.30,.19],[-.22,.19]]);
      track([[-.40,.11],[-.33,.11],[-.30,.17],[-.28,.06],[-.25,.21],[-.23,.11],[-.16,.11]]);
      track([[.33,-.37],[.43,-.37],[.45,-.31]]);
    }else if(kind==="models"){
      for(let i=0;i<8;i++)track([[-.43,.3-i*.047],[-.43+(i%3===0?.033:.014),.3-i*.047]]);
      track([[-.35,.22],[-.26,.22],[-.22,.10],[-.15,.10]]);
    }else if(kind==="molecule"){
      track([[-.38,.30],[-.25,.30],[-.21,.19],[-.13,.19]]);
      for(const [rx,ry,y] of [[.24,.055,-.34],[.26,.075,-.35]]){
        const arc=[];for(let j=0;j<=56;j++){const a=j*2*Math.PI/56;arc.push([.17+rx*Math.cos(a),y+ry*Math.sin(a)]);} track(arc);
      }
    }
    const geom=new T.BufferGeometry();
    geom.setAttribute("position",new T.Float32BufferAttribute(segments,3));
    group.add(new T.LineSegments(geom,engraving));
    if(kind==="molecule"){
      const dial=new T.Group();dial.position.set(.17*w,.015*h,5);group.add(dial);
      instrument(dial,Math.min(.24*w,.36*h),4);
    }
  }
  function layout() {
    const bounds=host.getBoundingClientRect(),w=bounds.width,h=bounds.height;
    if (!w || !h) return;
    const size=w+"x"+h;if(size===lastSize)return;lastSize=size;
    if(assembly) {
      const used=new Set();assembly.traverse(o=>{if(o.geometry && !renalGeometry.has(o.geometry))used.add(o.geometry);});
      used.forEach(g=>g.dispose());scene.remove(assembly);
    }
    assembly=new T.Group();scene.add(assembly);
    renderer.setSize(w,h,false);
    camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
    function place(element) {
      const r=element.getBoundingClientRect(),g=new T.Group();
      g.position.set(r.left-bounds.left+(r.width-w)/2,bounds.top-r.top+(h-r.height)/2,0);
      assembly.add(g);return [g,r.width,r.height];
    }
    if(w>800) floorNetwork(assembly,w,h);
    const [halo,modelW,modelH]=place(host.querySelector(".home-model"));
    halo.position.z=-75;
    halo.rotation.set(.08,-.20,-.13);
    instrument(halo,Math.min(modelW*.49,modelH*.28),4);
    const [base,bw,bh]=place(pedestal);
    base.rotation.x=1.30;
    const r=bw*.47;
    const disk=new T.Mesh(new T.CylinderGeometry(r,r*.96,Math.max(5,bh*.16),128),metal);
    disk.rotation.x=Math.PI/2;base.add(disk);
    for(const [ratio,dia,z] of [[1,.006,4],[.94,.003,6],[.78,.007,9],[.65,.003,11],[.53,.005,14]])ring(base,r*ratio,Math.max(.65,r*dia),bright,z);
    ring(base,r*.84,Math.max(.8,r*.012),aqua,9);
    instrument(base,r*1.075,8);
    for(let i=0;i<72;i++){
      const a=i*Math.PI/36,outer=r*.91,inner=r*(i%6===0?.856:.885);
      line(base,[[inner*Math.cos(a),inner*Math.sin(a),8],[outer*Math.cos(a),outer*Math.sin(a),8]],edge);
    }
    panels.forEach((el,index)=>{
      const [g,pw,ph]=place(el);el._consolePosition=g.position;
      const kind=["proof","anatomy","molecule","models","clinical","exposure"][index];
      if(w>800)g.rotation.set([.08,.035,-.05,.035,.055,0][index],[.19,.12,-.17,-.10,-.14,0][index],[-.052,.015,.033,.007,-.023,0][index]);
      plate(g,pw-3,ph-3,-6,4,metal);plate(g,pw-8,ph-8,0,2,glass);
      line(g,outline(pw-3,ph-3,1),edge,true);line(g,outline(pw-13,ph-13,4),fine,true);
      if(!el.classList.contains("panel-exposure")) panelEngraving(g,pw,ph,kind);
      if(el.classList.contains("panel-models")) {
        organView(g,pw,ph);
        const dial=new T.Group();dial.position.set(pw*.15,0,ph*.20+8);dial.rotation.y=.32;g.add(dial);
        instrument(dial,Math.min(ph*.38,pw*.19),3);
      }
      const gx=(index%2===0?-.32:.26)*pw,gy=ph*.48;
      const glint=new T.Sprite(glowMaterial);
      glint.position.set(gx,gy,9);
      glint.scale.set(Math.min(82,pw*.31),Math.min(17,ph*.16),1);g.add(glint);
      line(g,[[gx-pw*.055,gy,8],[gx+pw*.055,gy,8]],edge);
      if(kind==="exposure")return;
      if(w>800) {
        const sign=Math.sign(g.position.x);
        const x=g.position.x-sign*pw*.5,y=g.position.y;
        line(assembly,[[x,y,-14],[x-sign*w*.016,y,-14],[x-sign*w*.035,y-ph*.25,-14],[sign*w*.082,y-ph*.25,-14]],fine);
      }
    });
    renderer.render(scene,camera);
    host.classList.add("console-depth");
  }
  function draw(time) {
    job=0;if(!visible||document.hidden)return;
    if(time-lastFrame>=50 || motion.matches) {
      const brightness=motion.matches?.5:.5+.5*Math.sin(time*.00075);
      aqua.emissiveIntensity=.7+brightness*.65;
      if(selected && selected._consolePosition){highlight.position.copy(selected._consolePosition);highlight.position.z=95;highlight.intensity=32;}
      else highlight.intensity=0;
      if(assembly) renderer.render(scene,camera);
      lastFrame=time;
    }
    if(!motion.matches)job=requestAnimationFrame(draw);
  }
  function wake(){if(!job&&visible&&!document.hidden)job=requestAnimationFrame(draw);}
  for(const el of panels){
    for(const type of ["pointerenter","focus"])el.addEventListener(type,()=>{selected=el;wake();});
    for(const type of ["pointerleave","blur"])el.addEventListener(type,()=>{if(selected===el)selected=null;wake();});
  }
  new ResizeObserver(()=>{layout();wake();}).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();}).observe(host);
  document.addEventListener("visibilitychange",wake);motion.addEventListener("change",wake);
  canvas.addEventListener("webglcontextlost",()=>{host.classList.remove("console-depth");visible=false;});
  layout();wake();
}

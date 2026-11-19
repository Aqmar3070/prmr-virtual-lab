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
  const fine = new T.LineBasicMaterial({color:0x4c9fbd,transparent:true,opacity:.50});
  const glowMap=document.createElement("canvas");glowMap.width=128;glowMap.height=48;
  const ink=glowMap.getContext("2d");ink.scale(128,48);
  const flare=ink.createRadialGradient(.5,.5,0,.5,.5,.5);
  flare.addColorStop(0,"#efffff");flare.addColorStop(.09,"#adffff");flare.addColorStop(.25,"rgba(30,198,255,.60)");flare.addColorStop(1,"rgba(0,132,210,0)");
  ink.fillStyle=flare;ink.fillRect(0,0,1,1);
  const glowMaterial=new T.SpriteMaterial({map:new T.CanvasTexture(glowMap),transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const ambientGlow=glowMaterial.clone();ambientGlow.opacity=.33;
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

  const floorInk=new T.LineBasicMaterial({color:0x59b6d3,vertexColors:true,transparent:true,opacity:.46,depthWrite:false});
  const floorLights=new T.PointsMaterial({color:0xabeaff,map:glowMaterial.map,size:5,sizeAttenuation:false,transparent:true,opacity:.75,depthWrite:false,blending:T.AdditiveBlending});
  function floorNetwork(group,w,h) {
    const segments=[],colors=[],stars=[];
    for(const side of [-1,1]){
      const rows=[];
      for(let j=0;j<3;j++){
        const row=[];
        for(let i=0;i<11;i++){
          const x=side*w*(.19+i*.034+.008*Math.sin(i*2+j));
          const y=h*(-.225-j*.039+.012*Math.sin(i*1.18+j*.83));
          const v=[x,y,-90-j*4];row.push(v);
          const k=.22+.66*Math.pow(.5+.5*Math.sin(i*1.4+j*2),2);
          function strand(start,strength){
            segments.push(...start,...v);
            colors.push(strength*.5,strength*.78,strength,k*.5,k*.78,k);
          }
          if(i && (i+j)%6!==0)strand(row[i-1],k*.65);
          if(j && (i+j)%3===0)strand(rows[j-1][i],k*.32);
          if(j && i && (i+j)%4===0)strand(rows[j-1][i-1],k*.4);
          if((i+j)%3===0)stars.push(...v);
        }
        rows.push(row);
      }
    }
    const net=new T.BufferGeometry();
    net.setAttribute("position",new T.Float32BufferAttribute(segments,3));
    net.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    group.add(new T.LineSegments(net,floorInk));
    const points=new T.BufferGeometry();
    points.setAttribute("position",new T.Float32BufferAttribute(stars,3));
    group.add(new T.Points(points,floorLights));
  }

  // A translucent emitter with a narrow white core, glass lip and reflected light.
  // UV space keeps the aperture aligned with the atlas even on compact layouts.
  const projector=new T.ShaderMaterial({
    uniforms:{energy:{value:1}},transparent:true,depthWrite:false,
    vertexShader:`varying vec2 st; void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 st; uniform float energy;
      float beam(vec2 p,vec2 span){vec2 q=p/span;return exp(-dot(q,q));}
      void main(){
        vec2 p=st-vec2(.5,.46);
        float pool=beam(p+vec2(0.,.055),vec2(.35,.105));
        float light=beam(p,vec2(.135,.013));
        float core=beam(p,vec2(.195,.0038));
        float mist=beam(p-vec2(0.,.09),vec2(.122,.17))*smoothstep(-.012,.035,p.y);
        float r=length(vec2(p.x/.34,(p.y+.058)/.079));
        float rim=exp(-abs(r-1.)*92.)*(.24+.55*pow(abs(p.x/.34),2.));
        float inner=length(vec2(p.x/.255,(p.y+.027)/.042));
        float glass=exp(-abs(inner-1.)*55.)*.43;
        float reflection=beam(p+vec2(0.,.115),vec2(.20,.013))*.26;
        vec3 L=vec3(.025,.32,.54)*pool+vec3(.12,.73,1.)*(light+rim+glass+reflection)
              +vec3(.80,1.,1.)*core+vec3(.04,.37,.56)*mist;
        L*=energy;
        float alpha=clamp(max(max(L.r,L.g),L.b),0.,1.);
        gl_FragColor=vec4(L/max(alpha,.0001),alpha);
      }`
  });
  function spill(group,x,y,z,width,height,material=glowMaterial){
    const light=new T.Sprite(material);light.position.set(x,y,z);light.scale.set(width,height,1);group.add(light);
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
    const radius=Math.min(modelW*.49,modelH*.28);
    const arcGlow=ambientGlow;
    for(const angle of [.56,2.43,3.74,5.42]){
      spill(halo,radius*Math.cos(angle),radius*Math.sin(angle),3,modelW*.17,modelW*.07,arcGlow);
    }
    const bw=pedestal.getBoundingClientRect().width;
    const sheetHeight=modelH*.61;
    const aperture=new T.Mesh(new T.PlaneGeometry(bw*1.35,sheetHeight),projector);
    // Anchor the bright slit to the lower edge of the body canvas.
    aperture.position.set(halo.position.x,halo.position.y-modelH*.5+sheetHeight*.04,-25);
    assembly.add(aperture);
    if(w>800){
      spill(assembly,-w*.33,-h*.245,-80,w*.25,h*.09,arcGlow);
      spill(assembly,w*.36,-h*.29,-80,w*.20,h*.07,arcGlow);
    }
    panels.forEach((el,index)=>{
      const [g,pw,ph]=place(el);el._consolePosition=g.position;
      const kind=["proof","anatomy","molecule","models","clinical","exposure"][index];
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
      projector.uniforms.energy.value=.91+brightness*.13;
      ambientGlow.opacity=.25+brightness*.15;
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

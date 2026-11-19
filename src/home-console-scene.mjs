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
  const metal = new T.MeshStandardMaterial({color:0x245578, metalness:.48, roughness:.25});
  const glass = new T.MeshPhysicalMaterial({color:0x0e334e, metalness:.23, roughness:.23, clearcoat:1, transparent:true, opacity:.91});
  const edge = new T.LineBasicMaterial({color:0x8cecff,transparent:true,opacity:.87});
  const beacons = new T.PointsMaterial({color:0x98eaff,size:2.4,sizeAttenuation:false,transparent:true,opacity:.88});
  const fine = new T.LineBasicMaterial({color:0x4c9fbd,transparent:true,opacity:.50});
  const bright = new T.MeshBasicMaterial({color:0x90f2ff});
  const aqua = new T.MeshPhongMaterial({color:0x57c4e7,emissive:0x072c40,shininess:95});
  const amber = new T.MeshPhongMaterial({color:0xffbd67,emissive:0x6b3516,shininess:100});
  const kidneys = [];
  body.updateMatrixWorld(true);
  body.traverse(node => {
    if (node.isMesh && /^kidney_[lr]$/.test(node.name)) kidneys.push(node);
  });
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
  function molecule(group,w,h) {
    const sketch=new T.Group(); group.add(sketch);
    sketch.position.set(w*.24,h*.05,16); sketch.rotation.set(.52,-.32,.24);
    const radius=Math.min(h*.33,w*.17);
    const points=Array.from({length:6},(_,i)=>new T.Vector3(Math.cos(i*Math.PI/3)*radius,Math.sin(i*Math.PI/3)*radius,0));
    const sphere=new T.SphereGeometry(1,20,14);
    function atom(v,r,m) {const o=new T.Mesh(sphere,m);o.scale.setScalar(r);o.position.copy(v);sketch.add(o);}
    function bond(a,b) {
      const axis=b.clone().sub(a);
      const o=new T.Mesh(new T.CylinderGeometry(radius*.038,radius*.038,axis.length(),10),aqua);
      o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
      o.position.addVectors(a,b).multiplyScalar(.5);sketch.add(o);
    }
    points.forEach((p,i)=>{const end=p.clone().multiplyScalar(1.45);bond(p,points[(i+1)%6]);bond(p,end);atom(p,radius*.17,aqua);atom(end,radius*.10,amber);});
  }
  function organView(group,w,h) {
    const organs=new T.Group();
    for(const node of kidneys) {
      const mesh=new T.Mesh(node.geometry,aqua);mesh.applyMatrix4(node.matrixWorld);organs.add(mesh);
    }
    if (!organs.children.length) return;
    const bounds=new T.Box3().setFromObject(organs),size=bounds.getSize(new T.Vector3());
    const model=new T.Group();organs.position.copy(bounds.getCenter(new T.Vector3())).negate();model.add(organs);
    model.scale.setScalar(Math.min(w*.46/size.x,h*.65/size.y));model.rotation.y=-.24;
    model.position.set(w*.22,0,28);group.add(model);
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
  function layout() {
    const bounds=host.getBoundingClientRect(),w=bounds.width,h=bounds.height;
    if (!w || !h) return;
    const size=w+"x"+h;if(size===lastSize)return;lastSize=size;
    if(assembly) {
      const used=new Set();assembly.traverse(o=>{if(o.geometry && !kidneys.some(k=>k.geometry===o.geometry))used.add(o.geometry);});
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
    panels.forEach(el=>{
      const [g,pw,ph]=place(el);el._consolePosition=g.position;
      g.rotation.y=w>800?(g.position.x<0?.095:-.095):0;
      plate(g,pw-3,ph-3,-6,4,metal);plate(g,pw-8,ph-8,0,2,glass);
      line(g,outline(pw-3,ph-3,1),edge,true);line(g,outline(pw-13,ph-13,4),fine,true);
      if(el.classList.contains("panel-molecules"))molecule(g,pw,ph);
      if(el.classList.contains("panel-models")) {
        organView(g,pw,ph);
        const dial=new T.Group();dial.position.set(pw*.22,0,6);dial.rotation.y=.32;g.add(dial);
        instrument(dial,Math.min(ph*.38,pw*.19),3);
      }
      if(el.classList.contains("panel-exposure"))return;
      for(let i=0;i<9;i++) {
        const x=-pw*.42+i*Math.min(6,pw*.015);
        line(g,[[x,ph*.38,5],[x+1.6,ph*.38,5]],edge);
      }
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

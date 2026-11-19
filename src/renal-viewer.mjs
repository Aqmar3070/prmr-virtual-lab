import * as T from "../vendor/three/build/three.module.js";
import {GLTFLoader} from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "../vendor/three/examples/jsm/libs/meshopt_decoder.module.js";
import {OrbitControls} from "../vendor/three/examples/jsm/controls/OrbitControls.js";
import {renalAtlas} from "./renal-atlas.mjs";
const host=document.querySelector(".renal-stage"), status=document.querySelector("#renal-status");
async function mount(){
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const atlas=await loader.loadAsync(new URL("../assets/human3d/anatomy-male.glb",import.meta.url).href);
  const {model,size,vessels}=renalAtlas(atlas.scene);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.001,12);
  camera.position.set(0,0,1);
  const light=new T.DirectionalLight(0xd6f7ff,2.1);light.position.set(-2,3,4);
  scene.add(model,light,new T.HemisphereLight(0xc9ebff,0x193b55,1.5));
  const canvas=renderer.domElement;
  canvas.tabIndex=0;canvas.setAttribute("aria-label","Reins humains en 3D. Glisser pour tourner, molette ou pincement pour zoomer. Flèches pour tourner au clavier.");
  host.prepend(canvas);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.minZoom=.55;controls.maxZoom=3;
  function draw(){renderer.render(scene,camera);}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    const ratio=w/h,half=Math.max(size.y*.60,size.x*.55/ratio);
    camera.top=half;camera.bottom=-half;camera.right=half*ratio;camera.left=-camera.right;camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);draw();
  }
  controls.addEventListener("change",draw);new ResizeObserver(resize).observe(host);
  controls.update();controls.saveState();resize();
  const vesselsButton=document.querySelector("#renal-vessels"),reset=document.querySelector("#renal-reset");
  vesselsButton.disabled=reset.disabled=false;
  vesselsButton.onclick=()=>{vessels.visible=!vessels.visible;vesselsButton.setAttribute("aria-pressed",String(vessels.visible));draw();};
  reset.onclick=()=>controls.reset();
  canvas.onkeydown=e=>{
    const offset=new T.Spherical().setFromVector3(camera.position);
    if(e.key==="ArrowLeft")offset.theta-=.15;
    else if(e.key==="ArrowRight")offset.theta+=.15;
    else if(e.key==="ArrowUp")offset.phi-=.15;
    else if(e.key==="ArrowDown")offset.phi+=.15;
    else return;
    e.preventDefault();offset.makeSafe();camera.position.setFromSpherical(offset);controls.update();
  };
  status.textContent="";host.classList.add("ready");
}
mount().catch(()=>{status.textContent="Visualisation 3D indisponible.";});

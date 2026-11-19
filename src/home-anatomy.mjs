const frame = document.querySelector("#home-model");
const viewport = frame.querySelector(".home-viewport");
const status = frame.querySelector(".home-model-status");

async function mount() {
  const [T, { OrbitControls }, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("../vendor/three/build/three.module.js"),
    import("../vendor/three/examples/jsm/controls/OrbitControls.js"),
    import("../vendor/three/examples/jsm/loaders/GLTFLoader.js"),
    import("../vendor/three/examples/jsm/libs/meshopt_decoder.module.js")
  ]);
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, .01, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  const render = () => {
    if (viewport.clientWidth && viewport.clientHeight) renderer.render(scene, camera);
  };
  controls.addEventListener("change", render);
  try {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const { scene: body } = await loader.loadAsync(new URL("../assets/human3d/anatomy-male.glb", import.meta.url).href);
    const surface = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `varying vec3 n; varying vec3 eye;
        void main(){ vec4 p=modelViewMatrix*vec4(position,1.);
        n=normalize(normalMatrix*normal); eye=-p.xyz; gl_Position=projectionMatrix*p; }`,
      fragmentShader: `varying vec3 n; varying vec3 eye;
        void main(){ float rim=pow(1.-abs(dot(normalize(n),normalize(eye))),1.7);
        gl_FragColor=vec4(mix(vec3(.08,.47,.67),vec3(.55,.96,1.),rim),.07+.77*rim); }`
    });
    const bones = new T.MeshPhongMaterial({color:0x82dfff, transparent:true, opacity:.30, depthWrite:false});
    const vessels = new T.MeshPhongMaterial({color:0x42bfee, transparent:true, opacity:.49, depthWrite:false});
    const viscera = new T.MeshPhongMaterial({color:0x45c9ef, transparent:true, opacity:.13, depthWrite:false});
    const kidney = new T.MeshStandardMaterial({color:0xffa351, emissive:0xdf6229, emissiveIntensity:.8});
    body.traverse(node => {
      if (!node.isMesh) return;
      let part = node;
      while (part.parent && part.parent !== body) part = part.parent;
      if (/^kidney_[lr]$/.test(node.name)) node.material = kidney;
      else if (part.name === "skin") { node.material = surface; node.renderOrder = 3; }
      else if (part.name === "skeleton") node.material = bones;
      else if (/arter|vein|aorta/i.test(node.name)) node.material = vessels;
      else node.material = viscera;
    });
    scene.add(body, new T.HemisphereLight(0xe4fbff, 0x326789, 2.3));
    const light = new T.DirectionalLight(0xe4fbff, 2.2);
    light.position.set(2,3,4); scene.add(light);
    const box = new T.Box3().setFromObject(body);
    const height = box.max.y - box.min.y;
    const center = box.getCenter(new T.Vector3());
    const target = center.clone(); target.y += height * .13;
    const resize = () => {
      const w = viewport.clientWidth, h = viewport.clientHeight;
      if (!w || !h) return;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h,false); render();
    };
    const distance = height * 1.53;
    camera.position.copy(target).add(new T.Vector3(0, 0, distance));
    controls.target.copy(target);
    controls.minDistance = distance * .53;
    controls.maxDistance = distance * 2;
    controls.update(); controls.saveState();
    viewport.append(renderer.domElement);
    resize();
    new ResizeObserver(resize).observe(viewport);
    frame.classList.add("ready");
    status.textContent = "Modèle 3D chargé";
    import("./home-console-scene.mjs?v=3")
      .then(({mountConsole}) => mountConsole(frame.closest(".prmr-home"), body))
      .catch(error => console.warn("Décor 3D indisponible", error));
    viewport.addEventListener("keydown", event => {
      const offset = camera.position.clone().sub(controls.target);
      const polar = new T.Spherical().setFromVector3(offset);
      switch (event.key) {
        case "ArrowLeft": polar.theta -= .14; break;
        case "ArrowRight": polar.theta += .14; break;
        case "ArrowUp": polar.phi -= .12; break;
        case "ArrowDown": polar.phi += .12; break;
        case "+": case "=": polar.radius *= .88; break;
        case "-": polar.radius /= .88; break;
        case "Home": event.preventDefault(); controls.reset(); return;
        default: return;
      }
      event.preventDefault(); polar.makeSafe();
      polar.radius = T.MathUtils.clamp(polar.radius, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(offset.setFromSpherical(polar)); controls.update();
    });
  } catch (error) { controls.dispose(); renderer.dispose(); throw error; }
}

const observer = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  observer.disconnect();
  mount().catch(() => { frame.classList.add("unavailable"); status.textContent = "Illustration · 3D indisponible"; });
});
observer.observe(frame);

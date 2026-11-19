/* PRMR — l'atlas humain réel au centre de la console.
 *
 * La console affichait une silhouette dessinée à la main. Le dépôt contient
 * pourtant un atlas anatomique réel — 147 structures nommées, issues de
 * BodyParts3D et du Human Reference Atlas — déjà utilisé par la page
 * clinique. C'est lui qui doit occuper le centre.
 *
 * Cet afficheur est volontairement séparé de r05_clinical.mjs : la page
 * clinique est un poste d'étude complet, la console n'a besoin que de montrer
 * un corps et d'allumer les organes qu'un repère franchi concerne. Deux
 * besoins différents, deux modules, aucune régression sur l'existant.
 *
 * Ce que l'afficheur ne fait pas : représenter un état, une lésion ou une
 * mesure. La couleur d'un organe dit la nature du repère franchi, rien de
 * plus — la même règle que pour le schéma qu'il remplace.
 */
import * as T from "../vendor/three/build/three.module.js";
import { OrbitControls } from "../vendor/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../vendor/three/examples/jsm/libs/meshopt_decoder.module.js";

/* Nos clés d'organes ne sont pas celles de l'atlas : « kidneys » recouvre
   deux maillages, et l'atlas nomme en anglais. */
export const ORGAN_NODES = Object.freeze({
  kidneys: ["kidney_l", "kidney_r"],
  heart: ["heart"],
  liver: ["liver"],
  stomach: ["stomach"],
  brain: ["brain"]
});

/* Teintes d'ambiance par système. Le corps doit se lire comme une coupe :
   assez présent pour situer, assez discret pour que l'organe marqué ressorte. */
const SYSTEM_STYLE = {
  skeleton: { color: 0x9fb8c4, opacity: 0.30 },
  organs:   { color: 0x5f8496, opacity: 0.22 },
  vessels:  { color: 0x7693a4, opacity: 0.14 },
  skin:     { color: 0x5fd0e6, opacity: 0.045 },
  muscles:  { color: 0x6b8a99, opacity: 0.0 },
  nerves:   { color: 0x8fa8b8, opacity: 0.0 }
};

const MODEL = "./assets/human3d/anatomy-male.glb";
const CATALOG = "./research-data/r05_human_anatomy_catalog.json";

function ambientMaterial(style) {
  return new T.MeshStandardMaterial({
    color: style.color,
    transparent: true,
    opacity: style.opacity,
    roughness: 0.75,
    metalness: 0.05,
    depthWrite: false,
    side: T.DoubleSide
  });
}

export async function mountBodyViewer(canvas, { onStatus } = {}) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 0.01, 50);
  scene.add(new T.HemisphereLight(0xcfeeff, 0x0a1a24, 2.0));
  const key = new T.DirectionalLight(0xffffff, 1.5);
  key.position.set(1.2, 2.2, 2.6);
  scene.add(key);
  const rim = new T.DirectionalLight(0x6fd4ea, 0.9);
  rim.position.set(-2, 1, -2);
  scene.add(rim);

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 0.6;
  controls.maxDistance = 3.2;
  controls.enableDamping = true;

  onStatus?.("Chargement de l’atlas anatomique…");

  const [catalogue, gltf] = await Promise.all([
    fetch(CATALOG).then(r => r.json()),
    new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(MODEL, resolve, undefined, reject);
    })
  ]);

  const systemOf = new Map(catalogue.map(entry => [entry.key, entry.system]));
  /* Un même organe peut être porté par plusieurs maillages : on garde des
     listes, sinon seul le dernier rein recevrait sa couleur. */
  const cibles = new Map();
  for (const [key, nodes] of Object.entries(ORGAN_NODES)) cibles.set(key, []);
  const nodeToKey = new Map();
  for (const [key, nodes] of Object.entries(ORGAN_NODES)) {
    for (const node of nodes) nodeToKey.set(node, key);
  }

  const body = new T.Group();
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    const name = object.name;
    const organKey = nodeToKey.get(name);
    const style = SYSTEM_STYLE[systemOf.get(name)] || SYSTEM_STYLE.organs;
    if (organKey) {
      object.material = new T.MeshStandardMaterial({
        color: 0x6f93a4, transparent: true, opacity: 0.55,
        roughness: 0.55, metalness: 0.05, emissive: 0x000000
      });
      cibles.get(organKey).push(object);
    } else {
      if (style.opacity === 0) { object.visible = false; return; }
      object.material = ambientMaterial(style);
    }
    object.renderOrder = organKey ? 2 : 1;
  });
  body.add(gltf.scene);
  scene.add(body);

  /* Cadrage sur le tronc et la tête : les organes du registre y vivent tous,
     et cadrer le corps entier les réduirait à des points. */
  const bounds = new T.Box3().setFromObject(body);
  const size = bounds.getSize(new T.Vector3());
  const centre = bounds.getCenter(new T.Vector3());
  const cible = new T.Vector3(centre.x, bounds.min.y + size.y * 0.72, centre.z);
  controls.target.copy(cible);
  camera.position.set(cible.x, cible.y, cible.z + size.y * 0.58);
  camera.lookAt(cible);

  let disposed = false;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  /* Les étiquettes doivent suivre la rotation : l'appelant s'abonne à la
     boucle plutôt que d'en ouvrir une seconde. */
  const rappels = [];
  (function boucle() {
    if (disposed) return;
    requestAnimationFrame(boucle);
    controls.update();
    renderer.render(scene, camera);
    for (const rappel of rappels) rappel();
  })();

  onStatus?.(null);

  /* Point d'ancrage d'un organe, en pixels du canevas : le centre de ses
     maillages projeté à l'écran. Recalculé à chaque appel, puisque le corps
     tourne. z vaut la profondeur normalisée — au-delà de 1, l'organe est
     derrière la caméra et son étiquette n'a pas lieu d'être. */
  const _v = new T.Vector3();
  const _box = new T.Box3();

  return {
    ancres() {
      const rect = canvas.getBoundingClientRect();
      const points = {};
      for (const [key, meshes] of cibles) {
        if (!meshes.length) continue;
        _box.makeEmpty();
        for (const mesh of meshes) _box.expandByObject(mesh);
        _box.getCenter(_v);
        _v.project(camera);
        points[key] = {
          x: (_v.x * 0.5 + 0.5) * rect.width,
          y: (-_v.y * 0.5 + 0.5) * rect.height,
          visible: _v.z < 1
        };
      }
      return points;
    },
    onFrame(callback) { rappels.push(callback); },

    /* states : { organKey: "#rrggbb" } — la couleur vient de l'appelant, qui
       seul sait quelle nature de repère a été franchie. */
    setStates(states) {
      for (const [key, meshes] of cibles) {
        const teinte = states[key];
        for (const mesh of meshes) {
          if (teinte) {
            mesh.material.color.set(teinte);
            mesh.material.emissive.set(teinte);
            mesh.material.emissiveIntensity = 0.55;
            mesh.material.opacity = 0.95;
          } else {
            mesh.material.color.set(0x6f93a4);
            mesh.material.emissive.set(0x000000);
            mesh.material.opacity = 0.5;
          }
          mesh.material.needsUpdate = true;
        }
      }
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    }
  };
}

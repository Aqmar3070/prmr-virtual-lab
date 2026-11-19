import {create3D} from "./r04_visuals.mjs?v=conformer2";
import {MOLECULES_R04} from "./r04_engine.mjs";

async function mount(host) {
  const canvas = host.querySelector("[data-mol-canvas]");
  const select = host.querySelector("select");
  const status = host.querySelector("[data-mol-meta]");
  const caption = host.querySelector("[data-mol-name]");
  const spin = host.querySelector("[data-spin]");
  const reset = host.querySelector("[data-reset]");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const response = await fetch(new URL("../research-data/r04_molecular_3d.json", import.meta.url));
  if (!response.ok) throw Error("Coordonnées indisponibles");
  const coordinates = await response.json();
  const available = MOLECULES_R04.filter(m => coordinates[m.id]);
  if (!available.length) throw Error("Aucun conformère disponible");
  let automatic = !motion.matches;
  const viewer = create3D(canvas,{kind:"molecule",model:coordinates[available[0].id],transparent:!select,fitConformer:true,autoRotate:automatic});
  function show(mol) {
    const model = coordinates[mol.id];
    viewer.set({kind:"molecule",model});
    viewer.reset();
    canvas.setAttribute("aria-label",mol.name+" en 3D. Glisser ou utiliser les flèches pour tourner. Espace pour suspendre ou reprendre la rotation.");
    if (caption) caption.textContent = mol.name;
    if (status) {
      status.textContent = model.formula+" · "+model.a.length+" atomes lourds · "+model.b.length+" liaisons · conformère calculé avec RDKit (ETKDG/MMFF).";
      const source = host.querySelector("[data-pubchem]");
      source.href = "https://pubchem.ncbi.nlm.nih.gov/compound/"+mol.cid;
      source.hidden = false;
    }
  }
  function rotate(value) {
    automatic = value;
    viewer.setAutoRotate(automatic);
    if (spin) spin.setAttribute("aria-pressed",String(automatic));
  }
  if (select) {
    for(const mol of available) select.add(new Option(mol.name,mol.id));
    select.disabled = spin.disabled = reset.disabled = false;
    select.addEventListener("change",()=>show(available.find(m=>m.id===select.value)));
    spin.addEventListener("click",()=>rotate(!automatic));
    reset.addEventListener("click",()=>viewer.reset());
  }
  const steps = {ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]};
  canvas.addEventListener("keydown",e=>{
    if(e.key===" ") {e.preventDefault();rotate(!automatic);}
    else if(steps[e.key]) {e.preventDefault();viewer.rotate(...steps[e.key]);}
  });
  motion.addEventListener("change",()=>rotate(!motion.matches));
  show(available[0]);rotate(automatic);
  host.classList.add("conformer-ready");
}
for(const host of document.querySelectorAll("[data-conformer]")) {
  mount(host).catch(()=>{
    const note=host.querySelector("[data-mol-meta], [data-mol-name]");
    if(note) note.textContent="Conformère indisponible";
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULT_R04,computeR04,validateR04,SPECIES_R04,MOLECULES_R04,OPTIONS} from "../src/r04_engine.mjs";
const root=new URL("../",import.meta.url);
const page=readFileSync(new URL("species-r04.html",root),"utf8");
const script=readFileSync(new URL("src/r04_app.mjs",root),"utf8");
const css=readFileSync(new URL("r04.css",root),"utf8");
const visual=readFileSync(new URL("src/r04_visuals.mjs",root),"utf8");
const molecules=JSON.parse(readFileSync(new URL("research-data/r04_molecular_3d.json",root),"utf8"));
test("Seules les espèces à anatomie réellement acquise sont proposées",()=>{
 // Souris, rat, porc, primate et lapin ont été retirés : leur anatomie 3D
 // n'était que des maillages construits, aucune imagerie sous licence
 // utilisable n'existant pour ces espèces. Chien et chat disposent l'un et
 // l'autre de surfaces issues de scanners.
 assert.deepEqual(SPECIES_R04.map(x=>x.id),["dog","cat"]);
 for(const s of SPECIES_R04){
  assert.ok(s.source.startsWith("https://"));
  assert.ok(s.ref_kg>=s.min_kg&&s.ref_kg<=s.max_kg);
  assert.ok(s.anatomy.length>=20);
  const p=computeR04({...DEFAULT_R04,species:s.id,mass_kg:s.ref_kg});
  assert.equal(p.regimens.length,3);
  assert.equal(p.species.id,s.id);
  assert.equal(p.mass_factor,1);
 }
});
test("Age, sex and body composition change annotated biology but not uncalibrated exposure",()=>{
 const base=computeR04(DEFAULT_R04);
 const changed=computeR04({...DEFAULT_R04,age:"old",sex:"female",constitution:"lean"});
 assert.deepEqual(base.regimens.map(r=>r.renal),changed.regimens.map(r=>r.renal));
 assert.ok(changed.observations.some(x=>x.name.includes("Âge")));
 assert.ok(changed.observations.some(x=>x.name.includes("Sexe")));
 assert.ok(changed.observations.some(x=>x.name.includes("Constitution")));
 assert.notDeepEqual(changed.observations,base.observations);
});
test("Renal / hepatic disease and weight drive declared illustrative exposure changes",()=>{
 const baseline=computeR04({...DEFAULT_R04,renal:"normal"});
 const severe=computeR04({...DEFAULT_R04,renal:"severe"});
 assert.ok(severe.active.renal.median>baseline.active.renal.median);
 const severeHep=computeR04({...DEFAULT_R04,hepatic:"severe"});
 assert.equal(severeHep.active.hepatic,null);
 const size=computeR04({...DEFAULT_R04,mass_kg:22});
 assert.notEqual(size.mass_factor,1);
 assert.notEqual(size.active.renal.median,severe.active.renal.median);
 const dry=computeR04({...DEFAULT_R04,hydration:"depleted"});
 assert.ok(dry.warnings.some(w=>w.includes("Hypovolémie")));
});
test("Le choix d'espèce et de pathologie change bien les sorties contextuelles",()=>{
 const dog=computeR04(DEFAULT_R04);
 const cat=computeR04({...DEFAULT_R04,species:"cat",mass_kg:4,disease:"ischemic"});
 assert.notEqual(dog.indication.markers,cat.indication.markers);
 assert.notEqual(dog.species.anatomy,cat.species.anatomy);
 assert.ok(cat.species.anatomy.includes("unipapillaire"));
 // Conséquence directe du retrait des rongeurs : l'occupation de SGLT2 n'était
 // calculable que pour la souris et le rat, seules espèces disposant d'une
 // CI50 publiée. Elle doit donc être déclarée indisponible, jamais estimée.
 assert.equal(dog.sglt2_occupancy,null);
 assert.equal(cat.sglt2_occupancy,null);
 for(const s of SPECIES_R04)assert.equal(s.ic50,null,s.id+" ne doit pas porter de CI50 inventée");
});
test("Toxicity cure benefit probability is unknown across all profiles, including NHP",()=>{
 for(const s of SPECIES_R04)for(const renal of Object.keys(OPTIONS.renal))for(const hepatic of Object.keys(OPTIONS.hepatic)){
  const p=computeR04({...DEFAULT_R04,species:s.id,mass_kg:s.ref_kg,renal,hepatic});
  assert.equal(p.probability_toxicity,null);
  assert.equal(p.probability_benefit,null);
  assert.equal(p.probability_cure,null);
  assert.equal(p.experimental_results,false);
  for(const r of p.regimens){
   assert.equal(r.toxicity_probability,null);
   assert.equal(r.benefit_probability,null);
   assert.equal(r.cure_probability,null);
   assert.equal(r.pk_calibrated_for_animal,false);
   assert.equal(r.measured_in_PRMR_animals,false);
  }
 }
});
test("Invalid animal mass or category rejected rather than generating outputs",()=>{
 assert.throws(()=>validateR04({...DEFAULT_R04,species:"human"}));
 assert.throws(()=>validateR04({...DEFAULT_R04,mass_kg:999999}));
 assert.throws(()=>validateR04({...DEFAULT_R04,age:"2000"}));
});
test("Four RDKit 3D conformer datasets have correctly indexed chemical bonds",()=>{
 assert.equal(MOLECULES_R04.length,4);
 assert.equal(Object.keys(molecules).length,4);
 for(const info of MOLECULES_R04){
  const m=molecules[info.id];
  assert.ok(m&&m.cid===info.cid&&m.name===info.name);
  assert.equal(m.a.length,m.p.length);
  assert.ok(m.a.length>=10);
  assert.ok(m.b.length>=10);
  for(const xyz of m.p)assert.ok(xyz.length===3&&xyz.every(Number.isFinite));
  for(const [a,b,order] of m.b)assert.ok(a>=0&&b>=0&&a<m.a.length&&b<m.a.length&&[1,2,3].includes(order));
 }
});
test("Live interactive dashboard is linked from the lab, and displays correct caveats",()=>{
 for(const id of ["species-grid","r4-mass","r4-sex","r4-age","r4-constitution","r4-renal","r4-hepatic","r4-hydration","r4-disease","r4-regimen","r4-3d-species","r4-kidney-3d","r4-body-3d","r4-molecule-3d","r4-exposure-chart","r4-pd-graph","r4-human-graph"]){
  assert.ok(page.includes('id="'+id+'"'),id);
 }
 assert.ok(page.includes("guérison"));
 assert.ok(page.includes("non calibré"));
 assert.ok(script.includes("computeR04"));
 assert.ok(script.includes("setSpecies("));
 assert.ok(visual.includes("pointerdown"));
 assert.ok(css.includes("@media"));
 const main=readFileSync(new URL("index.html",root),"utf8");
 assert.ok(main.includes('href="./species-r04.html"'));
});

test("Les coordonnées SVG n'utilisent jamais le formateur d'affichage français",()=>{
 // fmt() produit « 123,46 » : employé dans un attribut points/d/x/y, il
 // transformait chaque point en quatre coordonnées et la courbe Emax
 // d'engagement SGLT2 s'affichait en dents de scie.
 const app=readFileSync(new URL("src/r04_app.mjs",root),"utf8");
 assert.doesNotMatch(app,/points\.push\([^)]*\bfmt\(/,"coordonnée construite avec fmt()");
 assert.doesNotMatch(app,/fmt\([^)]*\)\s*\+\s*","\s*\+\s*fmt\(/,"paire de coordonnées construite avec fmt()");
 // La courbe doit rester un échantillonnage dense et monotone de C/(IC50+C).
 const ic=2.3,pts=[];
 for(let c=0;c<=10.0001;c+=.1)pts.push(c/(ic+c));
 assert.ok(pts.length>100);
 assert.ok(pts.every((v,i)=>i===0||v>=pts[i-1]),"la courbe Emax doit être monotone croissante");
 assert.equal(Number((3/(ic+3)).toFixed(3)),0.566);
});

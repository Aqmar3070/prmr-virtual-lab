import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {SPECIES_ANATOMY,SPECIES_IDS,ORGAN_IDS,ORGAN_MODES,organAssessment} from "../src/r09_organ_catalog.mjs";
import {makeSpeciesGroups,disposeOrganGroup} from "../src/r09_organ_geometry.mjs";
test("R09: 6 species own 7 separately rotatable volumetric 3D organ groups",()=>{
 assert.equal(SPECIES_IDS.length,6);assert.equal(ORGAN_IDS.length,7);
 assert.equal(Object.keys(ORGAN_MODES).length,8);
 for(const species of SPECIES_IDS){
  const s=makeSpeciesGroups(species);
  assert.deepEqual(Object.keys(s.organs).sort(),[...ORGAN_IDS].sort());
  assert.ok(s.body.children.length>5,species+" body is a 3D mesh, not a 2D poster");
  for(const [id,g]of Object.entries(s.organs)){
   let surfaces=0,vertices=0;
   g.traverse(node=>{if(node.isMesh){surfaces++;vertices+=node.geometry.getAttribute("position").count}});
   assert.ok(surfaces>0&&vertices>200,id+" in "+species+" must own polygonal 3D geometry");
   assert.equal(g.userData.source,"procedural-anatomical-hypothesis");
  }
  for(const g of Object.values(s.organs))disposeOrganGroup(g);
  disposeOrganGroup(s.body);
 }
});
test("R09: species-specific anatomical distinctions are explicit",()=>{
 assert.equal(SPECIES_ANATOMY.rat.gallbladder,false,"Rat has no gallbladder");
 assert.equal(SPECIES_ANATOMY.mouse.gallbladder,true);
 assert.equal(SPECIES_ANATOMY.rabbit.gallbladder,true,"Rabbit has a gallbladder");
 assert.equal(SPECIES_ANATOMY.pig.kidney,"multipapillary");
 assert.equal(SPECIES_ANATOMY.mouse.kidney,"unipapillary");
 for(const x of ["mouse","rat","rabbit"])assert.equal(SPECIES_ANATOMY[x].brain,"smooth");
 assert.equal(SPECIES_ANATOMY.pig.cecum,"spiral-colon");
 assert.equal(SPECIES_ANATOMY.rabbit.cecum,"very-large");
});
test("R09: all-organ visualization and interest colors never invent confirmed injuries",()=>{
 const x=organAssessment({disease:"diabetic",renal:"severe",hepatic:"moderate"});
 assert.ok(x.active.includes("kidneys")&&x.active.includes("pancreas")&&x.active.includes("heart"));
 assert.equal(x.attention.kidneys,"severe");assert.equal(x.attention.liver,"moderate");
 assert.equal(x.illustrative,true);assert.match(x.disclaimer,/pas localisation diagnostique/);
 const y=organAssessment({disease:"fibrotic",renal:"normal",hepatic:"normal"});
 assert.equal(y.attention.kidneys,"context");
});
test("R09: imported canine real organ meshes have immutable upstream sources and are not substitutes for other species",()=>{
 const manifest=JSON.parse(readFileSync(new URL("../assets/vet3d/manifest.json",import.meta.url)));
 assert.ok(existsSync(new URL("../assets/vet3d/dog-visceral.glb",import.meta.url)));
 const item=manifest["dog-visceral.glb"];
 assert.equal(item.upstream_blob_sha,"5b34701bc790a0c78aeab39736d42ac11ca96458");
 assert.ok(item.nodes.some(x=>x.includes("kidneys")));
 assert.ok(item.nodes.some(x=>x.includes("brain")));
 assert.ok(item.nodes.some(x=>x.includes("heart")));
 assert.ok(item.nodes.some(x=>x.includes("liver")));
 assert.ok(item.nodes.some(x=>x.includes("lungs")));
 const viewer=readFileSync(new URL("../src/r09_viewer.mjs",import.meta.url),"utf8");
 assert.match(viewer,/GLTFLoader/);assert.match(viewer,/canine-CT-derived-hybrid-GLB/);
 assert.match(viewer,/setIsolated/);assert.match(viewer,/setBodyVisible/);assert.match(viewer,/setLinksVisible/);
 assert.match(viewer,/onOrganPick/);assert.match(viewer,/getContext|WebGLRenderer/);
});

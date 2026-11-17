import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ORGAN_MODES,ANATOMY_SPECIES,rotatePoint,organDefinitions} from "../src/r08_anatomy.mjs";
const base=new URL("../",import.meta.url);
const file=readFileSync(new URL("src/r08_anatomy.mjs",base),"utf8");
const atlas=readFileSync(new URL("src/r04_atlas.mjs",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
const css=readFileSync(new URL("r04-atlas.css",base),"utf8");
test("R08 provides six distinct transparent body meshes and four internal organ types",()=>{
 assert.deepEqual(Object.keys(ANATOMY_SPECIES).sort(),["dog","mouse","nhp","pig","rabbit","rat"]);
 assert.deepEqual(Object.keys(ORGAN_MODES).sort(),["all","heart","kidneys","liver","lungs"]);
 const b=ANATOMY_SPECIES.mouse.body,p=ANATOMY_SPECIES.pig.body;
 assert.notDeepEqual(b,p,"Species cannot all share the same silhouette");
 for(const id of Object.keys(ANATOMY_SPECIES)){
  assert.equal(organDefinitions(id,"kidneys").filter(x=>x.selected).length,2,id);
  assert.equal(organDefinitions(id,"heart").filter(x=>x.selected).length,1,id);
  assert.equal(organDefinitions(id,"liver").filter(x=>x.selected).length,1,id);
  assert.equal(organDefinitions(id,"lungs").filter(x=>x.selected).length,2,id);
  assert.equal(organDefinitions(id,"all").filter(x=>x.selected).length,6,id);
 }
});
test("Projection is mathematically three-dimensional, not a rotated PNG",()=>{
 const a=rotatePoint([1,2,3],0,0);
 assert.ok(a.every((v,i)=>Math.abs(v-[1,2,3][i])<1e-12));
 const b=rotatePoint([1,2,3],Math.PI/2,0);
 assert.ok(Math.abs(b[0]-3)<1e-12);
 assert.ok(Math.abs(b[2]+1)<1e-12);
 const c=rotatePoint([1,2,3],0,Math.PI/2);
 assert.ok(Math.abs(c[1]+3)<1e-12);
 assert.ok(Math.abs(c[2]-2)<1e-12);
});
test("Anatomy canvas has self-contained rendering, zoom and robust no-WebGL fallback",()=>{
 assert.match(file,/getContext\("2d"/);
 assert.match(file,/requestAnimationFrame/);
 assert.match(file,/renderScene\(ctx/);
 assert.match(file,/wire\(ctx/);
 assert.match(file,/organSurface/);
 assert.match(file,/ResizeObserver/);
 assert.match(file,/addEventListener\(event,cb/);
 assert.match(file,/mouse|rabbit/);
 assert.ok(!file.includes("fetch("),"Anatomy viewer must be asset/network-independent");
 assert.ok(!file.includes("getContext(\"webgl\""));
 assert.match(atlas,/r8-anatomy-fallback/);
 assert.match(atlas,/dataset.organ/);
 assert.match(atlas,/onOrganChange/);
 assert.match(app,/createAnatomyViewer/);
 assert.match(css,/r8-anatomy-canvas/);
});
test("Visual organ selection does not invent pathology or change R04 PK/PD engine",()=>{
 assert.match(file,/no anatomical calibration|not validated morphometric data|schematics|not calibrated/i);
 assert.match(atlas,/jamais lésion confirmée|pas des lésions diagnostiquées/);
 assert.ok(atlas.includes("onEdit"));
 assert.ok(!file.includes("computeR04("));
 assert.ok(!file.includes("probability_cure"));
});

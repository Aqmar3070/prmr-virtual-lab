import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {SPECIES_R04,DEFAULT_R04,computeR04,MOLECULES_R04} from "../src/r04_engine.mjs";
import {ANIMAL_ART} from "../src/r04_atlas.mjs";
const base=new URL("../",import.meta.url);
const atlas=readFileSync(new URL("src/r04_atlas.mjs",base),"utf8");
const css=readFileSync(new URL("r04-atlas.css",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
const webgl=readFileSync(new URL("src/r05_animal3d.mjs",base),"utf8");
test("Six independent SVG animal assets replace every cropped poster",()=>{
 assert.equal(SPECIES_R04.length,6);
 for(const s of SPECIES_R04){
  const path="assets/animals/"+s.id+".svg";
  assert.equal(ANIMAL_ART[s.id],"./"+path);
  assert.ok(existsSync(new URL(path,base)),s.id);
  const data=readFileSync(new URL(path,base),"utf8");
  assert.match(data,/<svg [^>]*viewBox="0 0 840 560"/);
  assert.ok(!/<text[\s>]/i.test(data),s.id+" must have no embedded text");
  assert.ok(!/background-size|poster-gallery|Wikimedia|\\.png/i.test(data));
  assert.ok(data.length>2000);
 }
 assert.ok(!/assets\/illustrations\/r04/.test(css));
 assert.ok(!/background-size:\s*(?:\d{3}%)/.test(css));
 assert.match(css,/object-fit:contain/);
 assert.ok(atlas.includes(".svg"));
});
test("Text labels are native, separate and responsive",()=>{
 assert.ok(atlas.includes('class="r5-animal-asset"')||atlas.includes('"r5-animal-asset"'));
 assert.ok(atlas.includes('"r4-st-portrait-label"'));
 assert.ok(css.includes(".r4-st-portrait-label{display:flex"));
 assert.match(css,/overflow-wrap:break-word/);
 assert.ok(css.includes("@media(max-width:520px)"));
 assert.ok(css.includes("@media(max-width:780px)"));
});
test("True GPU animal viewer, species-specific meshes and fallback",()=>{
 assert.match(atlas,/createPhotoAnimalViewer/);
 assert.ok(atlas.includes("assets/animals-photo/"));
 assert.ok(atlas.includes("sculpture.set({species:id})"));
 assert.match(atlas,/r5-webgl-active/);
 assert.ok(atlas.includes("phototexturées"));
 assert.ok(atlas.includes("non anatomiquement validés"));
 assert.match(webgl,/createShader/);
 assert.ok(webgl.includes("gl.drawArrays(gl.TRIANGLES"));
 assert.match(webgl,/pointermove/);
 assert.match(webgl,/IntersectionObserver/);
 assert.match(webgl,/supported:false/);
 assert.ok(app.includes('createAnimalSculpture($("r4-body-3d")'));
});
test("Shared physiological state, unknown probabilities and molecular 3D remain intact",()=>{
 for(const key of ["age","sex","disease","renal"])assert.ok(atlas.includes('["'+key+'"'));
 assert.match(atlas,/onEdit/);
 assert.ok(app.includes("atlas?.render(result)"));
 assert.match(app,/onChoose:setSpecies/);
 assert.equal(MOLECULES_R04.length,4);
 assert.match(atlas,/kind:"molecule"/);
 const model=computeR04(DEFAULT_R04);
 assert.equal(model.probability_toxicity,null);
 assert.equal(model.probability_cure,null);
});

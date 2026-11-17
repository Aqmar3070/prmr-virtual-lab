import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const base=new URL("../",import.meta.url);
const r04=readFileSync(new URL("species-r04.html",base),"utf8");
const r03=readFileSync(new URL("risk-r03.html",base),"utf8");
const r02=readFileSync(new URL("screening.html",base),"utf8");
const r01=readFileSync(new URL("preclinical.html",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
const embedded=readFileSync(new URL("src/r04_embedded.mjs",base),"utf8");
test("Previous pasted poster galleries have been removed",()=>{
 assert.ok(!r04.includes('id="r4-original-gallery"'));
 assert.ok(!r04.includes('r4-poster-gallery'));
 assert.ok(!r04.includes('r04-gallery.css'));
 assert.ok(!r03.includes('id="r03-original-poster"'));
 assert.ok(!r03.includes('<figure class="r4-original-poster"'));
 assert.match(r04,/id="r4-visual-atlas"/);
 assert.ok(r04.includes("src=\"./src/r04_app.mjs?v=r09-real-organ-scenes-20261117\""));
});
test("Every user-facing research interface uses the same integrated workstation",()=>{
 for(const [file,id] of [["index.html","r5-home-stage"],["research.html","r5-home-stage"],["risk-r03.html","r5-risk-stage"],["screening.html","r5-screening-stage"],["preclinical.html","r5-preclinical-stage"]]){
  const body=readFileSync(new URL(file,base),"utf8");
  assert.ok(body.includes('id="'+id+'"'),file);
  assert.ok(body.includes("r04-atlas.css"),file);
  assert.ok(body.includes("src/r04_embedded.mjs"),file);
 }
 assert.ok(embedded.includes("r5-home-stage"));
 assert.ok(embedded.includes("r5-risk-stage"));
 assert.ok(embedded.includes("r5-screening-stage"));
 assert.ok(embedded.includes("r5-preclinical-stage"));
});
test("Home route enters a functional species and molecule workbench",()=>{
 for(const file of ["index.html","research.html"]){
  const h=readFileSync(new URL(file,base),"utf8");
  assert.match(h,/Molécules en 3D/);
  assert.match(h,/r5-home-stage/);
  assert.ok(!h.includes("r4-home-promo"));
  assert.ok(!h.includes("galerie placardée"));
 }
 assert.ok(app.includes("function setSpecies("));
 assert.ok(app.includes("initMolecules()"));
});
test("Original illustrations remain available as source material, not standalone gallery",()=>{
 for(const name of ["comparaison-especes.png","porc.png","chien.png","primate.png","lapin.png","tableau-pkpd.png"]){
  assert.ok(existsSync(new URL("assets/illustrations/r04/"+name,base)),name);
 }
});

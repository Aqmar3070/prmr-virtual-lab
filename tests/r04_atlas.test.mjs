import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SPECIES_R04,DEFAULT_R04,computeR04} from "../src/r04_engine.mjs";
const base=new URL("../",import.meta.url);
const manifest=JSON.parse(readFileSync(new URL("research-data/r04_animal_portraits.json",base),"utf8"));
const html=readFileSync(new URL("species-r04.html",base),"utf8");
const js=readFileSync(new URL("src/r04_atlas.mjs",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
const css=readFileSync(new URL("r04-atlas.css",base),"utf8");

test("Visual atlas has all six species with credited CC image sources",()=>{
 assert.equal(manifest.version,"r04-visual-atlas-v1");
 assert.equal(Object.keys(manifest.sources).length,6);
 for(const s of SPECIES_R04){
  const doc=manifest.sources[s.id];
  assert.ok(doc,s.id);
  assert.ok(doc.src.startsWith("https://"),s.id);
  assert.ok(doc.page.startsWith("https://commons.wikimedia.org/wiki/File:"),s.id);
  assert.ok(doc.credit.length>3);
  assert.match(doc.license,/CC/i);
  assert.ok(doc.note.length>10);
  assert.ok(doc.anatomy.length>10);
 }
});
test("Reference poster is not misrepresented as actual uploaded generated art",()=>{
 assert.match(manifest.status,/pas les affiches générées/);
 assert.match(js,/Photographies réelles sourcées/);
 assert.match(js,/schémas rénaux conceptuels/);
 assert.match(js,/Barres qualitatives/);
 assert.ok(!js.includes("probabilité de guérison : 100"));
});
test("Species cards and live simulation share one state",()=>{
 assert.match(html,/id="r4-visual-atlas"/);
 assert.match(html,/href="\.\/r04-atlas\.css"/);
 assert.match(app,/createVisualAtlas/);
 assert.match(app,/atlas\?\.render\(result\)/);
 assert.match(app,/onChoose:setSpecies/);
 assert.match(js,/btn\.addEventListener\("click",\(\)=>onChoose\(s\.id\)\)/);
 const adult=computeR04(DEFAULT_R04);
 assert.equal(adult.probability_toxicity,null);
 assert.equal(adult.probability_cure,null);
});
test("R04 gallery is responsive and image failure is handled",()=>{
 assert.match(css,/@media\(max-width:550px\)/);
 assert.match(css,/@media\(max-width:1180px\)/);
 assert.match(js,/img\.onerror/);
 assert.match(js,/big\.onerror/);
 assert.match(js,/source Wikimedia Commons/);
});

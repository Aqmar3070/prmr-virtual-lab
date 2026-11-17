import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {SPECIES_R04,DEFAULT_R04,computeR04,MOLECULES_R04} from "../src/r04_engine.mjs";
const base=new URL("../",import.meta.url);
const atlas=readFileSync(new URL("src/r04_atlas.mjs",base),"utf8");
const css=readFileSync(new URL("r04-atlas.css",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
test("Six PRMR poster animals replace Wikimedia photographs in main UI",()=>{
 for(const name of ["comparaison-especes.png","porc.png","chien.png","primate.png","lapin.png"]){
  assert.ok(atlas.includes(name));
  assert.ok(existsSync(new URL("assets/illustrations/r04/"+name,base)));
  assert.ok(css.includes(name));
 }
 assert.equal(SPECIES_R04.length,6);
 assert.ok(!atlas.includes("Wikimedia Commons"));
 assert.ok(!atlas.includes("Photographies réelles sourcées"));
 assert.match(atlas,/r4-st-species-card/);
 assert.match(atlas,/r4-st-portrait/);
});
test("The integrated workbench shares species, physiology and molecular state",()=>{
 for(const key of ["age","sex","disease","renal"])assert.ok(atlas.includes('["'+key+'"'),key);
 assert.match(atlas,/createVisualAtlas/);
 assert.match(atlas,/onChoose\(sp\.id\)/);
 assert.match(atlas,/onEdit/);
 assert.match(atlas,/\.render\(result\)/);
 assert.match(app,/atlas\?\.render\(result\)/);
 assert.match(app,/onChoose:setSpecies/);
 assert.match(app,/onEdit:patch/);
 const a=computeR04(DEFAULT_R04);
 assert.equal(a.probability_toxicity,null);
 assert.equal(a.probability_cure,null);
});
test("Molecules are displayed as real canvas-based 3D conformers",()=>{
 assert.ok(atlas.includes("create3D("));
 assert.ok(atlas.includes('kind:"molecule"'));
 assert.ok(atlas.includes('research-data/r04_molecular_3d.json'));
 assert.equal(MOLECULES_R04.length,4);
 assert.ok(app.includes('className="r4-molecule-thumb3d"'));
 assert.ok(!app.includes("rest/pug/compound/cid/"));
});
test("New architecture has mobile layout and preserves scientific provenance",()=>{
 assert.match(css,/@media\(max-width:530px\)/);
 assert.match(css,/@media\(max-width:1100px\)/);
 assert.match(atlas,/non validés biologiquement|NON VALIDÉS BIOLOGIQUEMENT/);
 assert.match(atlas,/indéterminé/i);
 assert.match(atlas,/pas toxicité/);
 assert.ok(!atlas.includes("probabilité de guérison : 100"));
});

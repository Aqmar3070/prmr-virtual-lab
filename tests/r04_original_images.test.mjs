import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
const base=fileURLToPath(new URL("../assets/illustrations/r04/",import.meta.url));
const manifest=JSON.parse(readFileSync(join(base,"manifest.json"),"utf8"));
const atlas=readFileSync(new URL("../src/r04_atlas.mjs",import.meta.url),"utf8");
const style=readFileSync(new URL("../r04-atlas.css",import.meta.url),"utf8");
test("Six original image assets are integrated as imagery, not as pasted posters",()=>{
 const names=Object.keys(manifest.files);
 assert.deepEqual(names.sort(),["chien.png","comparaison-especes.png","lapin.png","porc.png","primate.png","tableau-pkpd.png"].sort());
 for(const filename of ["comparaison-especes.png","porc.png","chien.png","primate.png","lapin.png"]){
  assert.ok(atlas.includes(filename),filename);
  assert.ok(style.includes(filename),filename);
 }
 assert.ok(style.includes(".r4-st-portrait"));
 assert.ok(style.includes(".r4-st-art"));
 assert.ok(!style.includes(".r4-poster-gallery"));
});
test("Original PNG files match archival SHA256; their artistic scores are not biological evidence",()=>{
 for(const [name,expected] of Object.entries(manifest.files)){
  assert.ok(existsSync(join(base,name)),name+" is missing");
  const data=readFileSync(join(base,name));
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name);
  assert.equal(createHash("sha256").update(data).digest("hex"),expected,name);
 }
});

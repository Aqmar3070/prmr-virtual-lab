import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
const base=fileURLToPath(new URL("../assets/illustrations/r04/",import.meta.url));
const manifest=JSON.parse(readFileSync(join(base,"manifest.json"),"utf8"));
test("Original PRMR illustrations remain archived faithfully but are no longer cropped in UI",()=>{
 const names=Object.keys(manifest.files);
 assert.equal(names.length,6);
 for(const [name,expected] of Object.entries(manifest.files)){
  assert.ok(existsSync(join(base,name)),name);
  const data=readFileSync(join(base,name));
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(createHash("sha256").update(data).digest("hex"),expected,name);
 }
 const css=readFileSync(new URL("../r04-atlas.css",import.meta.url),"utf8");
 const atlas=readFileSync(new URL("../src/r04_atlas.mjs",import.meta.url),"utf8");
 assert.ok(!css.includes("assets/illustrations/r04/"));
 assert.ok(!atlas.includes("comparaison-especes.png"));
 assert.ok(!atlas.includes("porc.png"));
});

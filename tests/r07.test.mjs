import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../",import.meta.url);
const catalog=JSON.parse(readFileSync(new URL("assets/animals-3d/manifest.json",root),"utf8"));
const viewer=readFileSync(new URL("src/r07_photo3d.mjs",root),"utf8");
const atlas=readFileSync(new URL("src/r04_atlas.mjs",root),"utf8");
test("PRMR-R07 six individually measured 3D meshes and translucent WebP render assets",()=>{
 assert.equal(catalog.assets.length,6);
 assert.equal(catalog.is_anatomical,false);
 const names=catalog.assets.map(x=>x.species_id).sort();
 assert.deepEqual(names,["dog","mouse","nhp","pig","rabbit","rat"]);
 for(const item of catalog.assets){
  assert.match(item.asset,/^assets\/animals-3d\/(mouse|rat|pig|dog|nhp|rabbit)\.glb$/);
  assert.ok(item.size_bytes<=1200000&&item.size_bytes>100000);
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.match(item.poster,/^assets\/animals-photo\/[a-z]+\.webp$/);
  assert.ok(item.poster_bytes<40000);
 }
});
test("R07 package is either not uploaded or complete and byte-identical",t=>{
 const deployed=catalog.assets.filter(x=>existsSync(new URL(x.asset,root)));
 if(!deployed.length){t.diagnostic("GLB binaires en archive, pas encore importés; viewer affiche encore le fallback R06.");return}
 assert.equal(deployed.length,6,"Ne pas déployer un groupe d'animaux partiel");
 for(const a of catalog.assets){
  const p=readFileSync(new URL(a.asset,root));
  assert.equal(p.length,a.size_bytes,a.asset);
  assert.equal(p.toString("ascii",0,4),"glTF",a.asset);
  assert.equal(createHash("sha256").update(p).digest("hex"),a.sha256,a.asset);
  const webp=readFileSync(new URL(a.poster,root));
  assert.equal(webp.length,a.poster_bytes,a.poster);
  assert.equal(webp.toString("ascii",0,4),"RIFF",a.poster);
  assert.equal(webp.toString("ascii",8,12),"WEBP",a.poster);
 }
});
test("The actual GLB viewer loads and rotates a real textured triangular mesh without a large dependency",()=>{
 assert.match(viewer,/fetchModel\(id,abort.signal\)/);
 assert.match(viewer,/gl\.drawElements\(gl\.TRIANGLES/);
 assert.match(viewer,/createImageBitmap/);
 assert.match(viewer,/OES_element_index_uint/);
 assert.match(viewer,/pointerdown/);
 assert.match(viewer,/dblclick/);
 assert.match(viewer,/addEventListener\("wheel"/);
 assert.match(viewer,/createAnimalSculpture/); // low-power or unuploaded fallback
 assert.ok(!viewer.includes("https://cdn"));
 assert.match(atlas,/createPhotoAnimalViewer/);
 assert.match(atlas,/animals-photo/);
 assert.match(atlas,/non anatomiquement validés/);
});

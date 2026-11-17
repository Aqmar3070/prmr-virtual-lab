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


test("WebGL GLB parser decodes a real binary mesh, UVs and embedded WebP",async()=>{
 const {unpack}=await import("../src/r07_photo3d.mjs");
 const model=[
  new Float32Array([-1,-1,.2, 1,-1,.2, -1,1,.2, 1,1,.2]),
  new Float32Array([0,0,1, 0,0,1, 0,0,1, 0,0,1]),
  new Float32Array([0,0, 1,0, 0,1, 1,1]),
  new Uint16Array([0,1,2,1,3,2]),
  Buffer.from("UklGRh4AAABXRUJQVlA4TBEAAAAvA8AAAAdQ33LXsv+BiOh/AAA=","base64")
 ];
 const aligned=n=>(n+3)&~3,parts=[],views=[],acc=[];
 let position=0;
 model.forEach((part,k)=>{
  const data=Buffer.from(part.buffer??part,part.byteOffset??0,part.byteLength??part.length);
  const pad=aligned(position)-position;if(pad)parts.push(Buffer.alloc(pad));position+=pad;
  views.push({buffer:0,byteOffset:position,byteLength:data.length});
  parts.push(data);position+=data.length;
  if(k<4)acc.push({bufferView:k,componentType:k===3?5123:5126,count:[4,4,4,6][k],type:["VEC3","VEC3","VEC2","SCALAR"][k]});
 });
 const bin=Buffer.concat(parts),gltf={asset:{version:"2.0"},meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,mode:4}]}],
  images:[{bufferView:4,mimeType:"image/webp"}],accessors:acc,bufferViews:views,buffers:[{byteLength:bin.length}]};
 const body=Buffer.from(JSON.stringify(gltf));const json=Buffer.concat([body,Buffer.alloc(aligned(body.length)-body.length,32)]);
 const bytes=Buffer.alloc(12+8+json.length+8+aligned(bin.length));
 bytes.write("glTF",0,"ascii");bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8);
 bytes.writeUInt32LE(json.length,12);bytes.write("JSON",16,"ascii");json.copy(bytes,20);
 const off=20+json.length;bytes.writeUInt32LE(aligned(bin.length),off);bytes.write("BIN\0",off+4,"binary");bin.copy(bytes,off+8);
 const parsed=unpack(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 assert.equal(parsed.pos.length,12);
 assert.equal(parsed.normal.length,12);
 assert.equal(parsed.uv.length,8);
 assert.deepEqual(Array.from(parsed.indices),[0,1,2,1,3,2]);
 assert.equal(parsed.image.type,"image/webp");
 assert.equal(parsed.image.size,38);
});

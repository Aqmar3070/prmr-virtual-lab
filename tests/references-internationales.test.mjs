import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";

const bytes=name=>readFileSync(new URL("../research-data/"+name,import.meta.url));
const json=name=>JSON.parse(bytes(name));

test("Chaque fiche PRMR renvoie aux rubriques publiées des deux organismes",()=>{
 const refs=json("references-maladies.json"),msd=new Set(json("msd-sujets-fr.json"));
 const cim=JSON.parse(gunzipSync(bytes("cim11-fr-2026-01.json.gz")));
 const categories=new Map(cim.map(([code,title,,fragment])=>[code,[title,fragment]]));
 const oms=new Set(json("oms-reperes-fr.json").map(([,slug])=>slug));
 assert.deepEqual(Object.keys(refs).sort(),json("maladies.json").maladies.map(m=>m.id).sort());
 for(const r of Object.values(refs)){
  assert.ok(r.msd.length&&r.cim.length);
  for(const [titre,path] of r.msd){assert.ok(titre);assert.ok(msd.has(path));}
  if(r.oms)assert.ok(oms.has(r.oms[1]),r.oms[1]);
  for(const [code,titre,fragment] of r.cim){
   assert.match(fragment,/^\d+(?:\/mms\/(?:other|unspecified))?$/);
   if(code)assert.deepEqual(categories.get(code),[titre,fragment]);
  }
 }
});

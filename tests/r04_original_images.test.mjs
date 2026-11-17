import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {join,dirname} from "node:path";
const base=fileURLToPath(new URL("../assets/illustrations/r04/",import.meta.url));
const manifest=JSON.parse(readFileSync(join(base,"manifest.json"),"utf8"));
const atlas=readFileSync(new URL("../src/r04_atlas.mjs",import.meta.url),"utf8");
const r03=readFileSync(new URL("../risk-r03.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../r04-atlas.css",import.meta.url),"utf8");
test("Six original dashboard illustrations have deterministic reserved asset locations",()=>{
 const names=Object.keys(manifest.files);
 assert.deepEqual(names.sort(),["chien.png","comparaison-especes.png","lapin.png","porc.png","primate.png","tableau-pkpd.png"].sort());
 assert.ok(atlas.includes('mouse:"comparaison-especes.png"'));
 assert.ok(atlas.includes('rat:"comparaison-especes.png"'));
 for(const name of ["porc.png","chien.png","primate.png","lapin.png"])assert.ok(atlas.includes(name));
 assert.ok(r03.includes("./assets/illustrations/r04/tableau-pkpd.png"));
 assert.ok(css.includes(".r4-original-poster"));
});
test("Uploaded original PNGs match archival SHA256 exactly, when present",(t)=>{
 const present=Object.keys(manifest.files).filter(name=>existsSync(join(base,name)));
 if(!present.length){t.diagnostic("Les images binaires originales ne sont pas encore sur GitHub : le tableau de bord utilise son atlas interactif de remplacement.");return;}
 assert.equal(present.length,6,"Ne pas mélanger quelques maquettes et le reste : importer les six PNG");
 for(const [name,digest] of Object.entries(manifest.files)){
  const bytes=readFileSync(join(base,name));
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name+" n'est pas un PNG");
  assert.equal(createHash("sha256").update(bytes).digest("hex"),digest,"Original attendu non conforme : "+name);
 }
});

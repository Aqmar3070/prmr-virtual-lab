import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {filtrer,departager,urgence,zonesDe,chercher} from "../src/symptomes.mjs";
const data=JSON.parse(readFileSync(new URL("../research-data/symptomes.json",import.meta.url)));
const registre=JSON.parse(readFileSync(new URL("../research-data/maladies.json",import.meta.url)));
const msd=new Set(JSON.parse(readFileSync(new URL("../research-data/msd-sujets-fr.json",import.meta.url))));
const ids=new Set(data.symptomes.map(s=>s.id));

test("Données : symptômes connus, zones 3D, fiches et sources valides",()=>{
 assert.ok(data.maladies.length>=200);
 for(const s of data.symptomes)assert.ok(s.zones.length&&data.groupes.includes(s.groupe),s.id);
 for(const m of data.maladies){
  for(const s of m.symptomes)assert.ok(ids.has(s),m.id+" "+s);
  if(m.msd)assert.ok(msd.has(m.msd),m.id);
  assert.equal(m.fiche,registre.maladies.some(x=>x.id===m.id),m.id);
 }
 for(const m of registre.maladies)assert.ok(data.maladies.some(x=>x.id===m.id),"fiche sans symptômes : "+m.id);
});

test("Classement par symptômes communs : jamais vide à cause d'un symptôme atypique",()=>{
 const ids=r=>r.map(x=>x.m.id);
 const tete=ids(filtrer(data,new Set(["cephalee"]),"male"));
 for(const id of ["migraine","angiome_cerebral","meningite","paludisme","grippe","cephalee_tension"])assert.ok(tete.includes(id),id);
 const trois=filtrer(data,new Set(["cephalee","photophobie","raideur_nuque"]),"male");
 assert.equal(trois[0].absents.length,0);assert.ok(ids(trois.filter(r=>!r.absents.length)).includes("meningite"));
 assert.ok(ids(trois).indexOf("meningite")<ids(trois).indexOf("grippe"));
 // Paludisme + toux : la toux n'est pas dans la fiche, le paludisme reste proposé avec 2 symptômes sur 3.
 const palu=filtrer(data,new Set(["fievre","frissons","toux"]),"male").find(r=>r.m.id==="paludisme");
 assert.ok(palu);assert.deepEqual(palu.absents,["toux"]);
});

test("Sexe, départage, urgence, zones, recherche",()=>{
 assert.ok(!filtrer(data,new Set(["douleur_pelvienne"]),"male").some(r=>r.m.id==="endometriose"));
 assert.ok(filtrer(data,new Set(["douleur_pelvienne"]),"female").some(r=>r.m.id==="endometriose"));
 const r=filtrer(data,new Set(["fievre"]),"male");assert.ok(r.every(x=>x.communs.length===1));const d=departager(r,new Set(["fievre"]));
 assert.ok(d.length>0&&!d.includes("fievre"));
 assert.ok(urgence(data,new Set(["fievre","raideur_nuque"])));assert.ok(!urgence(data,new Set(["fievre"])));
 assert.ok(zonesDe(data,new Set(["cephalee"])).includes("brain"));
 assert.ok(chercher(data,"nuque").some(s=>s.id==="raideur_nuque"));
});

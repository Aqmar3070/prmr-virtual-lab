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

test("Un symptôme montre toutes ses maladies ; chaque ajout réduit la liste",()=>{
 const tete=filtrer(data,new Set(["cephalee"]),"male").map(m=>m.id);
 for(const id of ["migraine","angiome_cerebral","meningite","paludisme","grippe","cephalee_tension"])assert.ok(tete.includes(id),id);
 const deux=filtrer(data,new Set(["cephalee","photophobie"]),"male").map(m=>m.id);
 assert.ok(deux.length<tete.length&&deux.includes("migraine")&&!deux.includes("grippe"));
 const trois=filtrer(data,new Set(["cephalee","photophobie","raideur_nuque"]),"male").map(m=>m.id);
 assert.ok(trois.includes("meningite")&&!trois.includes("migraine"));
});

test("Sexe, départage, urgence, zones, recherche",()=>{
 assert.ok(!filtrer(data,new Set(["douleur_pelvienne"]),"male").some(m=>m.id==="endometriose"));
 assert.ok(filtrer(data,new Set(["douleur_pelvienne"]),"female").some(m=>m.id==="endometriose"));
 const r=filtrer(data,new Set(["fievre"]),"male");const d=departager(r,new Set(["fievre"]));
 assert.ok(d.length>0&&!d.includes("fievre"));
 assert.ok(urgence(data,new Set(["fievre","raideur_nuque"])));assert.ok(!urgence(data,new Set(["fievre"])));
 assert.ok(zonesDe(data,new Set(["cephalee"])).includes("brain"));
 assert.ok(chercher(data,"nuque").some(s=>s.id==="raideur_nuque"));
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {regions,rules,urgence,correspondances} from "../src/symptomes-registre.mjs";
test("Chaque fiche et chaque signe de la grille existent",()=>{
 const registry=JSON.parse(readFileSync(new URL("../research-data/maladies.json",import.meta.url)));
 const terms=Object.values(regions).flatMap(group=>Object.values(group).flatMap(t=>t.split("|")));
 for(const rule of rules){
  assert.ok(registry.maladies.some(m=>m.id===rule.id),rule.id);
  for(const s of rule.terms)assert.ok(terms.includes(s),s);
 }
});
test("Les paresthésies ne suffisent pas à conclure à un diabète ou une sciatique",()=>{
 const s=new Set(["Fourmillements des pieds","Engourdissement des pieds"]);
 assert.deepEqual(correspondances(s),[]);
 assert.equal(correspondances(s,"Oui")[0].id,"neuropathie_diabetique");
 assert.ok(urgence(new Set(["Raideur de nuque","Fièvre"])));
});

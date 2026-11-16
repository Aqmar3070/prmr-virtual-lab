import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const raw=readFileSync(new URL("../research-data/prmr-r02-screen.json",import.meta.url),"utf8");
const model=JSON.parse(raw);
const page=readFileSync(new URL("../screening.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const previous=readFileSync(new URL("../preclinical.html",import.meta.url),"utf8");

test("PRMR-R02 screen counts and full combination enumeration are consistent",()=>{
 assert.equal(model.molecules.length,10);
 assert.equal(model.combinations.length,165);
 assert.equal(model.combinations.filter(x=>x.n_agents===2).length,45);
 assert.equal(model.combinations.filter(x=>x.n_agents===3).length,120);
 assert.equal(model.combinations.filter(x=>x.status==="hypothese_in_silico").length,44);
 assert.equal(model.combinations.filter(x=>x.status==="suspendue").length,121);
 assert.equal(new Set(model.combinations.map(x=>x.indices.join("-"))).size,165);
});

test("each unrestricted research hypothesis has distinct pharmacological classes",()=>{
 for(const c of model.combinations.filter(x=>x.status==="hypothese_in_silico")){
   assert.equal(new Set(c.indices.map(i=>model.molecules[i].class_code)).size,c.n_agents);
   assert.ok(!c.agents.includes("Éplérénone"));
   assert.ok(!c.agents.includes("Allopurinol"));
   assert.ok(!c.agents.includes("Paricalcitol"));
 }
});

test("screen has source identities, no invented experiments and visible warning",()=>{
 assert.ok(page.includes("./research-data/prmr-r02-screen.json"));
 assert.ok(page.includes("Aucun animal n'a été utilisé"));
 assert.ok(page.includes("guérison"));
 for(const c of model.combinations){
   assert.equal(c.experimental_efficacy_measured,false);
   assert.equal(c.synergy_predicted,false);
   assert.equal(c.cure_predicted,false);
 }
 for(const drug of model.molecules){
  assert.ok(drug.pubchem_url.includes(String(drug.cid)));
  assert.ok(drug.smiles.length>0);
 }
});

test("RDKit screening anchors match frozen calculation",()=>{
 const getCombo=(names)=>model.combinations.find(c=>names.every(n=>c.agents.includes(n))&&c.agents.length===names.length);
 assert.equal(getCombo(["Irbesartan","Dapagliflozine","Pirfénidone"]).priority_index,4.829);
 assert.equal(getCombo(["Irbesartan","Dapagliflozine","Pentoxifylline"]).priority_index,4.780);
 assert.equal(model.molecules.find(m=>m.name==="Pirfénidone").mass_g_mol,185.23);
 assert.equal(model.molecules.find(m=>m.name==="Pentoxifylline").mass_g_mol,278.31);
 assert.equal(model.pairwise_tanimoto_upper.length,9);
 assert.equal(model.pairwise_tanimoto_upper[0].length,9);
});

test("new user-facing research section is linked to the existing lab",()=>{
 assert.ok(main.includes('href="./screening.html"'));
 assert.ok(previous.includes('href="./screening.html"'));
});

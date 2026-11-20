import test from "node:test";
import assert from "node:assert/strict";
import {build,SPECIES,ANCHORS,RENAL,HEPATIC,HYDRATION,REGIMENS,massFactor,sglt2Inhibition} from "../src/r03_model.mjs";
import {readFileSync} from "node:fs";
const r=build();
test("Core profile enumeration covers rodent species, masses and renal hepatic hydration states",()=>{
 assert.equal(SPECIES.length,2);
 assert.equal(r.cohorts_count,2*3*4*3*2);
 assert.equal(r.profiles.length,144);
 assert.ok(r.profiles.every(p=>p.exposure_regimens.length===3));
 assert.equal(r.profiles.filter(p=>p.species==="mouse").length,72);
 assert.equal(r.profiles.filter(p=>p.species==="rat").length,72);
});
test("PK anchors preserve independently retrieved published human values",()=>{
 assert.ok(Math.abs(ANCHORS.pirfenidone_5carboxy_renal[2]-100/28.7)<1e-12);
 assert.ok(Math.abs(ANCHORS.pirfenidone_5carboxy_renal[3]-168/28.7)<1e-12);
 assert.equal(ANCHORS.pentoxifylline_metabolite_V_renal[3],12.9);
 assert.equal(ANCHORS.pentoxifylline_parent_hepatic.moderate,6.5);
 assert.equal(ANCHORS.pirfenidone_parent_hepatic.moderate,1.6);
 assert.equal(ANCHORS.dapagliflozin_parent_renal[3],1.87);
});
test("Unknown toxicity, benefits and cure cannot accidentally be turned into probabilities",()=>{
 for(const p of r.profiles)for(const g of p.exposure_regimens){
   assert.equal(g.toxicity_probability,null);
   assert.equal(g.renal_injury_probability,null);
   assert.equal(g.benefit_probability,null);
   assert.equal(g.cure_probability,null);
   assert.equal(g.actual_animal_data,false);
   assert.ok(g.renal_exposure.median>0);
 }
});
test("No extrapolation is given for severe liver impairment",()=>{
 const severe=r.profiles.filter(p=>p.hepatic==="severe");
 assert.equal(severe.length,48);
 for(const p of severe)for(const g of p.exposure_regimens){
  assert.equal(g.hepatic_extrapolation_valid,false);
  assert.equal(g.hepatic_exposure,null);
 }
});
test("SGLT2 illustrative pharmacodynamic occupancy is grounded by species potency",()=>{
 assert.equal(sglt2Inhibition("mouse",2.3),0.5);
 assert.equal(sglt2Inhibition("rat",3),0.5);
 assert.ok(sglt2Inhibition("mouse",1)>sglt2Inhibition("rat",1));
 assert.ok(sglt2Inhibition("rat",10)<1);
});
test("Mass and conditional exposure sensitivity is reproducible",()=>{
 assert.equal(massFactor(25,25),1);
 assert.ok(massFactor(35,25)>massFactor(18,25));
 const c=r.profiles.find(p=>p.species==="mouse"&&p.mass_g===25&&p.renal==="severe"&&p.hepatic==="moderate"&&p.hydration==="normal");
 const a=c.exposure_regimens.find(g=>g.regimen==="R02-A");
 const b=c.exposure_regimens.find(g=>g.regimen==="R02-B");
 assert.ok(b.renal_exposure.median>a.renal_exposure.median);
 assert.ok(b.hepatic_exposure.median>a.hepatic_exposure.median);
 assert.equal(b.renal_exposure.anchor_human_ratio,12.9);
 const c2=build().profiles.find(p=>p.id===c.id);
 assert.deepEqual(c,c2);
 console.log("PRMR-R03 reference scenario — mouse, 25g, severe renal, moderate liver, hydrated");
 console.log(JSON.stringify({model_id:c.id,R02_A:{renal:a.renal_exposure,hepatic:a.hepatic_exposure},R02_B:{renal:b.renal_exposure,hepatic:b.hepatic_exposure}},null,2));
});
test("Main interface and scientific cautions are accessible",()=>{
 const html=readFileSync(new URL("../risk-r03.html",import.meta.url),"utf8");
 assert.match(html,/src\/r03_model\.mjs/);
 assert.match(html,/Non estimable/);
 assert.match(html,/probabilité de toxicité/);
 assert.match(html,/risque.*bénéfice/i);
 const main=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 /* L'accueil a été refait : le lien porte désormais des paramètres et une
    ancre. Ce qui compte est qu'il mène à ce module, pas sa forme exacte. */
 assert.match(main,/href="\.\/risk-r03\.html[^"]*"/);
});

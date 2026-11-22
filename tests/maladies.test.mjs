import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORCES,chercherMaladies,substancesPour,zonesPour,concerne} from '../src/maladies.mjs';

const registre=JSON.parse(readFileSync(new URL('../research-data/maladies.json',import.meta.url)));
const mrc=registre.maladies.find(m=>m.id==='mrc');
const ids=(m,st)=>substancesPour(m,st).map(s=>s.id);

test('Registre des maladies : chaque substance est classée et sourcée',()=>{
 for(const m of registre.maladies){
  assert.ok(registre.sources[m.source]?.url.startsWith('https://'),m.id);
  for(const s of m.substances){
   assert.ok(s.force in FORCES,s.id);
   for(const k of [s.source,s.source2].filter(Boolean))assert.ok(registre.sources[k]?.url.startsWith('https://'),s.id+' '+k);
   for(const champ of ['nom','type','dose','population','effet'])assert.ok(s[champ],s.id+' sans '+champ);
  }
 }
 for(const cle of Object.keys(FORCES))assert.ok(registre.regle_force[cle],cle);
});

test('Maladie rénale chronique : substances filtrées selon le DFG étudié',()=>{
 assert.ok(ids(mrc,'G3a').includes('dapagliflozine'));
 assert.ok(!ids(mrc,'G5').includes('dapagliflozine'));
 assert.ok(!ids(mrc,'G1').includes('empagliflozine_rein'));
 assert.ok(ids(mrc,'G5').includes('cetoanalogues'));
 assert.ok(ids(mrc,'G1').includes('aristoloche'));
 assert.ok(concerne({dfg:[25,75]},{dfg:[15,29]}));
 const liste=substancesPour(mrc,'');
 assert.equal(liste[0].force,'forte');
 assert.equal(liste.at(-1).force,'a_eviter');
 assert.equal(zonesPour(mrc,'G4').niveau,'eleve');
 assert.deepEqual(zonesPour(mrc,'G4').zones,['kidney_l','kidney_r']);
});

test('Recherche par nom courant et stades du diabète',()=>{
 assert.equal(chercherMaladies(registre,'insuffisance renale')[0].id,'mrc');
 assert.ok(chercherMaladies(registre,'Diabète').length>=2);
 const dt2=registre.maladies.find(m=>m.id==='dt2');
 assert.deepEqual(ids(dt2,'prediabete').sort(),['metformine_prevention','mode_de_vie','moringa_dt2']);
 assert.ok(zonesPour(dt2,'diabete_rein').zones.includes('kidney_l'));
});

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
   for(const champ of ['nom','type','dose','population','effet','force'])assert.ok(s[champ],s.id+' sans '+champ);
  }
 }
 for(const cle of Object.keys(FORCES))assert.ok(registre.regle_force[cle],cle);
});

test('Maladie rénale chronique : substances filtrées selon le DFG étudié',()=>{
 assert.ok(ids(mrc,'G3a').includes('dapagliflozine'));
 assert.ok(!ids(mrc,'G5').includes('dapagliflozine'));
 assert.ok(!ids(mrc,'G1').includes('empagliflozine_rein'));
 assert.ok(ids(mrc,'G5').includes('cetoanalogues'));
 assert.ok(ids(mrc,'G4').includes('bicarbonate'));
 assert.ok(ids(mrc,'G4').includes('fruits_legumes')&&!ids(mrc,'G3a').includes('fruits_legumes'));
 assert.ok(concerne({dfg:[25,75]},{dfg:[15,29]}));
 const liste=substancesPour(mrc,'');
 assert.equal(liste[0].force,'forte');
 assert.equal(liste.at(-1).force,'theorique');
 assert.ok(!liste.some(s=>s.force==='a_eviter'),'le registre ne recense que des substances bénéfiques');
 const fortes=liste.filter(s=>s.force==='forte').map(s=>s.id);assert.equal(fortes[0],'tolvaptan');
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

test('Deux onglets dans le bandeau, sans barre « Atlas anatomique »',()=>{
 for(const page of ['exposures.html','maladies.html']){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(html,/class="xp-tabs"[^>]*><a href="\.\/exposures\.html"[^>]*>Explorateur d’exposition<\/a><a href="\.\/maladies\.html"[^>]*>Maladies<\/a>/);
  assert.ok(!html.includes('xp-atlas-nav'),page);
 }
});

test('Lot 2 : maladies complexes, recherche et stades',()=>{
 for(const [mot,id] of [['drépanocytose','drepanocytose'],['tension','hta'],['alzheimer','alzheimer'],['parkinson','parkinson'],['insuffisance cardiaque','insuffisance_cardiaque'],['hépatite B','hepatite_b'],['VIH','vih']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 const hta=registre.maladies.find(m=>m.id==='hta');
 assert.ok(ids(hta,'hta').includes('bissap')&&ids(hta,'hta').includes('ail'));
 assert.ok(!ids(hta,'elevee').includes('antihypertenseurs'));
 assert.deepEqual(zonesPour(hta,'elevee').zones,['heart','aorta']);
 const drepano=registre.maladies.find(m=>m.id==='drepanocytose');
 assert.equal(substancesPour(drepano,'enfant')[0].id,'hydroxyuree');
 const pk=registre.maladies.find(m=>m.id==='parkinson');
 assert.ok(ids(pk,'installe').includes('mucuna')&&!ids(pk,'installe').includes('lixisenatide'));
 for(const m of registre.maladies)for(const s of m.substances)assert.ok(s.resume,m.id+' '+s.id+' sans résumé');
});

test('Pistes de guérison : guérisons obtenues puis hypothèses sourcées',()=>{
 assert.ok(registre.regle_appui?.avertissement);
 for(const m of registre.maladies)for(const g of m.guerison||[]){
  assert.ok(['obtenue','hypothese'].includes(g.type),g.id);
  if(g.type==='hypothese'){assert.ok(['fort','moyen','faible'].includes(g.appui),g.id);assert.ok(g.raisonnement&&g.a_tester&&g.risques,g.id);}
  else assert.ok(g.resultat,g.id);
  assert.ok(registre.sources[g.source]?.url.startsWith('https://'),g.id);
  if(g.source2)assert.ok(registre.sources[g.source2]?.url.startsWith('https://'),g.id+' source2');
  for(const c of g.composants)if(c.ref)assert.ok(m.substances.some(s=>s.id===c.ref),g.id+' → '+c.ref);
 }
 assert.ok(registre.maladies.find(m=>m.id==='drepanocytose').guerison.some(g=>g.type==='obtenue'));
});

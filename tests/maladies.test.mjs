import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORCES,TYPES,chercherMaladies,substancesPour,zonesPour,concerne} from '../src/maladies.mjs';

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

test('Une seule page : vues Substances et Maladies dans le bandeau, ancienne adresse redirigée',()=>{
 const html=readFileSync(new URL('../exposures.html',import.meta.url),'utf8');
 assert.match(html,/class="xp-vues"[^>]*><button[^>]*data-choix-vue="substances"[^>]*>Substances<\/button><button[^>]*data-choix-vue="maladies"[^>]*>Maladies<\/button>/);
 assert.ok(!html.includes('xp-atlas-nav'));
 for(const id of ['mx-liste','mx-stade','mx-substances','mx-g-preuve','mx-g-effet','mx-g-balance','xr-forest','xr-balance'])assert.ok(html.includes('id="'+id+'"'),id);
 const ancienne=readFileSync(new URL('../maladies.html',import.meta.url),'utf8');
 assert.match(ancienne,/exposures\.html\?vue=maladies/);
});

test('Rapports de risque publiés lus dans le texte des essais',async()=>{
 const {rapportPublie}=await import('../src/maladies.mjs');
 assert.deepEqual(rapportPublie({effet:'Moins d’événements (HR 0,61 ; IC 95 % 0,51 à 0,72).'}),{rr:0.61,bas:0.51,haut:0.72});
 assert.equal(rapportPublie({effet:'Amélioration du DFG de 5 mL/min.'}),null);
 const mrc=registre.maladies.find(m=>m.id==='mrc');
 assert.ok(mrc.substances.filter(s=>rapportPublie(s)).length>=5);
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

test('Lot 3 : cancers, fibromes et maladies du foie, guérisons d’abord',()=>{
 for(const [mot,id] of [['cancer du sein','cancer_sein'],['prostate','cancer_prostate'],['carcinome hépatocellulaire','cancer_foie'],['col de l’utérus','cancer_col'],['côlon','cancer_colorectal'],['fibrome','fibromes'],['stéatose','mash'],['cirrhose','cirrhose'],['hépatite C','hepatite_c']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 for(const id of ['cancer_sein','cancer_prostate','cancer_foie','cancer_col','cancer_colorectal','fibromes','mash','cirrhose','hepatite_c']){
  const m=registre.maladies.find(x=>x.id===id);
  assert.ok(m.guerison.some(g=>g.type==='obtenue'),id+' sans guérison obtenue');
 }
 for(const id of ['cancer_sein','cancer_col','fibromes'])assert.equal(registre.maladies.find(x=>x.id===id).sexe,'female');
 assert.equal(registre.maladies.find(x=>x.id==='cancer_prostate').sexe,'male');
});

test('Lot 4 : antiparasitaires et médicaments repositionnés dans les cancers, cas rapportés à part',()=>{
 assert.equal(FORCES.cas.rang,FORCES.faible.rang+1);
 assert.ok(FORCES.preclinique.rang>FORCES.cas.rang);
 const colon=registre.maladies.find(m=>m.id==='cancer_colorectal');
 assert.ok(ids(colon,'local').includes('levamisole_colon'));
 assert.equal(colon.substances.find(s=>s.id==='levamisole_colon').force,'forte');
 for(const [mot,id] of [['glioblastome','glioblastome'],['pancréas','cancer_pancreas'],['mélanome','melanome'],['poumon','cancer_poumon'],['vermifuge','cancers_rares']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 // Chaque cas rapporté dit pourquoi il ne prouve rien : précaution obligatoire.
 const cas=registre.maladies.flatMap(m=>m.substances.filter(s=>s.force==='cas'));
 assert.ok(cas.length>=8);
 for(const s of cas)assert.ok(s.prudence&&s.prudence.length>40,s.id+' sans précaution');
 // Un cas ne passe jamais devant un essai.
 const prostate=registre.maladies.find(m=>m.id==='cancer_prostate');
 const liste=substancesPour(prostate,'metastatique').map(s=>s.force);
 assert.ok(liste.indexOf('cas')>liste.lastIndexOf('faible'));
 // Fenbendazole : l'atteinte du foie publiée est toujours citée.
 for(const s of cas.filter(s=>s.id.startsWith('fenbendazole')))assert.match(s.prudence,/foie/);
});

test('Lot 5 : rein et diabète, petites études et cas rapportés',()=>{
 const dt2=registre.maladies.find(m=>m.id==='dt2');
 assert.ok(ids(dt2,'diabete').includes('direct_regime')&&ids(dt2,'diabete').includes('jeune_dt2_cas'));
 assert.ok(!ids(dt2,'prediabete').includes('jeune_dt2_cas'));
 assert.ok(ids(mrc,'G3a').includes('vegetal_rein_cas')&&!ids(mrc,'G5').includes('vegetal_rein_cas'));
 const dt1=registre.maladies.find(m=>m.id==='dt1');
 assert.equal(substancesPour(dt1,'installe').at(-1).force,'cas');
 assert.match(dt2.substances.find(s=>s.id==='jeune_dt2_cas').prudence,/insuline/);
});

test('Lot 6 : VIH, Alzheimer, tension, fibromes — guérisons rapportées et petites études',()=>{
 const vih=registre.maladies.find(m=>m.id==='vih');
 const g=vih.substances.find(s=>s.id==='greffe_ccr5_cas');
 assert.equal(g.force,'cas');assert.ok(g.source&&g.source2);assert.match(g.prudence,/cancers du sang/);
 const ad=registre.maladies.find(m=>m.id==='alzheimer');
 assert.ok(ids(ad,'precoce').includes('mend_cas')&&!ids(ad,'modere').includes('mend_cas'));
 for(const m of registre.maladies)for(const s of m.substances)assert.ok(Array.isArray(s.zones)&&s.zones.length,m.id+' '+s.id+' sans zone');
});

test('Vermox (mébendazole) retrouvé par son nom commercial',()=>{
 const trouves=chercherMaladies(registre,'Vermox').map(m=>m.id);
 for(const id of ['cancer_colorectal','glioblastome','cancers_rares'])assert.ok(trouves.includes(id),id);
 const colon=registre.maladies.find(m=>m.id==='cancer_colorectal');
 assert.equal(colon.substances.find(s=>s.id==='mebendazole_folfox').force,'moyenne');
 for(const m of registre.maladies)for(const s of m.substances)if(/mébendazole/i.test(s.nom))assert.match(s.nom,/Vermox/,s.id);
});

test('Rein bloqué : gestes de désobstruction classés et filtrés par fonction restante',()=>{
 const r=registre.maladies.find(m=>m.id==='rein_obstrue');
 assert.ok(chercherMaladies(registre,'hydronéphrose').some(m=>m.id==='rein_obstrue'));
 assert.ok(ids(r,'fonction_conservee').includes('levee_obstruction'));
 assert.ok(!ids(r,'fonction_basse').includes('levee_obstruction'));
 assert.ok(r.substances.every(s=>s.type in TYPES));
});

test('Lot 7 : maladies du rein (polykystose, IgA, HSF, drépanocytose, lupus)',()=>{
 for(const [mot,id] of [['polykystose','polykystose'],['Berger','nephropathie_iga'],['FSGS','hsf'],['néphropathie drépanocytaire','rein_drepanocytaire'],['néphrite lupique','nephrite_lupique']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 const pkd=registre.maladies.find(m=>m.id==='polykystose');
 assert.ok(ids(pkd,'avance').includes('tolvaptan_pkd')&&!ids(pkd,'debut').includes('tolvaptan_pkd'));
});

test('Lot 8 : cancers du sang, ovaire, estomac, œsophage, tête et cou, lymphomes',()=>{
 for(const [mot,id] of [['myélome','myelome'],['LMC','leucemies'],['ovaire','cancer_ovaire'],['Helicobacter','cancer_estomac'],['œsophage','cancer_oesophage'],['gorge','cancer_orl'],['lymphome','lymphome']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 const l=registre.maladies.find(m=>m.id==='leucemies');
 assert.ok(l.guerison.some(g=>g.type==='obtenue'));
 assert.ok(ids(l,'lmc').includes('imatinib_lmc')&&!ids(l,'lap').includes('imatinib_lmc'));
});

test('Lot 9 : auto-immunes et côlon (colopathie comprise)',()=>{
 for(const [mot,id] of [['lupus','lupus'],['polyarthrite','polyarthrite'],['Crohn','crohn'],['rectocolite','rch'],['sclérose en plaques','sep'],['psoriasis','psoriasis'],['vitiligo','vitiligo'],['colopathie','intestin_irritable'],['constipation','constipation'],['diverticule','diverticulite'],['gluten','coeliaque']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 assert.ok(registre.maladies.find(m=>m.id==='lupus').guerison.some(g=>g.type==='obtenue'));
});

test('Lot 10 : cerveau, foie, poumon, cœur',()=>{
 for(const [mot,id] of [['Charcot','sla'],['épilepsie','epilepsie'],['Huntington','huntington'],['neuropathie','neuropathie_diabetique'],['cholangite biliaire','cbp'],['delta','hepatite_d'],['fibrose pulmonaire','fibrose_pulmonaire'],['BPCO','bpco'],['HTAP','htap']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
});

test('Lot 11 : génétique, femme, vieillissement, infections',()=>{
 for(const [mot,id] of [['thalassémie','thalassemie'],['hémophilie','hemophilie'],['mucoviscidose','mucoviscidose'],['Duchenne','duchenne'],['endométriose','endometriose'],['infertilité','sopk'],['arthrose','arthrose'],['ostéoporose','osteoporose'],['glaucome','glaucome'],['DMLA','dmla'],['tuberculose','tuberculose_mr']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
});

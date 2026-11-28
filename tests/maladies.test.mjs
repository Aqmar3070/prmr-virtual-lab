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
 for(const [mot,id] of [['thalassémie','thalassemie'],['hémophilie','hemophilie'],['mucoviscidose','mucoviscidose'],['Duchenne','duchenne'],['endométriose','endometriose'],['infertilité','sopk'],['coxarthrose','arthrose'],['ostéoporose','osteoporose'],['glaucome','glaucome'],['DMLA','dmla'],['tuberculose','tuberculose_mr']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
});

test('Approfondissement 1 : plantes et petites études ajoutées aux nouvelles maladies',()=>{
 const m=registre.maladies.find(x=>x.id==='myelome');
 assert.ok(ids(m,'precurseur').includes('curcumine_mgus')&&!ids(m,'rechute').includes('curcumine_mgus'));
 for(const [mid,sid] of [['nephropathie_iga','huile_poisson_iga'],['crohn','absinthe_crohn'],['bpco','nac_bpco'],['polykystose','ceto_pkd_cas']])
  assert.ok(registre.maladies.find(x=>x.id===mid).substances.some(s=>s.id===sid),sid);
});

test('Approfondissement 2 : prévention du cancer de l’estomac et lymphome MALT',()=>{
 const e=registre.maladies.find(x=>x.id==='cancer_estomac');
 assert.ok(ids(e,'prevention').includes('vitamines_ail')&&!ids(e,'operable').includes('vitamines_ail'));
 const l=registre.maladies.find(x=>x.id==='lymphome');
 assert.ok(ids(l,'malt').includes('hp_malt_cas'));
});

test('Arthrose de toutes localisations et hernie discale',()=>{
 const a=registre.maladies.find(x=>x.id==='arthrose');
 assert.ok(ids(a,'hanche').includes('exercice_hanche')&&!ids(a,'mains').includes('exercice_hanche'));
 assert.ok(ids(a,'mains').includes('prednisolone_mains'));
 for(const mot of ['hernie discale','sciatique'])assert.ok(chercherMaladies(registre,mot).some(m=>m.id==='hernie_discale'),mot);
});

test('Maladies principales : témoignages et petites études supplémentaires',()=>{
 const c=registre.maladies.find(x=>x.id==='cirrhose');
 assert.ok(ids(c,'compensee').includes('tenofovir_cirrhose'));
 const g=registre.maladies.find(x=>x.id==='glioblastome');
 assert.ok(ids(g,'nouveau').includes('ceto_gbm_cas'));
 const mrc=registre.maladies.find(x=>x.id==='mrc');
 assert.match(mrc.substances.find(s=>s.id==='vegetal_rein_cas').prudence,/jus/);
});

test('Maladies peu fournies : deuxième traitement ajouté',()=>{
 for(const id of ['cancer_pancreas','cancer_ovaire','sep','cbp','fibrose_pulmonaire','mucoviscidose','hemophilie','dmla','cancer_oesophage','cancer_orl'])
  assert.ok(registre.maladies.find(m=>m.id===id).substances.length>=2,id);
 const p=registre.maladies.find(m=>m.id==='cancer_pancreas');
 assert.ok(ids(p,'opere').includes('folfirinox')&&!ids(p,'avance').includes('folfirinox'));
});

test('Profil du patient (rein) : comparaison aux populations étudiées',async()=>{
 const {evaluerProfil,profilActif,decrireProfil}=await import('../src/maladies.mjs');
 const mrc=registre.maladies.find(m=>m.id==='mrc');const causes=mrc.profil_patient.causes;
 const S=id=>mrc.substances.find(s=>s.id===id);
 // Diabète, DFG 35, albuminurie 500 mg/g : DAPA-CKD, FIDELIO, FLOW, EMPA-KIDNEY couvrent ce profil.
 const p={cause:'diabete',dfg:35,rac:500,bicarbonate:null};
 for(const id of ['dapagliflozine','empagliflozine_rein','finerenone','semaglutide_rein'])assert.equal(evaluerProfil(S(id),p,causes).statut,'etudie',id);
 // DFG 18 : hors de toutes ces plages (essais à partir de 20 ou 25).
 const bas={...p,dfg:18};
 for(const id of ['dapagliflozine','empagliflozine_rein','finerenone'])assert.equal(evaluerProfil(S(id),bas,causes).statut,'hors',id);
 assert.match(evaluerProfil(S('dapagliflozine'),bas,causes).raisons[0],/DFG 18 hors/);
 // Polykystose : la finérénone (diabète) est hors profil, le tolvaptan dépend du DFG.
 assert.equal(evaluerProfil(S('finerenone'),{cause:'polykystose',dfg:70,rac:null},causes).statut,'hors');
 assert.equal(evaluerProfil(S('tolvaptan'),{cause:'polykystose',dfg:70},causes).statut,'etudie');
 // Mesure manquante : à préciser, jamais « étudié » par défaut.
 assert.equal(evaluerProfil(S('dapagliflozine'),{cause:'diabete',dfg:40,rac:null},causes).statut,'a_preciser');
 assert.equal(evaluerProfil(S('bicarbonate'),{dfg:20,bicarbonate:18},causes).statut,'etudie');
 assert.equal(evaluerProfil(S('cordyceps'),p,causes).statut,'non_precise');
 assert.ok(!profilActif({cause:'',dfg:null}));
 assert.match(decrireProfil(S('empagliflozine_rein').profil,causes),/DFG 20 à 44/);
});

test('Trois rubriques : Guéris, Testés, Pistes',async()=>{
 const {pourGueris,pourTestes,pourPistes,substancesPour,evaluerProfil}=await import('../src/maladies.mjs');
 for(const m of registre.maladies){
  const l=substancesPour(m,'');const g=pourGueris(m,l),t=pourTestes(l),p=pourPistes(m,l,'');
  // chaque substance apparaît dans une seule rubrique
  assert.equal(g.cas.length+t.length+p.theoriques.length,l.length,m.id);
  assert.ok(g.obtenues.every(x=>x.type==='obtenue')&&p.combinaisons.every(x=>x.type!=='obtenue'),m.id);
  assert.ok(!t.some(s=>(s.force==='cas'&&s.gueri!==false)||s.force==='theorique'),m.id);
 }
 const mrc=registre.maladies.find(m=>m.id==='mrc');
 // les anciennes « hypothèses » déjà testées sur l'animal ou l'humain sont dans Testés
 for(const id of ['niclosamide_pkd','artesunate_fibrose','berberine_dn','cetogene_bhb_pkd','senolytiques_dkd','mebendazole_pkd'])assert.ok(pourTestes(mrc.substances).some(s=>s.id===id),id);
 assert.ok(!mrc.hypotheses);
 // les pistes : jamais testées, deux faits sourcés, formulation conditionnelle
 const ps=pourPistes(mrc,mrc.substances,'').pistes;assert.ok(ps.length>=2);
 for(const h of ps){
  for(const k of ['nom','situation','lesion','fait_molecule','fait_maladie','lien','formulation','recherche','a_verifier','prudence','source','source2'])assert.ok(h[k],h.id+' '+k);
  assert.match(h.formulation,/pourrait éventuellement/);assert.doesNotMatch(h.formulation,/guérit/);
  assert.match(h.recherche,/Aucune étude/);
  for(const s of [h.source,h.source2])assert.match(registre.sources[s].url,/^https:\/\/doi\.org\//);
  assert.ok(!mrc.substances.some(s=>s.id===h.id));
 }
 const causes=mrc.profil_patient.causes,P=id=>ps.find(h=>h.id===id);
 assert.equal(evaluerProfil(P('p_fenbendazole_pkd'),{cause:'polykystose'},causes).statut,'etudie');
 assert.equal(evaluerProfil(P('p_fenbendazole_pkd'),{cause:'diabete'},causes).statut,'hors');
});

test('Guéris : seules les guérisons ou rémissions rapportées',async()=>{
 const {pourGueris,pourTestes,substancesPour}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 assert.ok(pourGueris(m('cancer_sein'),m('cancer_sein').substances).cas.some(s=>s.id==='fenbendazole_sein_cas'));
 for(const [mid,sid] of [['alzheimer','mend_cas'],['polykystose','ceto_pkd_cas'],['myelome','curcumine_myelome_cas']]){
  const l=substancesPour(m(mid),'');
  assert.ok(!pourGueris(m(mid),l).cas.some(s=>s.id===sid),sid);
  assert.ok(pourTestes(l).some(s=>s.id===sid),sid);
 }
});

test('Maladies courantes : paludisme, typhoïde, dengue, grippe, infection urinaire, diarrhée',()=>{
 for(const [mot,id] of [['palu','paludisme'],['typhoïde','typhoide'],['dengue','dengue'],['grippe','grippe'],['cystite','infection_urinaire'],['gastro','diarrhee_aigue']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 const palu=registre.maladies.find(m=>m.id==='paludisme');
 assert.ok(palu.guerison.some(g=>g.type==='obtenue'));
 // l'essai Artemisia rétracté doit être signalé comme tel, jamais compté comme preuve
 const a=palu.substances.find(s=>s.id==='artemisia_tisane');
 assert.equal(a.force,'faible');assert.match(a.effet,/rétracté/);assert.ok(a.source2);
});

test('Guérisons rapportées et pistes : maladies incurables (lot 1)',async()=>{
 const {pourGueris,pourTestes,pourPistes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['cancer_sein','ama_sein_cas'],['myelome','ama_myelome_cas'],['cancer_poumon','ama_poumon_cas'],['cancer_colorectal','mebendazole_sorafenib_cas'],['sla','sla_inversions']])
  assert.ok(pourGueris(m(mid),m(mid).substances).cas.some(s=>s.id===sid),sid);
 assert.ok(pourTestes(m('glioblastome').substances).some(s=>s.id==='ama_gbm_cas'));
 assert.ok(pourTestes(m('htap').substances).some(s=>s.id==='mebendazole_htap'));
 assert.equal(pourPistes(m('fibrose_pulmonaire'),[],'').pistes[0].id,'p_mebendazole_fpi');
});

test('Lot molécules 1 : classes variées (SGLT2, antifongique, antagoniste minéralocorticoïde)',async()=>{
 const {pourTestes,pourPistes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['duchenne','empagliflozine_dmd'],['htap','dapagliflozine_htap'],['cancer_pancreas','itraconazole_pancreas'],['parkinson','dapagliflozine_parkinson'],['drepanocytose','sglt2_drepano']])
  assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
 assert.match(m('duchenne').substances.find(s=>s.id==='empagliflozine_dmd').prudence,/non relue/);
 assert.equal(pourPistes(m('rein_drepanocytaire'),[],'').pistes[0].id,'p_finerenone_drepano');
});

test('Lot molécules 2 : diabète, foie, cancers (positifs et négatifs)',async()=>{
 const {pourTestes,pourPistes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['dt2','harmine_glp1'],['dt1','gaba_dt1'],['hepatite_b','ciclopirox_vhb'],['cancer_sein','propranolol_sein'],['cirrhose','simva_rifaximine'],['cancer_colorectal','vitd_sunshine']])
  assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
 assert.match(m('cirrhose').substances.find(s=>s.id==='simva_rifaximine').resume,/Pas de bénéfice/);
 assert.equal(pourPistes(m('dt1'),[],'').pistes[0].id,'p_verapamil_harmine');
});

test('Lot molécules 3 : cerveau, nerfs et yeux (résultats positifs et négatifs)',async()=>{
 const {pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['sla','methylcobalamine_sla'],['parkinson','ambroxol_pdd'],['parkinson','deferiprone_parkinson'],['sep','clemastine_sep'],['alzheimer','valaciclovir_alz'],['huntington','pridopidine_hd'],['dmla','metformine_dmla']])
  assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
 assert.match(m('parkinson').substances.find(s=>s.id==='deferiprone_parkinson').resume,/Aggravation/);
});

test('Lot molécules 4 : auto-immunité et intestin',async()=>{
 const {pourTestes,pourPistes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['polyarthrite','abatacept_prevention'],['polyarthrite','vitd_autoimmun_pr'],['psoriasis','vitd_autoimmun_pso'],['crohn','ldn_crohn'],['arthrose','hcq_mains'],['lupus','metformine_lupus'],['coeliaque','larazotide']])
  assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
 assert.equal(pourPistes(m('vitiligo'),[],'').pistes[0].id,'p_ldn_vitiligo');
});

test('Lot molécules 5 : cancers (médicaments détournés et vitamine C)',async()=>{
 const {pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['glioblastome','cusp9_gbm'],['cancer_foie','statine_chc_vhb'],['cancer_foie','aspirine_chc_vhc'],['cancer_pancreas','vitc_iv_pancreas'],['cancer_ovaire','metformine_ovaire'],['lymphome','doxycycline_oaml']])
  assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
});

test('Lot molécules 6 : sang et maladies rares',async()=>{
 const {pourTestes,pourGueris}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 assert.ok(pourGueris(m('thalassemie'),m('thalassemie').substances).cas.some(s=>s.id==='thalidomide_thal_cas'));
 assert.ok(pourGueris(m('hemophilie'),m('hemophilie').substances).obtenues.some(g=>g.id==='hemo_b_genique'));
 for(const [mid,sid] of [['mucoviscidose','azithro_muco'],['duchenne','givinostat'],['drepanocytose','metformine_hbf']])assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
});

test('Lot molécules 7 : cœur, poumons, foie, yeux, os',async()=>{
 const {pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['insuffisance_cardiaque','fer_iv_ic'],['bpco','azithro_bpco'],['mash','tirzepatide_mash'],['glaucome','citicoline_combi'],['osteoporose','vitk2_osteo']])assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
});

test('Lot molécules 8 : femmes et neuropathie',async()=>{
 const {pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 for(const [mid,sid] of [['endometriose','melatonine_endo'],['endometriose','dca_endo'],['sopk','inositol_sopk'],['neuropathie_diabetique','benfotiamine_groupe'],['neuropathie_diabetique','clemastine_nerf_optique']])assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
});

test('Pistes 1 : DCA (fibrose pulmonaire), clémastine + nicotinamide (glaucome)',async()=>{
 const {pourPistes,pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 assert.ok(pourPistes(m('fibrose_pulmonaire'),[],'').pistes.some(p=>p.id==='p_dca_fpi'));
 assert.equal(pourPistes(m('glaucome'),[],'').pistes[0].id,'p_clemastine_nicotinamide');
 for(const [mid,sid] of [['alzheimer','clemastine_alz'],['glaucome','clemastine_glaucome'],['vitiligo','biotherapies_vitiligo'],['drepanocytose','inducteurs_hbf']])assert.ok(pourTestes(m(mid).substances).some(s=>s.id===sid),sid);
 assert.match(m('endometriose').substances.find(s=>s.id==='dca_endo').prudence,/neuropathie/);
});

test('Maladies courantes 2 : yeux, rhume, peau',()=>{
 for(const [mot,id] of [['myopie','myopie'],['hypermétropie','myopie'],['presbytie','presbytie'],['cataracte','cataracte'],['rhume','rhume'],['gale','gale'],['mycose','mycose_ongles'],['eczéma','eczema'],['acné','acne']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 assert.ok(registre.maladies.find(m=>m.id==='myopie').guerison.some(g=>g.type==='obtenue'));
});

test('Maladies courantes 3 : migraine, reflux, asthme, ORL, peau, sommeil, dos, goutte, ulcère…',async()=>{
 for(const [mot,id] of [['migraine','migraine'],['brûlures d\'estomac','reflux'],['hémorroïdes','hemorroides'],['anémie','anemie_fer'],['asthme','asthme'],['rhume des foins','rhinite_allergique'],['angine','angine'],['otite','otite'],['conjonctivite','conjonctivite'],['bouton de fièvre','herpes_labial'],['verrue','verrues'],['calvitie','alopecie'],['insomnie','insomnie'],['dépression','depression'],['lombalgie','lombalgie'],['goutte','goutte'],['varices','varices'],['ulcère','ulcere'],["pied d'athlète",'pied_athlete']])
  assert.ok(chercherMaladies(registre,mot).some(m=>m.id===id),mot);
 const {pourPistes,pourGueris}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 const p=pourPistes(m('cancer_pancreas'),[],'').pistes.find(h=>h.id==='p_vitc_itraconazole');
 assert.ok(p);assert.match(p.formulation,/pourrait éventuellement/);
 for(const id of ['ulcere','pied_athlete','insomnie','verrues'])assert.ok(pourGueris(m(id),m(id).substances).obtenues.length,id);
});

test('Solutions concrètes : romarin et plantes dans Alzheimer, plus de « guérit seul »',async()=>{
 const {pourPistes,pourGueris,pourTestes}=await import('../src/maladies.mjs');
 const m=id=>registre.maladies.find(x=>x.id===id);
 const alz=pourTestes(m('alzheimer').substances).map(s=>s.id);
 for(const id of ['romarin_aroma_alz','safran_alz','sauge_alz','melisse_alz'])assert.ok(alz.includes(id),id);
 assert.ok(pourPistes(m('alzheimer'),[],'').pistes.some(p=>p.id==='p_romarin_safran_alz'));
 for(const id of ['angine','conjonctivite']){
  for(const g of pourGueris(m(id),m(id).substances).obtenues)assert.doesNotMatch(g.titre,/spontan/i,id);
 }
 for(const id of ['rhume','grippe','angine'])assert.doesNotMatch(m(id).description,/guérit seule|guérie spontanément|guérit seul/i,id);
 for(const [mid,sid] of [['alopecie','romarin_cheveux'],['herpes_labial','propolis_miel_herpes'],['depression','safran_depression'],['migraine','gingembre_migraine'],['grippe','baloxavir'],['ulcere','vonoprazan_hp']])
  assert.ok(m(mid).substances.some(s=>s.id===sid),sid);
});

test('Rein approfondi : guérisons, essais et piste ajoutés (28/11/2026)',async()=>{
 const {pourGueris,pourTestes,pourPistes,substancesPour}=await import('../src/maladies.mjs');
 const mrc=registre.maladies.find(m=>m.id==='mrc');const l=substancesPour(mrc,'');
 const g=pourGueris(mrc,l);
 for(const id of ['regression_microalb','sortie_dialyse'])assert.ok(g.obtenues.some(x=>x.id===id),id);
 for(const id of ['pancreas_greffe_cas','lidocaine_iga_cas','aprt_allopurinol_cas','adalimumab_tinu_cas'])assert.ok(g.cas.some(s=>s.id===id),id);
 for(const id of ['canagliflozine','atrasentan','benazepril_avance','ramipril_rein','silymarine_dn','pirfenidone_dn','allopurinol_rein','bariatrique_rein','pyrvinium_rein'])assert.ok(pourTestes(l).some(s=>s.id===id),id);
 assert.ok(pourPistes(mrc,l,'').pistes.some(h=>h.id==='p_itraconazole_fibrose'));
 // l'allopurinol signale le grand essai négatif
 assert.match(mrc.substances.find(s=>s.id==='allopurinol_rein').effet,/CKD-FIX/);
});

test('Rein, recherche élargie : traditions, thérapies nouvelles et témoignages analysés',async()=>{
 const {pourGueris,pourTestes,pourPistes,substancesPour}=await import('../src/maladies.mjs');
 const mrc=registre.maladies.find(m=>m.id==='mrc');const l=substancesPour(mrc,'');
 for(const id of ['temoignage_fsgs_vegetal','temoignage_tirzepatide'])assert.ok(pourGueris(mrc,l).cas.some(s=>s.id===id),id);
 for(const id of ['chelation_edta','niaoduqing','rilparencel','xenogreffe_porc','ast120','hibiscus_bissap','microbiote_lave','cetogene_hypocalorique','renadyl','ayurveda_punarnava','temoignage_antioxydants'])assert.ok(pourTestes(l).some(s=>s.id===id),id);
 for(const id of ['h_mrc_toxines_intestin','h_mrc_antioxydants_temoignage'])assert.ok(pourPistes(mrc,l,'').combinaisons.some(h=>h.id===id),id);
 // chaque témoignage porte une analyse critique
 for(const s of mrc.substances.filter(s=>s.id.startsWith('temoignage_')))assert.match(s.prudence,/Analyse PRMR/,s.id);
});

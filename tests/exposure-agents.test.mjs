import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyserAgents,teneurLibelle,moleculeDe} from '../src/exposure-agents.mjs';

const registre=JSON.parse(readFileSync(new URL('../research-data/r13_exposures.json',import.meta.url))).substances;
const produits=new Map([
 ['cafeine',{id:'cafeine',name:'Caféine',unit:'mg'}],
 ['cafe',{id:'cafe',name:'Café filtre',unit:'tasse'}],
 ['paracetamol',{id:'paracetamol',name:'Paracétamol',unit:'mg'}],
 ['ibuprofene',{id:'ibuprofene',name:'Ibuprofène oral',unit:'mg'}],
 ['metformine',{id:'metformine',name:'Metformine',unit:'mg'}],
 ['cis1',{id:'cis1',name:'DOLIPRANE 1000 mg, comprimé',unit:'unité déclarée',source:'orale · Commercialisée',active:['1']}],
 ['cis2',{id:'cis2',name:'ASSOCIATION 500 mg/30 mg',unit:'unité déclarée',source:'orale · Commercialisée',active:['1','2']}],
 ['sa1',{id:'sa1',name:'PARACÉTAMOL',unit:'mg'}],
 ['sa2',{id:'sa2',name:'CODÉINE',unit:'mg'}],
 ['soda',{id:'soda',name:'Soda',unit:'mL'}],
 ['biere',{id:'biere',name:'Bière',unit:'mL'}]
]);
const lookup=id=>produits.get(id);
const ligne=(id,qty,jours,extra={})=>({id,qty,after:qty,start:0,reduce:jours,end:jours,...extra});
const profil={sexe:'male',age:45,poids:72,taille:175};
const fiche=(rows,duree,p=profil)=>analyserAgents(rows,lookup,p,duree,registre).fiches;
const resultat=(fs,f,id)=>fs.find(x=>x.id===f)?.resultats.find(r=>r.id===id);

test('Teneur lue dans le libellé, seulement pour une substance unique',()=>{
 assert.equal(teneurLibelle(produits.get('cis1')),1000);
 assert.equal(teneurLibelle(produits.get('cis2')),null);
 assert.equal(moleculeDe(produits.get('cis1'),lookup),'paracetamol');
});

test('Caféine : tasses de café converties (EFSA 90 mg) et repère de 400 mg',()=>{
 const fs=fiche([ligne('cafe',5,30)],30);
 const c=fs.find(f=>f.id==='cafeine');
 assert.equal(c.moyenne,450);
 assert.equal(resultat(fs,'cafeine','cafeine_jour').niveau,'modere');
 assert.equal(resultat(fs,'cafeine','cafe_mortalite').rr,null); // 5 tasses : hors du point 3–4
 const trois=fiche([ligne('cafe',3,30)],30);
 assert.equal(resultat(trois,'cafeine','cafe_mortalite').rr,0.83);
 assert.equal(c.equivalences.length,3);
});

test('Sucres : repère OMS et boissons sucrées par portion de 250 mL',()=>{
 const fs=fiche([ligne('soda',500,30,{sug:10.6,label:'étiquette'})],30);
 const s=fs.find(f=>f.id==='sucres');
 assert.ok(Math.abs(s.moyenne-53)<1e-9);
 assert.equal(resultat(fs,'sucres','sucres_oms').niveau,'modere');
 assert.ok(Math.abs(resultat(fs,'sucres','boissons_diabete').rr-1.18**2)<1e-12);
 assert.equal(s.equivalences.length,3);
});

test('Paracétamol : spécialité lue en mg, seuils du registre',()=>{
 const fs=fiche([ligne('cis1',5,3)],3);
 assert.equal(fs.find(f=>f.id==='paracetamol').max,5000);
 assert.equal(resultat(fs,'paracetamol','paracetamol_foie').niveau,'modere'); // > 4 000 mg
 const sur=fiche([ligne('paracetamol',2000,3)],3);
 assert.equal(resultat(sur,'paracetamol','paracetamol_foie').signe,0);
});

test('Ibuprofène à 2 400 mg/j : essais CNT et durée au-delà de 5 jours',()=>{
 const fs=fiche([ligne('ibuprofene',2400,10)],10);
 assert.equal(resultat(fs,'ibuprofene','ibu_estomac').rr,3.97);
 assert.ok(resultat(fs,'ibuprofene','ibu_duree'));
 const faible=fiche([ligne('ibuprofene',600,3)],3);
 assert.equal(resultat(faible,'ibuprofene','ibu_estomac'),undefined);
});

test('Metformine : carence en B12 calculée sur la durée',()=>{
 const fs=fiche([ligne('metformine',1700,730)],730);
 const b12=resultat(fs,'metformine','metf_b12');
 assert.ok(Math.abs(b12.rr-1.13**2)<1e-12);
 assert.equal(b12.domaine,'etudie');
});

test('Combinaisons le même jour : alcool + paracétamol, alcool + metformine',()=>{
 const fs=fiche([ligne('biere',500,5,{abv:5,label:'étiquette'}),ligne('paracetamol',3000,5),ligne('metformine',1000,5)],5);
 const c=fs.find(f=>f.id==='combinaisons');
 assert.deepEqual(c.resultats.map(r=>r.id).sort(),['combi_alcool_metformine','combi_alcool_paracetamol']);
 for(const r of c.resultats)assert.ok(r.url?.startsWith('https://'));
 const decales=fiche([ligne('biere',500,5,{abv:5,label:'étiquette'}),{...ligne('paracetamol',3000,10),start:6}],12);
 assert.equal(decales.find(f=>f.id==='combinaisons'),undefined);
});

test('Notices : effets indésirables dès la dose normale, avec leur fréquence',()=>{
 const fs=fiche([ligne('paracetamol',2000,5)],5);
 const p=fs.find(f=>f.id==='paracetamol');
 const rein=p.resultats.find(r=>r.id==='paracetamol_notice_rein_toxicite');
 assert.ok(rein&&rein.zones.includes('kidney_l'));
 assert.equal(p.resultats.find(r=>r.id==='paracetamol_notice_foie_hepatite').badge,'< 1/10 000');
 assert.equal(p.resultats.find(r=>r.id==='paracetamol_benefice').signe,1);
 assert.equal(p.resultats.find(r=>r.id==='paracetamol_rein_surdosage'),undefined);
 const sur=fiche([ligne('paracetamol',8000,1)],1);
 assert.equal(resultat(sur,'paracetamol','paracetamol_rein_surdosage').badge,'2–10/100');
 const ibu=fiche([ligne('ibuprofene',600,3)],3);
 assert.equal(resultat(ibu,'ibuprofene','ibuprofene_notice_digestif').badge,'1–10/100');
 assert.equal(resultat(ibu,'ibuprofene','ibuprofene_notice_foie').zones[0],'liver');
 const metf=fiche([ligne('metformine',1000,30)],30);
 assert.equal(resultat(metf,'metformine','metformine_notice_digestif').niveau,'modere');
 for(const f of [...fs,...ibu,...metf])for(const r of f.resultats)assert.ok(r.url?.startsWith('https://'),r.id);
});

test('Aliments et plantes : effets favorables et défavorables',()=>{
 produits.set('al31074',{id:'al31074',name:'Chocolat noir 70 % de cacao environ, de dégustation, tablette',unit:'g'});
 produits.set('al31010',{id:'al31010',name:'Chocolat blanc, tablette',unit:'g'});
 produits.set('al11052',{id:'al11052',name:'Clou de girofle',unit:'g'});
 produits.set('al20009',{id:'al20009',name:'Carotte, crue',unit:'g'});
 produits.set('redbull',{id:'redbull',name:'Red Bull, boisson énergisante',unit:'mL'});
 const fs=fiche([ligne('al31074',20,30),ligne('al11052',2,30),ligne('al20009',600,90),ligne('redbull',500,10,{caf:32,sug:11,label:'Red Bull'})],90);
 assert.equal(resultat(fs,'cacao','cacao_tension').signe,1);
 assert.equal(resultat(fs,'girofle','girofle_foie').zones[0],'liver');
 assert.equal(resultat(fs,'carotte','carotte_peau').signe,-1);
 assert.equal(resultat(fs,'energisante','energisante_tension').signe,-1);
 assert.equal(fs.find(f=>f.id==='cafeine').moyenne,160);
 assert.equal(fiche([ligne('al31010',50,5)],5).find(f=>f.id==='cacao'),undefined); // chocolat blanc : pas de flavanols
});

test('Girofle : tableau complet, forme huile et interactions',()=>{
 produits.set('huile',{id:'huile',name:'Huile essentielle de clou de girofle',unit:'g'});
 const fs=fiche([ligne('huile',1,5),ligne('metformine',1000,5),ligne('ibuprofene',400,5)],5);
 const g=fs.find(f=>f.id==='girofle');
 assert.ok(g.resultats.length>=13);
 assert.equal(g.resultats.filter(r=>r.signe===1).length,4);
 assert.equal(resultat(fs,'girofle','girofle_foie').niveau,'eleve');
 assert.equal(resultat(fs,'girofle','girofle_hypoglycemie').signe,-1);
 assert.equal(resultat(fs,'girofle','girofle_saignement').signe,-1);
 const clou=fiche([ligne('al11052',2,5)],5);
 assert.equal(resultat(clou,'girofle','girofle_foie').niveau,'faible');
 for(const r of g.resultats)assert.ok(r.url?.startsWith('https://'),r.id);
});

test('Révision : papayer, chia, kinkéliba, kola amer, citronnelle',()=>{
 produits.set('feuilles',{id:'feuilles',name:'Feuilles de papayer',unit:'g'});
 produits.set('chiag',{id:'chiag',name:'Graines de chia',unit:'g'});
 produits.set('kink',{id:'kink',name:'Kinkéliba en infusion',unit:'g'});
 produits.set('kola',{id:'kola',name:'Kola amer',unit:'g'});
 produits.set('citro',{id:'citro',name:'Citronnelle en infusion',unit:'g'});
 produits.set('cipro',{id:'cipro',name:'CIPROFLOXACINE 500 mg, comprimé',unit:'mg'});
 produits.set('capto',{id:'capto',name:'CAPTOPRIL 50 mg, comprimé',unit:'mg'});
 const seuls=fiche(['feuilles','chiag','kink','kola','citro'].map(id=>ligne(id,10,30)),30,{...profil,sexe:'female'});
 assert.equal(resultat(seuls,'papaye','papaye_chimio').signe,1);
 assert.equal(resultat(seuls,'papaye','papaye_securite').domaine,'extrapole');
 assert.ok(resultat(seuls,'papaye','papaye_grossesse').zones.includes('uterus'));
 assert.equal(resultat(seuls,'papaye','papaye_interactions').signe,0);
 assert.equal(resultat(seuls,'chia','chia_tension').signe,1);
 assert.equal(resultat(seuls,'chia','chia_allergie').signe,-1);
 assert.equal(resultat(seuls,'kinkeliba','kinkeliba_tension').signe,1);
 assert.equal(resultat(seuls,'kinkeliba','kinkeliba_hypotension').signe,0);
 assert.equal(resultat(seuls,'kola_amer','kola_arthrose').signe,1);
 assert.equal(resultat(seuls,'kola_amer','kola_ciprofloxacine').signe,0);
 assert.equal(resultat(seuls,'citronnelle','citronnelle_tolerance').domaine,'extrapole');
 const avec=fiche([ligne('feuilles',10,5),ligne('kink',10,5),ligne('kola',10,5),ligne('cipro',500,5),ligne('capto',50,5),ligne('metformine',1000,5)],5);
 assert.equal(resultat(avec,'papaye','papaye_interactions').signe,-1);
 assert.equal(resultat(avec,'papaye','papaye_securite').domaine,'etudie');
 assert.equal(resultat(avec,'papaye','papaye_grossesse').zones.length,0);
 assert.equal(resultat(avec,'kinkeliba','kinkeliba_hypotension').signe,-1);
 assert.equal(resultat(avec,'kola_amer','kola_ciprofloxacine').niveau,'modere');
 for(const f of [...seuls,...avec])for(const r of f.resultats)assert.ok(r.url?.startsWith('https://'),r.id);
});

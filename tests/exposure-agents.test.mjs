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

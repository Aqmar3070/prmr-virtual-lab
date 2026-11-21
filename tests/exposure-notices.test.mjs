import test from 'node:test';
import assert from 'node:assert/strict';
import {fichesNotices,cleNotice,zonesDeClasse} from '../src/exposure-notices.mjs';

const produits=new Map([
 ['cis1',{id:'cis1',name:'DOLIPRANE 1000 mg, comprimé',unit:'unité déclarée',active:['02202']}],
 ['sa02202',{id:'sa02202',name:'PARACÉTAMOL',unit:'mg'}],
 ['paracetamol',{id:'paracetamol',name:'Paracétamol',unit:'mg'}]
]);
const lookup=id=>produits.get(id);
const donnees={notices:{'02202':{cis:'1',nom:'DOLIPRANE 1000 mg',url:'https://base-donnees-publique.medicaments.gouv.fr/affichageDoc.php?specid=1&typedoc=R',lu:'2026-11-21',effets:[
 {classe:'Affections hépatobiliaires',frequence:'tres_rare',effet:'hépatite'},
 {classe:'Affections hépatobiliaires',frequence:'rare',effet:'élévation des transaminases'},
 {classe:'Affections du rein et des voies urinaires',frequence:'non_precisee',effet:'toxicité rénale'},
 {classe:'Affections hématologiques et du système lymphatique',frequence:'tres_rare',effet:'thrombopénie'}]}}};
const ligne=id=>({id,qty:1,after:1,start:0,reduce:5,end:5});

test('Clé de notice : spécialité, substance, nom publié',()=>{
 assert.equal(cleNotice(produits.get('cis1'),lookup,produits),'02202');
 assert.equal(cleNotice(produits.get('sa02202'),lookup,produits),'02202');
 assert.equal(cleNotice(produits.get('paracetamol'),lookup,produits),'02202');
});

test('Une fiche par notice, un groupe par organe, tous les effets conservés',()=>{
 const [f]=fichesNotices([ligne('cis1'),ligne('paracetamol')],lookup,produits,donnees,5);
 assert.equal(fichesNotices([ligne('cis1'),ligne('paracetamol')],lookup,produits,donnees,5).length,1); // même combinaison : une fiche
 assert.equal(f.resultats.length,3);
 const foie=f.resultats.find(r=>/hépato/.test(r.titre));
 assert.deepEqual(foie.zones,['liver','gallbladder']);
 assert.match(foie.constat,/Rare.*transaminases/);
 assert.match(foie.constat,/Très rare.*hépatite/);
 assert.ok(f.resultats.find(r=>/rein/.test(r.titre)).zones.includes('kidney_l'));
 assert.ok(foie.url.startsWith('https://base-donnees-publique'));
});

test('Classes d’organes vers l’atlas',()=>{
 assert.deepEqual(zonesDeClasse('Affections cardiaques'),['heart']);
 assert.deepEqual(zonesDeClasse('Affections de la peau et du tissu sous-cutané'),['skin']);
 assert.deepEqual(zonesDeClasse('Troubles généraux'),[]);
});

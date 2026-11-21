import test from 'node:test';
import assert from 'node:assert/strict';
import {analyserAlcool,alcoolemie,autresMaladies,categorieBagnardi,facteurWidmark,interpoler,reperesAtlas} from '../src/exposure-risk.mjs';

const boisson=id=>({id,unit:'mL'});
// 50 g d’alcool pur par jour = 63,4 mL d’éthanol, soit ≈ 158,4 mL à 40 % vol.
const prise=(jours,mL=158.4,abv=40)=>[{id:'spiritueux',qty:mL,after:mL,start:0,reduce:jours,end:jours,abv}];
const homme={sexe:'male',age:45,poids:72,taille:175};

test('Catégories de Bagnardi aux bornes publiées',()=>{
 assert.equal(categorieBagnardi(0),null);
 assert.equal(categorieBagnardi(12.5),'legere');
 assert.equal(categorieBagnardi(12.6),'moderee');
 assert.equal(categorieBagnardi(50),'moderee');
 assert.equal(categorieBagnardi(50.1),'forte');
});

test('Facteur de Widmark de Forrest et alcoolémie calculée',()=>{
 const imc=72/1.75**2;
 assert.ok(Math.abs(facteurWidmark('male',72,175)-(1.0181-0.01213*imc))<1e-12);
 const a=alcoolemie(50,homme);
 assert.ok(Math.abs(a.pic-50/(a.r*72))<1e-12);
 assert.ok(a.bas<a.pic&&a.pic<a.haut);
 assert.equal(alcoolemie(0,homme),null);
 assert.equal(alcoolemie(50,{...homme,poids:0}),null);
});

test('Sans alcool : aucune analyse',()=>{
 assert.equal(analyserAlcool([{id:'eau',qty:500,after:500,start:0,reduce:5,end:5,abv:0}],boisson,homme,10),null);
});

test('50 g/j pendant 300 jours : catégorie modérée, résultats chiffrés et étiquetés',()=>{
 const a=analyserAlcool(prise(300),boisson,homme,300);
 assert.ok(Math.abs(a.moyenne-158.4*0.4*0.789)<1e-9);
 assert.equal(a.categorie,'moderee');
 assert.equal(a.nbJours,300);
 assert.equal(a.domaine,'extrapole'); // < 1 an : consommation habituelle non atteinte
 const r=id=>a.resultats.find(x=>x.id===id);
 assert.deepEqual([r('oesophage').rr,r('oesophage').bas,r('oesophage').haut],[2.23,1.87,2.65]);
 assert.equal(r('foie_cancer').rr,null); // pas de chiffre publié au niveau modéré
 assert.equal(r('foie_cancer').statut,'non_documente');
 assert.equal(r('sein'),undefined); // réservé au profil féminin
 assert.ok(Math.abs(r('fa').rr-1.08**(a.moyenne/10))<1e-12);
 assert.equal(r('cirrhose').rr,null); // < 5 verres/j chez l'homme
 for(const x of a.resultats)assert.ok(x.url.startsWith('https://'),x.id);
 assert.equal(r('alcoolemie').statut,'reglementaire');
});

test('Forte consommation et profil féminin : cirrhose et sein chiffrés',()=>{
 const a=analyserAlcool(prise(400,700),boisson,{...homme,sexe:'female'},400);
 assert.equal(a.categorie,'forte');
 assert.equal(a.domaine,'etudie');
 const r=id=>a.resultats.find(x=>x.id===id);
 assert.equal(r('sein').rr,1.61);
 assert.equal(r('cirrhose').rr,a.verres>=7?24.58:12.44);
 assert.equal(r('rein_cancer').rr,null); // pas de chiffre au niveau fort
});

test('Repères pour la carte : zones multiples, niveau et sens',()=>{
 const reperes=reperesAtlas(analyserAlcool(prise(30),boisson,homme,30));
 const bouche=reperes.find(r=>r.title.startsWith('Cancer de la bouche'));
 assert.deepEqual(bouche.zones,['pharynx','tongue']);
 assert.equal(bouche.sign,-1);
 assert.match(bouche.reason,/Extrapolation/);
 const rein=reperes.find(r=>r.title.startsWith('Cancer du rein'));
 assert.equal(rein.sign,1);
 assert.equal(rein.niveau,'favorable');
});

test('Interpolation log-linéaire entre points publiés',()=>{
 const pts=[[24,1.12,1.02,1.23],[60,1.33,1.06,1.67]];
 assert.deepEqual(interpoler(pts,24),{rr:1.12,bas:1.02,haut:1.23,exact:true});
 const m=interpoler(pts,42);assert.ok(m.rr>1.12&&m.rr<1.33&&!m.exact);
 assert.equal(interpoler(pts,10),null);
});

test('Maladies hors cancer : os, articulations, cœur, reins, infections',()=>{
 const homme50=autresMaladies({g:50,verres:50/12,femme:false}),r=id=>homme50.find(x=>x.id===id);
 assert.deepEqual([r('hypertension').rr,r('hypertension').bas],[1.51,1.30]); // 3 à 4 verres, homme
 assert.equal(r('avc_isch').rr,1.14); // 50 g = 4,2 verres : plus de 4 verres
 assert.ok(Math.abs(r('fractures').rr-1.06**(50/14))<1e-12);
 assert.equal(r('goutte').rr,1.69);
 assert.equal(r('polyarthrite').rr,null); // 50 g/j hors des points publiés
 assert.equal(r('pancreatite').niveau,'non_chiffre');
 assert.equal(r('irc').signe,1);
 assert.equal(r('tuberculose').rr,1.35);
 for(const x of homme50){assert.ok(x.url.startsWith('https://doi.org/'),x.id);assert.ok(x.pourquoi&&x.constat,x.id);}
 const femme12=autresMaladies({g:12,verres:1,femme:true}),f=id=>femme12.find(x=>x.id===id);
 assert.equal(f('diabete').rr,0.82);
 // Un chiffre sans intervalle publié ne doit pas casser les repères de la carte.
 assert.match(reperesAtlas({resultats:femme12.map(x=>({...x,domaine:'etudie'}))}).find(x=>x.title==='Diabète de type 2').reason,/intervalle non publié/);
 assert.equal(f('pancreatite').rr,0.76);
 assert.equal(f('polyarthrite').rr,0.88);
 assert.equal(f('polyarthrite').niveau,'favorable');
 assert.equal(f('hypertension').niveau,'non_chiffre'); // femmes 1–2 verres : IC inclut 1
});

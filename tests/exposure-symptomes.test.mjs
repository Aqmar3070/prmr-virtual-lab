import test from "node:test";
import assert from "node:assert/strict";
import {lireProfil,lireSymptomes,dureeGlobale,ficheSymptomes} from "../src/exposure-symptomes.mjs";
const recit="J’ai mal à la tête depuis quelques jours, j’ai pris du paracétamol et du café, ça fait maintenant 4 semaines. Je suis un homme de 45 ans.";
test("Profil, durée et symptômes lus dans un récit",()=>{
 assert.deepEqual(lireProfil(recit),{sexe:"male",age:45});
 assert.deepEqual(lireProfil("femme, 62 ans, 70 kg, 1m60"),{sexe:"female",age:62,poids:70,taille:160});
 assert.equal(dureeGlobale(recit),28);assert.equal(dureeGlobale("depuis 3 mois"),90);assert.equal(dureeGlobale("depuis quelques jours"),null);
 assert.deepEqual(lireSymptomes(recit).map(s=>s.nom),["mal de tête"]);
});
test("Symptôme rapproché des effets enregistrés, sans invention",()=>{
 const fiches=[{id:"n1",titre:"Notice officielle · Paracétamol",resultats:[{id:"a",titre:"Affections du système nerveux",zones:["brain"],signe:-1,niveau:"faible",constat:"Fréquent : céphalées\nRare : convulsions",source:"BDPM",url:"https://x"}]},
  {id:"c",titre:"Caféine",resultats:[{id:"b",titre:"Cœur",zones:["heart"],signe:-1,constat:"palpitations"}]}];
 const f=ficheSymptomes(lireSymptomes("j’ai mal à la tête"),fiches);
 assert.equal(f.resultats.length,1);assert.match(f.resultats[0].constat,/céphalées/);assert.equal(f.resultats[0].url,"https://x");
 const vide=ficheSymptomes(lireSymptomes("j’ai la diarrhée"),fiches);
 assert.match(vide.resultats[0].titre,/non décrit/);
 assert.equal(ficheSymptomes([],fiches),null);
});

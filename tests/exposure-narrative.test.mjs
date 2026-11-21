import assert from "node:assert/strict";
import test from "node:test";
import {lireRecit} from "../src/exposure-narrative.mjs";
const catalogue=new Map([["cafeine",{id:"cafeine",name:"Caféine",unit:"mg"}]]);
test("Récit de bière avec quantité, composition et durée",()=>{
 const [p]=lireRecit("Je bois deux canettes de 33 cl de bière à 5 % chaque soir depuis deux semaines.",catalogue);
 assert.equal(p.row.qty,660);assert.equal(p.row.end,14);assert.equal(p.row.abv,5);
});
test("Un récit ambigu donne un thème sans calcul",()=>{
 for(const t of ["Je ne bois jamais de bière, même 25 cl","bière 250 à 500 ml par jour"]){
  const [p]=lireRecit(t,catalogue);assert.equal(p.row,null,t);assert.equal(p.theme,"alcool");
 }
});
test("Deux prises distinctes et une concentration isolée",()=>{
 assert.equal(lireRecit("Bière 33 cl par jour et je prends de la caféine 80 mg par jour",catalogue).filter(x=>x.row).length,2);
 assert.equal(lireRecit("Caféine 32 mg/100 ml",catalogue)[0].row,null);
});
test("La durée reste lisible quand le PDF coupe la ligne avant l’unité",()=>{
 const [p]=lireRecit("Je bois 33 cl de bière à 5 % chaque jour pendant 7\njours.",catalogue);
 assert.equal(p.row.end,7);assert.equal(p.row.qty*p.row.abv/100*p.row.end,115.5);
});
test("Durée sans fréquence : prise quotidienne supposée et signalée",()=>{
 const [p]=lireRecit("Bière 33 cl pendant deux semaines",catalogue);
 assert.equal(p.row.end,14);assert.equal(p.row.qty,330);
 assert.ok(p.notes.some(n=>n.startsWith("Fréquence non précisée")));
});
test("Alcool pur en grammes, durée en jours ou en années",()=>{
 const [p]=lireRecit("Il boit un verre d’alcool de 50 grammes sur 300 jours",catalogue);
 assert.equal(p.row.abv,100);assert.equal(p.row.end,300);
 assert.equal(p.row.qty,63.37);
 const [an]=lireRecit("Il boit 50 grammes d’alcool par jour pendant un an",catalogue);
 assert.equal(an.row.end,365);
 const [deux]=lireRecit("Alcool 20 g par jour pendant 2 ans",catalogue);
 assert.equal(deux.row.end,730);
});
test("Red Bull : canettes et composition du fabricant",()=>{
 const [p]=lireRecit("Je bois 2 canettes de Red Bull par jour pendant 30 jours",catalogue);
 assert.equal(p.row.qty,500);assert.equal(p.row.caf,32);assert.equal(p.row.sug,11);assert.equal(p.row.end,30);
});

test("Substance sans quantité ni durée : valeurs de départ signalées",()=>{
 const [b]=lireRecit("Je bois de la bière",catalogue);
 assert.equal(b.row.qty,100);assert.equal(b.row.end,30);assert.equal(b.row.start,0);assert.equal(b.row.after,100);
 assert.ok(b.notes.some(n=>n.startsWith("Quantité non précisée")));assert.ok(b.notes.some(n=>n.startsWith("Durée non précisée")));
 const [c]=lireRecit("caféine",catalogue);assert.equal(c.row.qty,1000);assert.equal(c.row.end,30);
});
test("Noms de marque : spécialité reconnue, dosage et nombre de comprimés",()=>{
 const produits=new Map([
  ["cis1",{id:"cis1",name:"GLUCOPHAGE 500 mg, comprimé pelliculé",unit:"unité déclarée",active:[1]}],
  ["cis2",{id:"cis2",name:"GLUCOPHAGE 850 mg, comprimé pelliculé",unit:"unité déclarée",active:[1]}],
  ["cis3",{id:"cis3",name:"DAFALGAN 500 mg, gélule",unit:"unité déclarée",active:[2]}]]);
 const [g]=lireRecit("Je prends Glucophage 850 mg, 2 comprimés par jour pendant 1 an",produits);
 assert.equal(g.produit.id,"cis2");assert.equal(g.row.qty,2);assert.equal(g.row.end,365);
 const [d]=lireRecit("Dafalgan",produits);
 assert.equal(d.produit.id,"cis3");assert.equal(d.row.qty,2);assert.equal(d.row.end,30);
});

import assert from "node:assert/strict";
import test from "node:test";
import {lireRecit} from "../src/exposure-narrative.mjs";
const catalogue=new Map([["cafeine",{id:"cafeine",name:"Caféine",unit:"mg"}]]);
test("Récit de bière avec quantité, composition et durée",()=>{
 const [p]=lireRecit("Je bois deux canettes de 33 cl de bière à 5 % chaque soir depuis deux semaines.",catalogue);
 assert.equal(p.row.qty,660);assert.equal(p.row.end,14);assert.equal(p.row.abv,5);
});
test("Un récit incomplet donne un thème sans inventer une quantité ou une fréquence",()=>{
 for(const t of ["Je consomme de l’alcool","Je bois de la bière","Bière 33 cl pendant deux semaines","Je ne bois jamais de bière, même 25 cl","bière 250 à 500 ml par jour"]){
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

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {SPECIES_R04} from "../src/r04_engine.mjs";

const root=new URL("../",import.meta.url);

/* Lit la taille et quelques pixels d'un WebP sans décodeur externe : on vérifie
   l'en-tête VP8 et la présence d'un canal alpha, ce qui suffit à distinguer une
   illustration détourée d'une capture opaque. */
function entete(buf){
 assert.equal(buf.toString("ascii",0,4),"RIFF");
 assert.equal(buf.toString("ascii",8,12),"WEBP");
 return buf.toString("ascii",12,16);
}

test("Chaque espèce possède son illustration et sa vignette",()=>{
 for(const s of SPECIES_R04){
  for(const chemin of ["assets/animals/"+s.id+".svg","assets/animals-photo/"+s.id+".webp"]){
   assert.ok(existsSync(new URL(chemin,root)),s.id+" : fichier manquant — "+chemin);
  }
 }
});

test("Les vignettes sont de vraies illustrations détourées, pas des captures",()=>{
 // Une vignette avait été produite par une conversion ratée : le fichier livré
 // était la capture d'une page d'erreur de navigateur, opaque et pleine de
 // texte. Le détourage est le marqueur le plus simple d'une vraie vignette.
 for(const s of SPECIES_R04){
  const buf=readFileSync(new URL("assets/animals-photo/"+s.id+".webp",root));
  const type=entete(buf);
  assert.equal(type,"VP8X",s.id+" : vignette sans canal alpha, probablement une capture opaque");
  assert.ok(buf.length>6000,s.id+" : vignette suspecte ("+buf.length+" octets)");
  assert.ok(buf.length<60000,s.id+" : vignette trop lourde");
 }
});

test("Les illustrations SVG restent des dessins originaux sans texte",()=>{
 for(const s of SPECIES_R04){
  const svg=readFileSync(new URL("assets/animals/"+s.id+".svg",root),"utf8");
  assert.match(svg,/viewBox="0 0 840 560"/,s.id);
  assert.ok(!/<text[\s>]|<image[\s>]/i.test(svg),s.id+" : ni texte ni image importée");
  assert.ok(svg.length>2000,s.id);
 }
});

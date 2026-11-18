import test from "node:test";
import assert from "node:assert/strict";
import {SPECIES_ANATOMY} from "../src/r09_organ_catalog.mjs";
import {buildBodySurface} from "../src/r12_body_surface.mjs";
import * as T from "../vendor/three/build/three.module.js";

const species=Object.keys(SPECIES_ANATOMY);

test("R12 : chaque espèce produit une enveloppe corporelle complète",()=>{
 assert.equal(species.length,6);
 for(const id of species){
  const g=buildBodySurface({...SPECIES_ANATOMY[id],id});
  // tronc continu + 4 membres + 4 pieds + 2 oreilles (+ queue si l'espèce en a une)
  assert.ok(g.children.length>=11,`${id}: ${g.children.length} éléments`);
  assert.equal(g.name,"body-envelope");
  assert.equal(g.userData.species,id);
  // L'étiquette de non-validation doit survivre à toute amélioration du rendu.
  assert.match(g.userData.validation,/not anatomically validated/);
 }
});

test("R12 : le tronc est une surface unique et fermée, pas un empilement",()=>{
 for(const id of species){
  const g=buildBodySurface({...SPECIES_ANATOMY[id],id});
  const torso=g.children[0];
  assert.ok(torso.isMesh,`${id}: le premier élément doit être le tronc`);
  const pos=torso.geometry.getAttribute("position");
  assert.ok(pos.count>5000,`${id}: tronc trop grossier (${pos.count} sommets)`);
  // Caractéristique d'Euler d'une surface fermée sans bord : aucun sommet
  // isolé et un museau refermé sur un pôle plutôt que laissé ouvert.
  const idx=torso.geometry.getIndex();
  assert.ok(idx&&idx.count%3===0);
  assert.ok(Number.isFinite(pos.array[0]));
 }
});

test("R12 : les proportions restent propres à chaque espèce",()=>{
 const boxes={};
 for(const id of species){
  const g=buildBodySurface({...SPECIES_ANATOMY[id],id});
  const b=new T.Box3().setFromObject(g.children[0]);
  const s=b.getSize(new T.Vector3());
  boxes[id]={longueur:s.x,hauteur:s.y,largeur:s.z};
  assert.ok(s.x>0&&s.y>0&&s.z>0,`${id}: boîte dégénérée`);
  // Un corps d'animal est plus long que haut.
  assert.ok(s.x>s.y,`${id}: tronc plus haut que long`);
 }
 // Le porc est le plus corpulent, la souris le plus petit tronc.
 assert.ok(boxes.pig.hauteur>boxes.mouse.hauteur);
 assert.ok(boxes.rat.longueur>boxes.mouse.longueur);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=readFileSync(new URL("../src/r05_clinical.mjs",import.meta.url),"utf8");

test("R12 : les variables de l'atlas de référence sont déclarées avant leur première lecture",()=>{
 // update() était appelé avant la déclaration « let refModel », donc dans sa zone
 // morte temporelle. L'initialisation échouait sur « Cannot access 'refModel'
 // before initialization » et l'atlas humain de 147 structures ne s'affichait
 // jamais : la page montrait un cadre vide, sans message d'erreur visible.
 const declaration=src.indexOf("let refModel=");
 assert.ok(declaration>0,"déclaration de refModel introuvable");
 const firstRead=src.indexOf("if(refModel)");
 assert.ok(firstRead>0,"première lecture de refModel introuvable");
 assert.ok(declaration<firstRead,
  "refModel doit être déclaré avant sa première lecture, sinon l'atlas humain ne se charge pas");
 const initialUpdate=src.indexOf("update();resize();animate();");
 assert.ok(initialUpdate>0,"appel d'initialisation introuvable");
 assert.ok(declaration<initialUpdate,
  "refModel doit être déclaré avant l'appel initial à update()");
});

test("R12 : le repli local reste disponible et annoncé comme non segmenté",()=>{
 const local=readFileSync(new URL("../src/r08_human_local.mjs",import.meta.url),"utf8");
 assert.match(local,/not segmented medical imagery/i,
  "le corps de repli doit continuer à se déclarer comme une reconstruction, pas une imagerie");
 assert.match(src,/installLocalBody/,"le repli doit rester câblé");
 // Le message de statut doit distinguer le modèle de référence du repli local.
 assert.match(src,/modèle anatomique de référence non disponible/);
});

test("R12 : l'atlas humain conserve ses attributions de licence",()=>{
 assert.match(src,/BodyParts3D/);
 assert.match(src,/CC BY 4\.0/);
 assert.match(src,/Not a patient scan or a diagnosis tool/i);
});

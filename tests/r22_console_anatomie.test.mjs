/* PRMR — la console anatomique suit le plan livré avec les images.
 *
 * « Grand corps humain entier central (vue 3D) ; navigation des systèmes et
 * couches à gauche ; fiche détaillée, mesures d'études et sources à droite. »
 * La page empilait deux panneaux pleine largeur, tous les réglages entassés
 * sous le canevas. La recomposition ne change aucune logique : les mêmes
 * identifiants, les mêmes commandes, replacés. Ces vérifications empêchent
 * qu'une commande disparaisse en route.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../clinical.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../prmr-console.css", import.meta.url), "utf8");

test("les trois colonnes existent, dans l'ordre prescrit", () => {
  const console3 = page.slice(page.indexOf('class="prmr-console"'), page.indexOf('</div>\n\n</div>') + 14);
  const cote = console3.indexOf("prmr-console-side");
  const scene = console3.indexOf("prmr-console-stage");
  const lecture = console3.indexOf("prmr-console-read");
  assert.ok(cote > 0 && scene > cote && lecture > scene,
    "l'ordre doit être réglages, corps, lecture — la colonne du corps au centre");
});

test("aucune commande n'a disparu dans la recomposition", () => {
  for (const id of ["human-canvas", "human-systems", "human-organs", "structure-search",
                    "structure-list", "organ-info", "model-status", "show-all-layers",
                    "toggle-body", "toggle-isolate", "reset-view", "reload-reference"]) {
    assert.ok(page.includes('id="' + id + '"'), "commande perdue : " + id);
  }
  for (const sexe of ["male", "female"]) {
    assert.ok(page.includes('data-sex="' + sexe + '"'), "sélecteur de corps perdu : " + sexe);
  }
});

test("le corps occupe la colonne centrale, pas une vignette", () => {
  assert.match(css, /\.prmr-console-stage canvas \{[^}]*height: min\(74vh, 720px\)/,
    "le canevas doit prendre la hauteur disponible");
  assert.match(css, /grid-template-columns: minmax\(230px, 280px\) minmax\(360px, 1fr\)/,
    "la colonne centrale doit être la plus large");
});

test("les colonnes latérales défilent seules", () => {
  /* Sans cela, une liste de 147 structures dépliée pousse le corps hors de
     l'écran. */
  assert.match(css, /\.prmr-console-side,\s*\.prmr-console-read \{[^}]*position: sticky/);
  assert.match(css, /\.prmr-console-side,\s*\.prmr-console-read \{[^}]*overflow-y: auto/);
});

test("sur écran étroit, rien ne reste collant", () => {
  /* Des colonnes collantes empilées se chevauchent. */
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.prmr-console-side \{ position: static/);
});

test("la page des espèces suit son propre plan", () => {
  /* « Sélecteur espèce à gauche ; animal entier 3D central ; couches et
     organes à droite ; PK exploratoire en bande secondaire. » Le sélecteur
     barrait la page en bandeau, l'animal et ses paramètres partageaient un
     panneau. */
  const atlas = readFileSync(new URL("../src/r04_atlas.mjs", import.meta.url), "utf8");
  assert.match(atlas, /colGauche\.append\(make\("div","overline","Espèce"\),chooser\)/,
    "le sélecteur d'espèce doit être dans la colonne de gauche");
  assert.match(atlas, /portraitPanel\.append\(portrait,portraitOverlay\);colCentre\.append\(portraitPanel\)/,
    "l'animal doit occuper la colonne centrale, seul");
  assert.match(atlas, /colDroite\.append\(make\("div","overline","Couches et organes"\),organToolbar/,
    "couches et organes doivent être à droite");
  assert.ok(!/profileGrid/.test(atlas), "l'ancien panneau profil doit être démonté, pas contourné");
  assert.ok(!/shell\.append\(chooser\)/.test(atlas), "le sélecteur ne doit plus barrer la page");
});

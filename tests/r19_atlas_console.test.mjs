/* PRMR — l'atlas réel au centre de la console.
 *
 * La console montrait une silhouette dessinée à la main alors que le dépôt
 * contient un atlas anatomique réel, déjà utilisé par la page clinique.
 * Ces vérifications gardent trois choses : que les organes du registre
 * correspondent à des maillages qui existent vraiment dans l'atlas, que le
 * schéma reste en réserve si le modèle ne se charge pas, et que la couleur
 * continue de ne rien dire de l'état d'un organe.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ORGAN_NODES } from "../src/r19_body_viewer.mjs";
import { ORGAN_LABELS } from "../src/r13_body_map.mjs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("chaque organe du registre pointe vers des maillages qui existent", () => {
  const manifest = JSON.parse(read("assets/human3d/manifest.json"));
  const noeuds = new Set(manifest.files["anatomy-male.glb"].named_nodes);
  for (const [organe, cibles] of Object.entries(ORGAN_NODES)) {
    assert.ok(ORGAN_LABELS[organe], organe + " n'a pas d'intitulé");
    assert.ok(cibles.length > 0, organe + " ne vise aucun maillage");
    for (const noeud of cibles) {
      assert.ok(noeuds.has(noeud), organe + " vise « " + noeud + " », absent de l'atlas");
    }
  }
});

test("les organes du registre sont tous représentés dans l'atlas", () => {
  const data = JSON.parse(read("research-data/r13_exposures.json"));
  const utilises = new Set();
  for (const substance of data.substances) {
    for (const t of substance.thresholds) if (t.organ) utilises.add(t.organ);
    for (const cle of ["chronic_warning", "renal_note"]) {
      if (substance[cle]?.organ) utilises.add(substance[cle].organ);
    }
  }
  for (const organe of utilises) {
    assert.ok(ORGAN_NODES[organe], "le registre marque « " + organe + " », que l'atlas 3D ne sait pas allumer");
  }
});

test("le schéma reste en réserve si l'atlas ne se charge pas", () => {
  const src = read("src/r13_exposures.mjs");
  assert.match(src, /bodyPanel\.hidden = true;/, "le schéma doit être masqué quand l'atlas prend sa place");
  assert.match(src, /catch\(erreur => \{[\s\S]*?bodyPanel\.hidden = false;/,
    "il doit réapparaître si le modèle échoue, plutôt que de laisser un carré vide");
});

test("la couleur ne dit toujours rien de l'état d'un organe", () => {
  const viewer = read("src/r19_body_viewer.mjs");
  assert.match(viewer, /ne fait pas : représenter un état, une lésion/,
    "la règle doit rester écrite en tête du module");
  const src = read("src/r13_exposures.mjs");
  /* La légende est écrite avec des échappements \u2019 dans la source. */
  assert.match(src, /jamais l(\\u2019|’)état d(\\u2019|’)un organe/,
    "la légende doit rester affichée à côté de la figure");
});

test("les teintes CSS sont résolues avant d'atteindre WebGL", () => {
  /* ORGAN_FILL vaut « var(--prmr-vigilance) » : passé tel quel à three.js,
     il donnerait un organe noir sans erreur visible. */
  const src = read("src/r13_exposures.mjs");
  assert.match(src, /getComputedStyle\(document\.documentElement\)\.getPropertyValue/);
});

test("la carte d'étiquettes couvre le catalogue, clé pour clé", () => {
  /* Carte produite hors session et livrée par l'utilisateur. Elle n'entre
     dans le dépôt que recoupée : une clé inventée poserait une étiquette sur
     un organe qui n'existe pas. */
  const carte = JSON.parse(read("research-data/r19_atlas_labels.json"));
  const catalogue = JSON.parse(read("research-data/r05_human_anatomy_catalog.json"));
  const connues = new Set(catalogue.map(e => e.key));
  assert.equal(carte.labels.length, catalogue.length,
    "la carte doit couvrir exactement le catalogue");
  for (const l of carte.labels) {
    assert.ok(connues.has(l.key), "clé inconnue du catalogue : " + l.key);
    assert.ok(l.fr && l.region, l.key + " : intitulé ou région manquant");
  }
  const vues = new Set(carte.labels.map(l => l.key));
  for (const e of catalogue) assert.ok(vues.has(e.key), "clé absente de la carte : " + e.key);
});

test("les coordonnées livrées sont celles du catalogue, pas des inventions", () => {
  const carte = JSON.parse(read("research-data/r19_atlas_labels.json"));
  const catalogue = new Map(JSON.parse(read("research-data/r05_human_anatomy_catalog.json")).map(e => [e.key, e]));
  const avecCoordonnees = carte.labels.filter(l => l.ancre_male);
  assert.equal(avecCoordonnees.length, 12,
    "seules les 12 articulations ont un point dans le catalogue ; aucune autre ne doit en recevoir");
  for (const l of avecCoordonnees) {
    assert.deepEqual(l.ancre_male, catalogue.get(l.key).anchor, l.key + " : coordonnée divergente");
    assert.deepEqual(l.ancre_female, catalogue.get(l.key).anchorFemale, l.key + " : coordonnée divergente");
  }
  assert.match(carte.provenance.ancrages, /Aucune coordonnée n'a été inventée/);
});

test("les étiquettes s'écartent au lieu de se recouvrir", () => {
  /* Posée chacune à la hauteur de son organe, trois organes voisins donnaient
     trois boîtes empilées au même endroit, dont deux illisibles. */
  const src = read("src/r13_exposures.mjs");
  assert.match(src, /colonnes\[point\.x < rect\.width \/ 2 \? "gauche" : "droite"\]/,
    "les étiquettes doivent se répartir par côté");
  assert.match(src, /plancher = y \+ h \+ ECART;/,
    "elles doivent s'écarter verticalement");
  assert.match(src, /if \(debord > 0\)/,
    "une pile qui déborde doit être remontée, pas tronquée");
});

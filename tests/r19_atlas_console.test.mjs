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

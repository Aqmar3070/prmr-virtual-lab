/* PRMR — la figure des organes concernés.
 *
 * Le registre indique pour chaque repère l'organe qu'il concerne. La figure
 * marque ces organes et rien de plus : la couleur qualifie la nature du
 * repère franchi, jamais l'état de l'organe. Ces vérifications empêchent la
 * dérive vers une carte de lésions, qu'aucune donnée ne permettrait.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { organStates, ORGAN_LABELS, ORGAN_FILL } from "../src/r13_body_map.mjs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("le statut le plus grave l'emporte, organe par organe", () => {
  const states = organStates([
    { organ: "kidneys", status: "reglementaire" },
    { organ: "kidneys", status: "toxique_etabli" },
    { organ: "heart", status: "association_observee" },
    { organ: "heart", status: "reglementaire" },
    { organ: "liver", status: "non_documente" },
    { organ: null, status: "toxique_etabli" },
    null
  ]);
  assert.equal(states.kidneys, "toxique_etabli", "une toxicité établie ne doit pas disparaître derrière un plafond");
  assert.equal(states.heart, "association_observee");
  assert.equal(states.liver, undefined, "un statut sans rang ne doit pas colorer un organe");
});

test("chaque organe du registre a un intitulé et chaque statut une couleur", () => {
  const data = JSON.parse(read("research-data/r13_exposures.json"));
  const used = new Set();
  for (const substance of data.substances) {
    for (const key of substance.organs || []) used.add(key);
    for (const t of substance.thresholds) if (t.organ) used.add(t.organ);
  }
  for (const key of used) {
    assert.ok(ORGAN_LABELS[key], "organe sans intitulé dans la figure : " + key);
  }
  for (const status of ["toxique_etabli", "association_observee", "reglementaire"]) {
    assert.ok(ORGAN_FILL[status], "statut sans couleur : " + status);
  }
});

test("seuls les repères franchis marquent la figure", () => {
  const src = read("src/r13_exposures.mjs");
  assert.match(src, /const marques = crossed\.slice\(\);/,
    "la figure doit partir des repères franchis, pas de tous les repères");
  assert.ok(!/marques\.push\(substance\.renal_note\)/.test(src),
    "une mise en garde permanente ne doit pas dépendre de la dose choisie");
  assert.match(src, /jamais l.u2019état d.u2019un organe|jamais l’état d’un organe/,
    "la légende doit dire que la couleur ne qualifie pas l'organe");
});

test("la couleur passe par le style en ligne, pas par un attribut SVG", () => {
  /* Un attribut de présentation SVG cède devant n'importe quelle règle CSS :
     la règle de repos l'emportait et aucun organe ne se colorait. */
  const src = read("src/r13_body_map.mjs");
  assert.match(src, /shape\.style\.fill = ORGAN_FILL\[status\]/);
  assert.ok(!/setAttribute\("fill", ORGAN_FILL/.test(src));
});

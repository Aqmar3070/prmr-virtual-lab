/* PRMR — compter en portions, et le plafond que commande le rein.
 *
 * Deux ajouts à l'explorateur d'expositions, et deux manières de se tromper
 * qu'ils rendent possibles :
 *
 *   — personne ne compte sa caféine en milligrammes. Les portions de
 *     référence la convertissent en tasses, et chaque teneur doit porter sa
 *     source comme n'importe quel autre chiffre du registre ;
 *   — pour la metformine, le repère opposé à la dose n'est pas un plafond
 *     unique mais une table indexée sur le débit de filtration glomérulaire.
 *     Les bornes doivent couvrir toute l'échelle sans trou ni recouvrement,
 *     sans quoi un réglage tomberait entre deux bandes et n'afficherait
 *     aucun plafond.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const data = JSON.parse(read("research-data/r13_exposures.json"));
const find = id => data.substances.find(s => s.id === id);

test("chaque portion de référence porte sa teneur, son pluriel et sa source", () => {
  for (const substance of data.substances) {
    for (const portion of substance.portions || []) {
      assert.ok(portion.label && portion.plural, substance.id + " : portion sans accord au pluriel");
      assert.ok(Number.isFinite(portion.mg) && portion.mg > 0, substance.id + " : portion sans teneur");
      assert.ok(portion.source && portion.url, portion.label + " : teneur sans source");
      assert.equal(portion.mg % substance.dose_step, 0,
        portion.label + " : la teneur doit être un multiple du pas du curseur, sinon la valeur affichée s'écarte de la valeur réelle");
    }
  }
});

test("les bandes de fonction rénale couvrent l'échelle sans trou", () => {
  const met = find("metformine");
  assert.ok(met, "la metformine doit être au registre");
  const bands = met.renal_bands.slice().sort((a, b) => a.min - b.min);
  assert.equal(bands[0].min, 0, "la bande la plus basse doit partir de zéro");
  assert.equal(bands[bands.length - 1].max, null, "la bande la plus haute doit être ouverte");
  for (let i = 1; i < bands.length; i++) {
    assert.equal(bands[i].min, bands[i - 1].max + 1,
      "trou ou recouvrement entre " + bands[i - 1].label + " et " + bands[i].label);
  }
  assert.ok(met.renal_bands_source.source && met.renal_bands_source.url, "table sans source");
});

test("le plafond baisse quand la fonction rénale baisse", () => {
  const bands = find("metformine").renal_bands.slice().sort((a, b) => a.min - b.min);
  for (let i = 1; i < bands.length; i++) {
    assert.ok(bands[i].max_daily >= bands[i - 1].max_daily,
      "un débit plus élevé ne peut pas autoriser moins : " + bands[i].label);
  }
  assert.equal(bands[0].max_daily, 0, "en insuffisance rénale sévère, aucune dose n'est prévue");
});

test("le réglage de fonction rénale ne s'affiche que là où une table existe", () => {
  const src = read("src/r13_exposures.mjs");
  assert.match(src, /dfgField\.hidden = !bands;/,
    "le réglage doit disparaître pour les substances sans table");
  assert.match(read("exposures.html"), /\[hidden\]\{display:none!important\}/,
    "sans cette règle, un champ masqué reste affiché par sa propre mise en page");
});

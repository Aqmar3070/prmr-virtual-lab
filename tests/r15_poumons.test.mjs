/* PRMR — ce que l'atlas contient vraiment.
 *
 * L'utilisateur signalait ne pas percevoir les poumons. Vérification faite en
 * rendant chaque maillage isolément, hors de la page : les nœuds « lung_l » et
 * « lung_r » des deux corps ne portent pas le parenchyme, mais l'arbre
 * vasculaire et bronchique intrapulmonaire. Le cœur, le foie et les reins,
 * eux, sont bien des volumes pleins.
 *
 * Un atlas scientifique ne peut pas présenter un arbre vasculaire sous le nom
 * d'un organe. Ces vérifications figent la correction : l'intitulé dit ce que
 * le fichier contient, et le constat reste consigné avec les maillages.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("les maillages pulmonaires ne sont pas annoncés comme des poumons pleins", () => {
  const src = read("src/r05_clinical.mjs");
  assert.match(src, /lung_l:"Poumon gauche — arbre vasculaire"/);
  assert.match(src, /lung_r:"Poumon droit — arbre vasculaire"/);
  assert.ok(!/structure:"Poumon gauche : deux lobes/.test(src),
    "la description promet encore des alvéoles que le maillage ne contient pas");
});

test("la page dit à l'écran ce qui manque", () => {
  const page = read("clinical.html");
  assert.match(page, /parenchyme alvéolaire est absent/);
});

test("le constat est consigné avec les maillages", () => {
  const manifest = JSON.parse(read("assets/human3d/manifest.json"));
  const v = manifest.verifications;
  assert.ok(v, "aucune vérification consignée");
  const poumons = v.constat.find(c => c.noeuds.includes("lung_l"));
  assert.ok(poumons, "le constat sur les poumons n'est pas consigné");
  assert.deepEqual(poumons.verifie_sur, ["anatomy-male.glb", "anatomy-female.glb"],
    "le constat doit porter sur les deux corps");
  assert.ok(v.manque_identifie.includes("Parenchyme pulmonaire"));
});

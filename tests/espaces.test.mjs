// Trois espaces depuis le 28/11/2026 : préclinique, clinique, molécules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = n => readFileSync(new URL("../" + n, import.meta.url), "utf8");
const json = n => JSON.parse(read(n));

test("l'accueil mène aux trois espaces et plus aux anciennes rubriques", () => {
  const home = read("index.html");
  for (const page of ["preclinique.html", "exposures.html", "molecules.html"]) assert.match(home, new RegExp('href="\\./' + page.replace(".", "\\.")));
  for (const ancienne of ["preclinical.html", "species-r04.html", "risk-r03.html", "clinical.html", "screening.html"]) assert.ok(!home.includes(ancienne), ancienne);
  const route = read("src/prmr_route.mjs");
  for (const ancienne of ["preclinical.html", "species-r04.html", "risk-r03.html", "clinical.html", "screening.html"]) assert.ok(!route.includes('file: "' + ancienne), ancienne);
});

test("l'explorateur d'exposition s'appelle désormais explorateur clinique", () => {
  assert.match(read("exposures.html"), /<title>Explorateur clinique/);
});

test("base préclinique : espèces nommées, aucune donnée sans source", () => {
  const b = json("research-data/preclinique.json");
  assert.ok(b.especes.length >= 10);
  for (const e of b.especes) assert.ok(e.id && e.nom && e.nom_latin && b.groupes[e.groupe], e.id);
  for (const cle of ["substances", "maladies", "symptomes"]) for (const x of b[cle]) assert.ok(x.source && b.sources[x.source]?.url, cle + " " + x.id);
});

test("molécules et plantes viennent du registre ; une combinaison ne calcule rien", async () => {
  const { regrouper, combiner } = await import("../src/molecules.mjs");
  const g = regrouper(json("research-data/maladies.json"));
  assert.ok(g.molecules.some(x => x.nom === "Dapagliflozine"));
  assert.ok(g.plantes.length > 10 && g.plantes.every(x => x.classe === "plantes"));
  const a = g.molecules.find(x => x.nom === "Dapagliflozine"), b = g.molecules.find(x => x.nom === "Finérénone");
  const r = combiner([a, b], [{ a: "Dapagliflozine", b: "Finérénone", nature: "favorable", effet: "test" }]);
  assert.equal(r.interactions.length, 1);
  assert.equal(r.maladies[0].communs, 2);
  assert.ok(!("score" in r) && !("probabilite" in r));
  const base = json("research-data/molecules.json");
  for (const i of base.interactions) assert.ok(base.sources[i.source]?.url, i.a + " + " + i.b);
});

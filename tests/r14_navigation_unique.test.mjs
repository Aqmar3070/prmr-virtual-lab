/* PRMR — une seule navigation.
 *
 * L'accueil portait les cinq phases trois fois : dans la barre du haut, dans
 * le rail de gauche, puis dans les cartes du corps de page, chaque fois avec
 * des intitulés différents. clinical.html ajoutait par-dessus son propre plan
 * A–E, à côté des rubriques. On ne savait plus laquelle suivre.
 *
 * Ces vérifications figent la règle : les phases se naviguent depuis la barre
 * injectée par prmr_route, et chaque page n'a qu'un seul système d'onglets.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const PHASES = ["preclinical.html", "species-r04.html", "screening.html", "risk-r03.html", "clinical.html"];

test("le rail de l'accueil ne reprend pas les pages de phase", () => {
  const home = read("index.html");
  const sidebar = home.slice(home.indexOf("<aside"), home.indexOf("</aside>"));
  for (const page of PHASES) {
    assert.ok(!sidebar.includes(page), `${page} est encore dans le rail : la barre du haut la porte déjà`);
  }
});

test("la marque n'apparaît qu'une fois sur l'accueil", () => {
  const home = read("index.html");
  assert.ok(!home.includes('class="identity"'), "le bloc de marque du rail double celui de la barre du haut");
});

test("aucune page n'ajoute un second plan d'ancres à côté des rubriques", () => {
  for (const page of PHASES.concat("index.html", "exposures.html")) {
    const html = read(page);
    if (!html.includes("data-prmr-tab")) continue;
    assert.ok(!html.includes("prmr-clinical-index"), `${page} porte encore un plan d'ancres en plus des rubriques`);
  }
});

test("la barre de rubriques se place au premier niveau de la page", () => {
  const tabs = read("src/prmr_tabs.mjs");
  assert.match(tabs, /while \(anchor\.parentNode && anchor\.parentNode !== page\)/,
    "la barre doit remonter hors des grilles, sinon elle est coincée dans une colonne");
});

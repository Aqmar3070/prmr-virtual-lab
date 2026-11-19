/* PRMR — l'habillage console doit effectivement s'appliquer.
 *
 * Écrit d'abord dans le système de design, il était écrasé par les styles
 * propres de chaque page : huit pages écrites à des moments différents,
 * chargées après lui, et gagnantes à spécificité égale. Il restait invisible
 * sans qu'aucune erreur ne le signale — le genre de défaut qu'on ne voit
 * qu'en comparant deux captures.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const PAGES = ["index.html", "exposures.html", "clinical.html", "preclinical.html",
               "risk-r03.html", "species-r04.html", "research.html", "screening.html"];

test("chaque page charge l'habillage, et en dernier", () => {
  for (const page of PAGES) {
    const html = read(page);
    const skin = html.indexOf("prmr-console.css");
    assert.ok(skin > 0, page + " ne charge pas l'habillage");
    const tete = html.indexOf("</head>");
    assert.ok(skin < tete, page + " : l'habillage doit être dans l'en-tête");
    for (const autre of ["prmr-design-system.css", "laboratory.css", "r04-atlas.css", "prmr-route.css"]) {
      const pos = html.indexOf(autre);
      if (pos > 0) assert.ok(pos < skin, page + " : " + autre + " doit précéder l'habillage, sinon il l'écrase");
    }
    const style = html.lastIndexOf("</style>");
    if (style > 0) assert.ok(style < skin, page + " : les styles de page doivent précéder l'habillage");
  }
});

test("l'habillage ne touche pas à la grammaire de provenance", () => {
  /* Les quatre statuts doivent rester distincts : un habillage ne doit pas
     rendre un indice exploratoire plus affirmatif qu'il n'est. */
  const skin = read("prmr-console.css");
  assert.ok(!/--prmr-(measured|computed|hypothesis|unavailable)\s*:/.test(skin),
    "l'habillage ne doit pas redéfinir les teintes de provenance");
  assert.ok(!/\.prmr-evidence[^-]/.test(skin),
    "l'habillage ne doit pas modifier les blocs de provenance");
  const tokens = read("prmr-design-system.css");
  const teintes = ["--prmr-measured", "--prmr-computed", "--prmr-hypothesis", "--prmr-unavailable", "--prmr-vigilance"];
  const vues = new Set();
  for (const t of teintes) {
    const m = tokens.match(new RegExp(t + ":\\s*(#[0-9a-f]{6})", "i"));
    assert.ok(m, t + " introuvable");
    assert.ok(!vues.has(m[1]), "deux statuts partagent la teinte " + m[1]);
    vues.add(m[1]);
  }
});

test("la lueur se retire pour qui demande moins d'effets", () => {
  assert.match(read("prmr-console.css"), /@media \(prefers-reduced-motion: reduce\)/);
});

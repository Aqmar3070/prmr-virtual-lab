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
  /* Première version de cette vérification : elle comparait l'habillage à une
     liste de feuilles connues. De nouvelles feuilles ont été ajoutées après
     lui — elles n'étaient pas dans la liste, la vérification passait, et
     l'habillage était de nouveau écrasé sans rien signaler. Elle exige
     désormais la dernière place, quelle que soit la feuille qui arrive. */
  for (const page of PAGES) {
    const html = read(page);
    const tete = html.indexOf("</head>");
    assert.ok(tete > 0, page + " : en-tête introuvable");
    const feuilles = [...html.slice(0, tete).matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)];
    assert.ok(feuilles.length > 0, page + " ne charge aucune feuille");
    const derniere = feuilles[feuilles.length - 1][0];
    assert.match(derniere, /prmr-console\.css/,
      page + " : l'habillage doit être la dernière feuille, sinon il est écrasé. Dernière trouvée : " + derniere);
    const style = html.lastIndexOf("</style>");
    if (style > 0) {
      assert.ok(style < html.indexOf("prmr-console.css"),
        page + " : les styles de page doivent précéder l'habillage");
    }
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

test("l'accueil tient en un écran", () => {
  /* La console d'accueil a un rapport de forme fixe et prenait toute la
     largeur : sur 1440 px elle mesurait 810 px de haut, et le bandeau, le fil
     d'Ariane et les blocs qui suivaient la poussaient hors de l'écran. */
  const skin = read("prmr-console.css");
  assert.match(skin, /width: min\(100%, calc\(\(100svh - var\(--prmr-home-chrome\)\) \* var\(--prmr-home-ratio\)\)\)/,
    "la console doit être bornée par la hauteur disponible, pas par la largeur");
  assert.match(skin, /min-height: calc\(100svh - var\(--prmr-bar, 0px\)\)/,
    "le corps de page doit déduire le bandeau, sinon la page fait toujours un écran de plus");

  const fit = read("src/r23_home_fit.mjs");
  assert.match(fit, /document\.documentElement\.scrollHeight - hauteurConsole/,
    "la hauteur hors console doit être mesurée, pas écrite en dur");
  assert.match(fit, /--prmr-bar/, "la hauteur du bandeau doit être publiée");
  assert.ok(read("index.html").includes("r23_home_fit.mjs"), "l'accueil doit charger l'ajustement");
});

test("ce qui prolongeait l'accueil est replié, pas supprimé", () => {
  const home = read("index.html");
  assert.match(home, /<details class="prmr-fold">/, "l'état du programme doit rester atteignable");
  assert.match(home, /État réel du programme/, "le rappel de stade ne doit pas disparaître");
  assert.ok(!home.includes('id="home-workshops"'),
    "les ateliers du poste doivent quitter l'accueil : le rail de gauche les porte déjà");
  assert.ok(!home.includes('href="#home-workshops"'), "aucune ancre ne doit pointer vers un bloc retiré");
});

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

/* Les trois feuilles de base : jetons, mise en page générale, bandeau. Ce sont
   celles que l'habillage est fait pour recouvrir. Les feuilles de composant
   (renal-display, molecular-viewer) et de page (risk-console, exposure-console)
   peuvent légitimement le suivre pour l'affiner là où elles s'appliquent. */
const BASE = ["prmr-design-system.css", "laboratory.css", "prmr-route.css"];

test("l'habillage passe après les feuilles de base", () => {
  /* Trois versions de cette vérification, et deux pièges.
   *
   * La première comparait l'habillage à une liste de feuilles connues : les
   * feuilles ajoutées ensuite n'y figuraient pas, elle passait, et l'habillage
   * était écrasé sans rien signaler. La deuxième exigeait la dernière place —
   * trop strict : une feuille propre à une page doit pouvoir l'affiner. La
   * troisième exigeait de précéder toute feuille partagée — trop grossier :
   * une feuille de composant est partagée sans être une feuille de base.
   *
   * Ce qui compte est l'ordre avec la couche de base, et rien d'autre : une
   * page qui veut se démarquer doit pouvoir le faire, sur elle seule. */
  for (const page of PAGES) {
    const html = read(page);
    const tete = html.indexOf("</head>");
    const habillage = html.indexOf("prmr-console.css");
    /* Une page reconstruite en console autonome ne charge pas l'habillage
       partagé : elle porte le sien. Rien à vérifier pour elle. */
    if (habillage < 0) continue;
    assert.ok(habillage < tete, page + " charge l'habillage hors de son en-tête");

    for (const base of BASE) {
      const pos = html.indexOf(base);
      if (pos > 0) {
        assert.ok(pos < habillage,
          page + " : " + base + " est une feuille de base et doit précéder l'habillage, sinon elle l'écrase");
      }
    }
    /* Les styles en balise d'une page ne sont plus contraints : ils affinent
       cette page-là et doivent pouvoir le faire. */
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

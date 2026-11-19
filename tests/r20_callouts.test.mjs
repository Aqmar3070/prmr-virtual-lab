/* PRMR — les étiquettes n'existent qu'en un exemplaire.
 *
 * Écrites d'abord dans la console de doses, elles servent aussi sur la page
 * des espèces. Deux copies auraient divergé : un défaut corrigé d'un côté
 * serait resté de l'autre.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("les deux consoles emploient le même module d'étiquettes", () => {
  for (const module of ["src/r13_exposures.mjs", "src/r04_atlas.mjs"]) {
    assert.match(read(module), /from "\.\/r20_callouts\.mjs"/, module + " doit employer le module partagé");
  }
  const source = read("src/r20_callouts.mjs");
  for (const module of ["src/r13_exposures.mjs", "src/r04_atlas.mjs"]) {
    assert.ok(!/colonnes\[point\.x < rect\.width/.test(read(module)),
      module + " réimplémente le placement au lieu d'employer le module");
  }
  assert.match(source, /colonnes\[point\.x < rect\.width \/ 2 \? "gauche" : "droite"\]/);
});

test("les deux afficheurs 3D savent situer un organe à l'écran", () => {
  assert.match(read("src/r19_body_viewer.mjs"), /ancres\(\) \{/, "l'afficheur humain doit exposer ses ancres");
  assert.match(read("src/r09_viewer.mjs"), /function ancres\(\)\{/, "l'afficheur animal doit exposer ses ancres");
});

test("le calque passe au-dessus des dégradés d'habillage", () => {
  /* La page des espèces pose un dégradé en ::after sur le portrait. Un
     pseudo-élément se peint après les enfants : les étiquettes étaient dans
     le DOM, invisibles à l'écran, et aucune erreur ne le signalait. */
  const css = read("prmr-design-system.css");
  assert.match(css, /\.prmr-callout-lines,\.prmr-callout-layer\{[^}]*z-index:3/);
});

test("le calque laisse le modèle saisissable dessous", () => {
  const css = read("prmr-design-system.css");
  assert.match(css, /\.prmr-callout-lines,\.prmr-callout-layer\{[^}]*pointer-events:none/,
    "sans cela, on ne pourrait plus tourner le modèle là où une étiquette passe");
});

/* PRMR — empreintes de cache calculées sur le contenu.
 *
 * Les pages portaient des empreintes écrites à la main : ?v=r12-20261117.
 * Modifier un module sans penser à changer la chaîne laissait les navigateurs
 * servir l'ancienne version. C'est arrivé pour src/r05_clinical.mjs : le
 * correctif qui supprime le corps provisoire et colore les organes était
 * publié, mais les visiteurs continuaient de voir l'anatomie d'avant.
 *
 * L'empreinte est désormais dérivée du contenu du fichier. Toute modification
 * la change, aucune modification ne peut l'oublier.
 *
 *   node scripts/stamp_assets.mjs          vérifie et signale les écarts
 *   node scripts/stamp_assets.mjs --write  réécrit les empreintes
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

// Imports internes déjà marqués « ?v= » dans les modules : même empreinte, sinon un module
// mis à jour pourrait charger une ancienne dépendance restée en cache.
const IMPORT = /(?<kw>from |import\()"(?<path>\.\/[^"?#]+\.mjs)\?v=[^"]*"/g;
// Modules suivis (les autres pages, dont l'accueil validé, ne sont pas modifiées ici).
const modules = ["symptomes-console.mjs"].map(f => join(root, "src", f));
const stale = [];
let changed = 0;
for (let pass = 0; pass < 5; pass++) {
  let again = false;
  for (const file of modules) {
    const original = readFileSync(file, "utf8");
    const updated = original.replace(IMPORT, (match, kw, path, offset, whole, groups) => {
      const target = join(dirname(file), groups.path.slice(2));
      if (!existsSync(target)) return match;
      const digest = createHash("sha256").update(readFileSync(target)).digest("hex").slice(0, 10);
      return `${groups.kw}"${groups.path}?v=${digest}"`;
    });
    if (updated !== original) {
      if (!stale.includes(file)) stale.push(file.slice(root.length + 1));
      if (write) { writeFileSync(file, updated, "utf8"); again = true; changed++; }
    }
  }
  if (!again) break;
}

const pages = readdirSync(root).filter(f => f.endsWith(".html"));
// Référence locale, avec ou sans empreinte, dans un attribut src ou href.
const REFERENCE = /(?<attr>src|href)="(?<path>\.\/[^"?#]+\.(?:mjs|js|css))(?:\?v=[^"]*)?"/g;

for (const page of pages) {
  const file = join(root, page);
  const original = readFileSync(file, "utf8");

  const updated = original.replace(REFERENCE, (match, attr, path, offset, whole, groups) => {
    const target = join(root, groups.path.slice(2));
    if (!existsSync(target)) return match;
    const digest = createHash("sha256").update(readFileSync(target)).digest("hex").slice(0, 10);
    const replacement = `${groups.attr}="${groups.path}?v=${digest}"`;
    if (replacement !== match) stale.push(`${page} → ${groups.path}`);
    return replacement;
  });

  if (updated !== original) {
    changed++;
    if (write) writeFileSync(file, updated, "utf8");
  }
}

if (!stale.length) {
  console.log("Empreintes de cache à jour sur les " + pages.length + " pages.");
  process.exit(0);
}

if (write) {
  console.log("Empreintes réécrites dans " + changed + " page(s) :");
  for (const item of stale) console.log("  " + item);
  process.exit(0);
}

console.error("Empreintes de cache périmées — les visiteurs recevraient l'ancienne version :");
for (const item of stale) console.error("  " + item);
console.error("\nCorriger avec : node scripts/stamp_assets.mjs --write");
process.exit(1);

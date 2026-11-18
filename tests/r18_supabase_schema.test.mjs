/* PRMR — le schéma de l'espace privé.
 *
 * La clé du site est publique par conception : sans règles de sécurité au
 * niveau des lignes, n'importe qui pourrait lire la base entière. Ces
 * vérifications sont statiques — elles lisent le fichier SQL sans base de
 * données — et gardent les invariants qui comptent. L'épreuve réelle, avec
 * deux comptes sur une base jetable, est dans supabase/verifier_securite.sh.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const sql = read("supabase/01_schema_et_securite.sql");
const TABLES = ["research_projects", "molecules", "simulation_runs", "experiments"];

test("les tables du schéma sont celles que le laboratoire interroge", () => {
  const cloud = read("src/cloud.mjs");
  const interrogees = [...cloud.matchAll(/from\("([a-z_]+)"\)|table:"([a-z_]+)"/g)]
    .map(m => m[1] || m[2]);
  for (const table of new Set(interrogees)) {
    assert.ok(TABLES.includes(table), "src/cloud.mjs interroge « " + table + " », absente du schéma");
    assert.match(sql, new RegExp("create table if not exists public\\." + table),
      table + " n'est pas créée par la migration");
  }
});

test("chaque table est protégée au niveau des lignes", () => {
  for (const table of TABLES) {
    assert.match(sql, new RegExp("alter table public\\." + table + "\\s+enable row level security"),
      table + " : sécurité au niveau des lignes non activée");
  }
});

test("aucune règle n'ouvre la base au public", () => {
  assert.ok(!/to\s+(anon|public)\b/i.test(sql), "une règle accorde un accès anonyme ou public");
  assert.ok(!/using\s*\(\s*true\s*\)/i.test(sql), "une règle laisse passer toutes les lignes");
});

test("un projet appartient au compte qui le crée", () => {
  /* src/cloud.mjs n'envoie pas owner_id : sans valeur par défaut, le champ
     serait nul et la règle de sécurité ne reconnaîtrait plus personne. */
  assert.match(sql, /owner_id\s+uuid not null default auth\.uid\(\)/);
  const cloud = read("src/cloud.mjs");
  assert.ok(!/insert\(\{[^}]*owner_id/.test(cloud),
    "si l'application envoie owner_id, la valeur par défaut n'est plus la seule source");
});

test("la migration peut être rejouée sans dommage", () => {
  for (const table of TABLES) {
    assert.match(sql, new RegExp("create table if not exists public\\." + table));
  }
  const creees = (sql.match(/^create policy/gm) || []).length;
  const supprimees = (sql.match(/drop policy if exists/g) || []).length;
  assert.ok(supprimees > 0 && creees > 0, "les règles doivent être supprimées avant d'être recréées");
});

test("aucune clé privilégiée n'est versionnée", () => {
  for (const fichier of ["src/cloud.mjs", "supabase/01_schema_et_securite.sql", "supabase/README.md"]) {
    const texte = read(fichier);
    assert.ok(!/service_role.{0,40}ey[A-Za-z0-9_-]{20}/.test(texte),
      fichier + " : une clé service_role contournerait toutes les règles de sécurité");
  }
});

test("les index viennent après la mise à niveau des colonnes", () => {
  /* Sur une base où les tables existaient déjà sans ces colonnes, l'index se
     créait avant que la colonne ait été ajoutée, et tout le script s'arrêtait
     sur « column owner_id does not exist ». */
  const miseANiveau = sql.indexOf("add column if not exists owner_id");
  const premierIndex = sql.indexOf("create index if not exists");
  assert.ok(miseANiveau > 0, "la mise à niveau des colonnes doit exister");
  assert.ok(premierIndex > miseANiveau,
    "un index sur une colonne ajoutée par le script doit venir après son ajout");
});

test("le script ne demande aucun droit qu'un éditeur SQL n'a pas", () => {
  assert.ok(!/create extension/i.test(sql),
    "installer une extension demande des droits que l'éditeur n'a pas toujours");
  assert.ok(!/\bdo\s+\$\$/.test(sql),
    "un bloc dynamique imbrique des chaînes entre dollars qu'un éditeur web peut tronquer");
});

test("une table déjà présente est complétée, jamais recréée", () => {
  for (const table of TABLES) {
    assert.match(sql, new RegExp("create table if not exists public\\." + table));
  }
  assert.ok(!/drop table/i.test(sql), "aucune table ne doit être supprimée");
  assert.ok(!/alter table [^\n]+ drop column/i.test(sql), "aucune colonne ne doit être supprimée");
});

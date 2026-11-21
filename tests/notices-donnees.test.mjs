// Contrôle du fichier de notices affiné (research-data/notices-effets.json.gz).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const donnees = JSON.parse(gunzipSync(readFileSync(new URL("../research-data/notices-effets.json.gz", import.meta.url))).toString("utf8"));
const notice = mot => Object.values(donnees.notices).find(n => n.nom.toUpperCase().startsWith(mot));

test("Glucophage : fréquences lues dans la rubrique 4.8", () => {
  const e = notice("GLUCOPHAGE 850").effets;
  assert.ok(e.some(x => /B12/.test(x.effet) && x.frequence === "frequent"));
  assert.ok(e.some(x => /Acidose lactique/.test(x.effet) && x.frequence === "tres_rare"));
});

test("tableaux effet | fréquence : la fréquence suit l'effet", () => {
  const e = notice("VILDAGLIPTINE/METFORMINE").effets;
  assert.ok(e.some(x => x.effet === "Rhinopharyngite" && x.frequence === "frequent"));
  assert.ok(e.every(x => !/ (Fréquent|Très rare|Peu fréquent)$/.test(x.effet)));
});

test("effets nettoyés : pas de retour chariot ni de fragment isolé", () => {
  for (const n of Object.values(donnees.notices)) for (const x of n.effets) {
    assert.ok(!/[\r\n]/.test(x.effet), n.nom);
  }
  const e = notice("NUROFENFLASH 200").effets;
  assert.ok(!e.some(x => /^de la langue/.test(x.effet)));
});

test("notice sans effet lisible : remarque explicative", () => {
  for (const n of Object.values(donnees.notices)) if (!n.effets.length) assert.ok(n.remarque, n.nom);
});

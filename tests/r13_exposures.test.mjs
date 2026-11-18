import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const root=new URL("../",import.meta.url);
const data=JSON.parse(readFileSync(new URL("research-data/r13_exposures.json",root),"utf8"));
const page=readFileSync(new URL("exposures.html",root),"utf8");
const mod=readFileSync(new URL("src/r13_exposures.mjs",root),"utf8");

test("R13 : chaque repère porte une valeur, un organe, une nature de preuve et une source",()=>{
 assert.ok(data.substances.length>=2);
 const natures=new Set(Object.keys(data.status_scale));
 for(const s of data.substances){
  assert.ok(s.thresholds.length>0,s.id);
  assert.ok(s.organs.length>0,s.id);
  assert.ok(Number.isFinite(s.evidence_horizon_days),s.id+" doit déclarer jusqu'où vont les données");
  const tous=[...s.thresholds,...(s.observational||[]),s.chronic_warning,s.renal_note].filter(Boolean);
  for(const t of tous){
   assert.ok(t.title&&t.detail,s.id);
   assert.ok(natures.has(t.status),s.id+" : nature de preuve inconnue « "+t.status+" »");
   // Un repère sans source n'a pas sa place : c'est ce qui sépare cet outil
   // d'un simulateur d'impressions.
   assert.ok(t.source&&t.source.length>5,s.id+" : repère sans source — "+t.title);
   if(t.url)assert.match(t.url,/^https:\/\//,s.id);
  }
  // Les seuils doivent être ordonnés pour que « le plus élevé » ait un sens.
  const vals=s.thresholds.map(x=>x.value);
  assert.deepEqual(vals.slice().sort((a,b)=>a-b).length,vals.length);
 }
});

test("R13 : l'outil n'extrapole pas au-delà des données",()=>{
 // Le cœur du dispositif : au-delà de l'horizon des sources, il annonce
 // l'absence de données au lieu de prolonger une courbe.
 assert.match(mod,/non_documente/);
 assert.match(mod,/Au-delà de ce que les études couvrent/);
 assert.match(mod,/n’extrapole pas/);
 assert.ok(!/predict|prédiction|probabilité d'atteinte/i.test(mod),
  "l'explorateur ne doit annoncer aucune prédiction d'atteinte d'organe");
});

test("R13 : la page déclare sa portée et renvoie vers un professionnel",()=>{
 assert.match(page,/Ce que cet outil ne fait pas/);
 assert.match(page,/médecin ou un pharmacien/);
 assert.match(page,/data-prmr-tab/);
 assert.ok(existsSync(new URL("src/r13_exposures.mjs",root)));
 // La page doit être atteignable depuis toutes les autres.
 const route=readFileSync(new URL("src/prmr_route.mjs",root),"utf8");
 assert.match(route,/exposures\.html/);
});

test("R13 : les quatre natures de preuve restent distinctes à l'affichage",()=>{
 for(const nature of Object.keys(data.status_scale)){
  assert.ok(mod.includes(nature),"nature non rendue : "+nature);
 }
 // Une association observée ne doit jamais être présentée comme une cause.
 const cafe=data.substances.find(s=>s.id==="cafeine");
 const obs=cafe.observational[0];
 assert.equal(obs.status,"association_observee");
 assert.match(obs.detail,/causalité n'est pas établie|pas de conclure/);
});

test("le repère annoncé comme le plus élevé l'est vraiment", () => {
  /* « Le plus élevé est : … » lisait la derniere entree du registre, pas la
     plus haute en valeur. Un repere ecrit en dernier — par exemple un effet
     renal present des les doses usuelles, donc de valeur 1 — etait annonce
     comme le plus eleve des reperes franchis. Le classement se fait
     desormais sur la valeur, dans le module. */
  const src = readFileSync(new URL("../src/r13_exposures.mjs", import.meta.url), "utf8");
  assert.match(src, /\.filter\(t => dose >= t\.value\)\.sort\(parValeur\)/);
  assert.match(src, /\.filter\(t => dose < t\.value\)\.sort\(parValeur\)/);
  assert.match(src, /gravite\[a\.status\]/, "à valeur égale, le repère le plus grave doit primer");

  const data = JSON.parse(readFileSync(new URL("../research-data/r13_exposures.json", import.meta.url), "utf8"));
  for (const substance of data.substances) {
    for (const t of substance.thresholds) {
      assert.ok(typeof t.value === "number" && t.value >= 0, substance.id + " : seuil sans valeur numérique");
      assert.ok(t.source && t.url, substance.id + " : seuil sans source");
    }
  }
});

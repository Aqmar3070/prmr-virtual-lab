import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../atelier.html",import.meta.url),"utf8");
const lab=readFileSync(new URL("../src/lab.mjs",import.meta.url),"utf8");
const cloud=readFileSync(new URL("../src/cloud.mjs",import.meta.url),"utf8");
test("espace privé visible dans la navigation",()=>{
 assert.match(html,/id="view-cloud"/);
 assert.match(html,/data-view="cloud"/);
 assert.match(lab,/initCloud\s*\(/);
});
test("tous les sélecteurs cloud ont un id HTML correspondant",()=>{
 const selectors=[...cloud.matchAll(/\$\("([^"]+)"\)/g)].map(x=>x[1]);
 assert.ok(selectors.length>15);
 for(const id of selectors)assert.ok(html.includes('id="'+id+'"'),"Element manquant : "+id);
});
test("aucune clé admin Supabase embarquée dans le frontend",()=>{
 assert.match(cloud,/sb_publishable_/);
 assert.doesNotMatch(cloud,/sb_secret_/);
 assert.doesNotMatch(cloud,/service_role.*(eyJ|sb_)/);
});
test("SDK figé et accès limité aux enregistrements de la session",()=>{
 assert.match(cloud,/supabase-js@2\.119\.0/);
 assert.match(cloud,/signInWithPassword/);
 assert.match(cloud,/getUser/);
 assert.match(cloud,/research_projects/);
 assert.match(cloud,/simulation_runs/);
 assert.match(cloud,/molecules/);
 assert.match(cloud,/experiments/);
 assert.doesNotMatch(cloud,/\.from\("auth\.users"\)/);
});
test("les résultats PK sont explicitement non cliniques",()=>{
 assert.match(cloud,/hypothèses fictives/);
 assert.match(cloud,/hypothesis/);
});

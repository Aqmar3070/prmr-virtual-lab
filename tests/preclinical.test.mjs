import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const page=readFileSync(new URL("../preclinical.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const research=readFileSync(new URL("../research.html",import.meta.url),"utf8");

test("the renal preclinical dossier is linked from both laboratory entrypoints",()=>{
 assert.match(main,/href="\.\/preclinical\.html"/);
 assert.match(research,/href="\.\/preclinical\.html"/);
 // L'accès à l'espace privé est servi par la navigation partagée, présente
 // sur chaque page, et non plus par un en-tête propre au dossier.
 const route=readFileSync(new URL("../src/prmr_route.mjs",import.meta.url),"utf8");
 assert.match(route,/index\.html\?view=cloud/);
 assert.ok(page.includes("src/prmr_route.mjs"));
});

test("each selected animal study has its primary source and PMID",()=>{
 for(const doi of ["10.1681/ASN.0000000000000186","10.1159/000516213","10.1097/HJH.0000000000003633"])assert.ok(page.includes(doi),doi);
 for(const pmid of ["37428955","34111864","38088400"])assert.ok(page.includes(pmid),pmid);
});

test("the published data and scientific uncertainty are preserved",()=>{
 assert.match(page,/103,1/);
 assert.match(page,/63,7/);
 assert.match(page,/86 %/);
 assert.match(page,/93 %/);
 assert.match(page,/50 %/);
 assert.match(page,/aucune expérience animale exécutée par PRMR/i);
 assert.match(page,/Aucune preuve de guérison rénale/i);
 assert.match(page,/external_reference/);
});

test("the dossier's inline interaction script parses as valid JavaScript",()=>{
 const scripts=Array.from(page.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]);
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new Script(scripts[0]));
});

test("the interactive dossier provides study filters, simplified explanation and JSON export",()=>{
 for(const id of ['data-filter="all"','data-filter="rat"','data-filter="souris"','id="toggle-simplified"','id="export-data"'])assert.ok(page.includes(id),id);
});

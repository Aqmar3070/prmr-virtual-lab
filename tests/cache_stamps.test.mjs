import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const pages=readdirSync(root).filter(f=>f.endsWith(".html"));
const REFERENCE=/(?:src|href)="(\.\/[^"?#]+\.(?:mjs|js|css))(?:\?v=([^"]*))?"/g;

test("Toute ressource locale porte une empreinte dérivée de son contenu",()=>{
 // Les empreintes étaient écrites à la main. Modifier un module sans penser à
 // changer la chaîne laissait les navigateurs servir l'ancienne version : le
 // correctif de l'anatomie humaine était publié, mais les visiteurs voyaient
 // encore le corps provisoire. Quarante-neuf références étaient périmées.
 const perimees=[];
 for(const page of pages){
  const html=readFileSync(join(root,page),"utf8");
  for(const [,path,stamp] of html.matchAll(REFERENCE)){
   const target=join(root,path.slice(2));
   if(!existsSync(target))continue;
   const attendu=createHash("sha256").update(readFileSync(target)).digest("hex").slice(0,10);
   if(stamp!==attendu)perimees.push(`${page} → ${path} (${stamp||"aucune"} au lieu de ${attendu})`);
  }
 }
 assert.deepEqual(perimees,[],
  "Empreintes périmées. Corriger avec : node scripts/stamp_assets.mjs --write");
});

test("Chaque page charge le système de design avant ses autres feuilles",()=>{
 for(const page of pages){
  const html=readFileSync(join(root,page),"utf8");
  const feuilles=[...html.matchAll(/href="\.\/([^"?#]+\.css)/g)].map(m=>m[1]);
  if(!feuilles.length)continue;
  assert.equal(feuilles[0],"prmr-design-system.css",
   page+" doit charger le système de design en premier : les autres feuilles consomment ses variables");
 }
});

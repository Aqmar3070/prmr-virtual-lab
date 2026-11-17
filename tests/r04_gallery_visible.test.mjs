import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const root=new URL("../",import.meta.url);
const page=readFileSync(new URL("species-r04.html",root),"utf8");
const logic=readFileSync(new URL("src/r04_app.mjs",root),"utf8");
const style=readFileSync(new URL("r04-gallery.css",root),"utf8");
const r03=readFileSync(new URL("risk-r03.html",root),"utf8");
test("Original PRMR PNG visuals are directly visible on the R04 HTML page, even without JS",()=>{
 assert.match(page,/<section id="r4-original-gallery"/);
 assert.match(page,/<img id="r4-poster-main-img" src="\.\/assets\/illustrations\/r04\/comparaison-especes\.png"/);
 assert.match(page,/href="\.\/r04-gallery\.css"/);
 for(const [species,filename] of Object.entries({mouse:"comparaison-especes.png",rat:"comparaison-especes.png",pig:"porc.png",dog:"chien.png",nhp:"primate.png",rabbit:"lapin.png"})){
  assert.ok(page.includes('data-r4-gallery-species="'+species+'"'));
  assert.ok(page.includes('href="./assets/illustrations/r04/'+filename+'"'));
  assert.ok(existsSync(new URL("assets/illustrations/r04/"+filename,root)),filename);
 }
});
test("Species interaction changes poster and animal calculation together",()=>{
 assert.match(logic,/enableOriginalPosterNavigation\(\)/);
 assert.match(logic,/setSpecies\(a\.dataset\.r4GallerySpecies\)/);
 assert.match(logic,/refreshOriginalPoster\(result\.species\.id\)/);
 assert.match(logic,/ORIGINAL_POSTERS_R04/);
 assert.match(page,/r04-original-posters-20261117/);
});
test("The R03 poster is displayed without waiting for JavaScript",()=>{
 assert.match(r03,/<figure class="r4-original-poster" id="r03-original-poster">/);
 assert.ok(!r03.includes('id="r03-original-poster" hidden'));
 assert.match(r03,/assets\/illustrations\/r04\/tableau-pkpd\.png/);
 assert.ok(existsSync(new URL("assets/illustrations/r04/tableau-pkpd.png",root)));
 assert.match(style,/r4-poster-gallery-grid/);
});

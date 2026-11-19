import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const base=new URL("../",import.meta.url);
const r04=readFileSync(new URL("species-r04.html",base),"utf8");
const r03=readFileSync(new URL("risk-r03.html",base),"utf8");
const r02=readFileSync(new URL("screening.html",base),"utf8");
const r01=readFileSync(new URL("preclinical.html",base),"utf8");
const app=readFileSync(new URL("src/r04_app.mjs",base),"utf8");
const embedded=readFileSync(new URL("src/r04_embedded.mjs",base),"utf8");
test("Previous pasted poster galleries have been removed",()=>{
 assert.ok(!r04.includes('id="r4-original-gallery"'));
 assert.ok(!r04.includes('r4-poster-gallery'));
 assert.ok(!r04.includes('r04-gallery.css'));
 assert.ok(!r03.includes('id="r03-original-poster"'));
 assert.ok(!r03.includes('<figure class="r4-original-poster"'));
 assert.match(r04,/id="r4-visual-atlas"/);
 // Le module applicatif doit être chargé avec une empreinte de cache, sans figer sa valeur :
 // chaque révision la change, et un test qui la code en dur casse à chaque publication.
 assert.match(r04,/src="\.\/src\/r04_app\.mjs\?v=[\w.-]+"/);
});
test("le poste animal n'est embarqué qu'aux endroits qui en sont le sujet",()=>{
 /* Le même poste 3D chien/chat était répété en réduction sur l'accueil, les
    preuves précliniques, le criblage et les simulations : quatre copies d'un
    outil lourd, qui noyaient le sujet propre de chaque page. Il vit désormais
    à l'étape 02, qui porte l'anatomie comparée, et sur la console de
    recherche. Les autres pages y renvoient par une passerelle. */
 const body=readFileSync(new URL("research.html",base),"utf8");
 assert.ok(body.includes('id="r5-home-stage"'));
 assert.ok(body.includes("r04-atlas.css"));
 assert.ok(body.includes("src/r04_embedded.mjs"));
 assert.ok(embedded.includes("r5-home-stage"));

 for(const file of ["preclinical.html","screening.html","risk-r03.html"]){
  const page=readFileSync(new URL(file,base),"utf8");
  assert.ok(!page.includes("src/r04_embedded.mjs"),file+" embarque encore le poste animal");
  assert.ok(page.includes('class="prmr-handoff"'),file+" doit renvoyer vers l'étape 02");
  assert.ok(page.includes('href="./species-r04.html"'),file);
 }
});
test("Home route enters a functional species and molecule workbench",()=>{
 // research.html reste la porte d'entrée du poste de travail intégré.
 const h=readFileSync(new URL("research.html",base),"utf8");
 assert.match(h,/Molécules en 3D/);
 assert.match(h,/r5-home-stage/);
 assert.ok(!h.includes("r4-home-promo"));
 assert.ok(!h.includes("galerie placardée"));
 assert.ok(app.includes("function setSpecies("));
 assert.ok(app.includes("initMolecules()"));
});
test("La page d'accueil oriente vers les cinq étapes de recherche sans dupliquer les modules",()=>{
 const home=readFileSync(new URL("index.html",base),"utf8");
 /* L'accueil est une console : les cinq étapes ne sont plus des cartes
    « prmr-stage » mais les panneaux et le rail de cette console. Ce que cette
    vérification protège n'a pas changé — chaque étape doit mener à son module
    réel, et aucun module ne doit être redupliqué sur l'accueil. */
 assert.match(home,/class="home-rail"/);
 assert.match(home,/class="home-panel/);
 assert.match(home,/prmr-route\.css/);
 assert.match(home,/prmr_route\.mjs/);
 // Les cinq étapes doivent chacune mener à leur module réel.
 for(const target of ["preclinical.html","species-r04.html","screening.html","risk-r03.html","clinical.html"]){
  assert.ok(home.includes(target),target);
 }
 assert.ok(!home.includes("r4-home-promo"));
});
test("Original illustrations remain available as source material, not standalone gallery",()=>{
 for(const name of ["comparaison-especes.png","porc.png","chien.png","primate.png","lapin.png","tableau-pkpd.png"]){
  assert.ok(existsSync(new URL("assets/illustrations/r04/"+name,base)),name);
 }
});

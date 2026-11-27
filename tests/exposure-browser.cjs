const {chromium}=require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({args:["--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1672,height:941}});
  // Le double de micro reproduit la fin automatique d’une session après une pause.
  await page.addInitScript(()=>{
   window.SpeechRecognition=class{
    start(){window.microEssai=this;}
    stop(){this.onend();}
    phrase(texte){this.onresult({results:[[{transcript:texte}]]});}
   };
  });
  const erreurs=[];page.on("pageerror",e=>erreurs.push(e.message));
  await page.goto("http://127.0.0.1:4173/exposures.html");
  await page.locator(".xa-ready").waitFor({timeout:90000});
  await page.click(".xp-profile-card summary");
  await page.click('[data-sex="female"]');
  await page.click(".xp-profile-card summary");
  await page.waitForFunction(()=>document.querySelector(".xa-ready")&&document.querySelector('#xa-focus option[value="uterus"]'));
  await page.screenshot({path:"/tmp/atlas-femme.png"});
  // La barre « Atlas anatomique » a été retirée : les poumons se choisissent dans la liste.
  for(const structure of ["lung_l","lung_r"]){
   await page.selectOption("#xa-focus",structure);
   assert.equal(await page.inputValue("#xa-focus"),structure);
  }
  for(const structure of ["eye_l","foot_l","toes_l"]){
   await page.click('[data-structure="'+structure+'"]');
   assert.equal(await page.inputValue("#xa-focus"),structure);
  }
  await page.mouse.move(830,400);await page.mouse.wheel(0,-100);await page.click("#xa-reset");
  assert.equal(await page.inputValue("#xa-focus"),"");
  await page.fill("#xa-note","Caféine, 80 mg par jour");await page.click("#xa-read");
  await page.locator("#xa-proposals button").first().click();
  assert.equal(await page.inputValue("#xp-dose"),"80");
  for(const [id,valeur] of [["start","0"],["reduce","7"],["after","40"],["end","14"]])await page.fill("#xp-"+id,valeur);
  await page.locator("#xp-editor button").filter({hasText:"Enregistrer"}).click();
  assert.match(await page.textContent("#xp-totals"),/840/);
  await page.fill("#xa-note","");await page.click("#xa-mic");
  await page.evaluate(()=>{window.microEssai.phrase("Je bois de la bière");window.premierMicro=window.microEssai;window.microEssai.onend();});
  await page.waitForFunction(()=>window.microEssai!==window.premierMicro);
  await page.evaluate(()=>window.microEssai.phrase("33 cl à 5 % chaque soir pendant deux semaines"));
  assert.match(await page.inputValue("#xa-note"),/bière.*deux semaines/);
  await page.click("#xa-mic");
  assert.match(await page.textContent("#xp-chart-title"),/231/);
  assert.match(await page.textContent("#xa-proposals"),/cirrhose/);
  const doc=await browser.newPage({viewport:{width:1050,height:160}});
  await doc.setContent('<body style="background:white;color:black;font:32px Arial">Je bois 33 cl de bière à 5 % chaque jour pendant 7 jours.</body>');
  for(const [nom,mimeType,buffer] of [["fiche.pdf","application/pdf",await doc.pdf()],["fiche.png","image/png",await doc.screenshot()]]){
   await page.locator("#xa-file").setInputFiles({name:nom,mimeType,buffer});
   await page.waitForFunction(f=>document.getElementById("xa-file-status").textContent.includes("Texte extrait de "+f),nom,{timeout:120000});
   assert.match(await page.textContent("#xp-chart-title"),/115,5/);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:"/tmp/atlas-mobile.png",fullPage:true});
  await page.click('[data-choix-vue="symptomes"]');
  await page.fill("#sy-recherche","Mal de tête");
  await page.locator("#sy-groupes").getByRole("button",{name:"Mal de tête",exact:true}).click();
  const n1=Number(await page.textContent("#sy-n"));assert.ok(n1>10);
  await page.fill("#sy-recherche","Raideur de la nuque");
  await page.locator("#sy-groupes").getByRole("button",{name:"Raideur de la nuque",exact:true}).click();
  assert.match(await page.locator("#sy-resultats summary").first().innerText(),/2 \/ 2/);
  assert.match(await page.textContent("#sy-resultats"),/Méningite/);
  await page.fill("#sy-recherche","Fièvre");
  await page.locator("#sy-groupes").getByRole("button",{name:"Fièvre",exact:true}).click();
  assert.ok(await page.locator("#sy-alerte").isVisible());
  await page.setViewportSize({width:1905,height:825});
  await page.goto('http://127.0.0.1:4173/exposures.html?maladie=dt2&vue=maladies#rubrique-methode');
  await page.locator('.xa-ready').waitFor();await page.locator('.mx-ligne-d summary').first().waitFor();
  assert.equal(await page.locator('#xa-stage').isVisible(),false);
  assert.equal(await page.locator('[data-onglet=substances]').getAttribute('aria-pressed'),'true');
  await page.locator('.mx-ligne-d summary').first().click();
  await page.locator('[data-onglet=pistes]').click();await page.locator('[data-onglet=guerison]').click();
  await page.fill('#mx-recherche','rénale');await page.locator('.mx-maladie').first().click();await page.selectOption('#mx-stade',{index:1});
  await page.locator('[data-structure=foot_l]').click();assert.equal(await page.inputValue('#xa-focus'),'foot_l');assert(await page.locator('#xa-stage').isVisible());await page.click('#mx-atlas');assert(!(await page.locator('#xa-stage').isVisible()));
  for(const v of ['substances','symptomes','maladies'])await page.click('[data-choix-vue='+v+']');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/atlas-maladies-mobile.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.click('#xp-reperes');assert(await page.locator('#registre').evaluate(e=>e.open));
  assert.deepEqual(erreurs,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

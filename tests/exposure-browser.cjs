const {chromium}=require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({args:["--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1672,height:941}});
  const erreurs=[];page.on("pageerror",e=>erreurs.push(e.message));
  await page.goto("http://127.0.0.1:4173/exposures.html");
  await page.locator(".xa-ready").waitFor({timeout:90000});
  await page.click(".xp-profile-card summary");
  await page.click('[data-sex="female"]');
  await page.click(".xp-profile-card summary");
  await page.waitForFunction(()=>document.querySelector(".xa-ready")&&document.querySelector('#xa-focus option[value="uterus"]'));
  await page.screenshot({path:"/tmp/atlas-femme.png"});
  for(const structure of ["lung_l","lung_r","eye_l","foot_l","toes_l"]){
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
  assert.match(await page.textContent("#xp-totals"),/80/);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:"/tmp/atlas-mobile.png",fullPage:true});
  assert.deepEqual(erreurs,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

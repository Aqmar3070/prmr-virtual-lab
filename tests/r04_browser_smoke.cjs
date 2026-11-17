// Real-browser smoke test for the integrated PRMR research interface.
// Run from repository root: node tests/r04_browser_smoke.cjs (Playwright installed).
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const fs=require("node:fs");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 let step="boot";
 try{
  page.setDefaultTimeout(30000);
  step="home-load";
  await page.goto("http://127.0.0.1:4173/index.html?v=browser-smoke",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r5-home-stage .r4-st-species-card",{timeout:45000});
  assert.equal(await page.locator("#r5-home-stage .r4-st-species-card").count(),6);
  assert.equal(await page.locator("#r5-home-stage .r4-st-molecule-card").count(),4);
  assert.equal(await page.locator(".r4-home-promo").count(),0,"Pasted standalone poster is not allowed");
  step="home-pig-select";
  await page.locator("#r5-home-stage button[data-stage-species=pig]").click();
  await page.waitForFunction(()=>document.querySelector("#r5-home-stage .r4-st-species-name")?.textContent.includes("Porc"));
  const bg=await page.locator('#r5-home-stage .r4-st-portrait').evaluate(e=>getComputedStyle(e).backgroundImage);
  assert.ok(bg.includes("porc.png"),bg);
  assert.ok((await page.locator("#r5-home-stage .r4-st-renal-details").innerText()).includes("multipapillaire"));
  step="home-edit-physiology";
  const controls=page.locator("#r5-home-stage .r4-st-mini-controls select");
  assert.equal(await controls.count(),4);
  await controls.nth(0).selectOption("old");
  assert.ok((await page.locator("#r5-home-stage .r4-st-annotations").innerText()).includes("Âgé"));
  assert.ok((await page.locator("#r5-home-stage .r4-st-kinetics").innerText()).includes("R02-A"));
  step="r04-full";
  await page.goto("http://127.0.0.1:4173/species-r04.html?v=browser-smoke",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r4-visual-atlas .r4-st-species-card",{timeout:45000});
  assert.equal(await page.locator('#r4-original-gallery').count(),0);
  assert.equal(await page.locator("#r4-visual-atlas .r4-st-species-card").count(),6);
  step="r04-dog";
  await page.locator("#r4-visual-atlas button[data-stage-species=dog]").click();
  await page.waitForFunction(()=>document.querySelector("#r4-3d-species")?.textContent.includes("Chien"));
  assert.equal(await page.locator("#r4-mass").inputValue(),"10");
  await page.locator("#r4-sex").selectOption("female");
  await page.waitForFunction(()=>document.querySelector("#r4-visual-atlas .r4-st-annotations")?.textContent.includes("Femelle"));
  const mols=page.locator("#r4-molecules .r4-molecule canvas");
  await mols.first().waitFor({timeout:45000});
  assert.equal(await mols.count(),4);
  assert.ok(await page.locator("#r4-molecule-3d").evaluate(e=>e.getContext("2d")!==null));
  step="other-pages";
  for(const path of ["risk-r03.html","screening.html","preclinical.html"]){
   await page.goto("http://127.0.0.1:4173/"+path+"?v=browser-smoke",{waitUntil:"domcontentloaded"});
   const selector={"risk-r03.html":"#r5-risk-stage","screening.html":"#r5-screening-stage","preclinical.html":"#r5-preclinical-stage"}[path];
   await page.waitForSelector(selector+" .r4-st-species-card",{timeout:45000});
   assert.equal(await page.locator(selector+" .r4-st-species-card").count(),6,path);
  }
  console.log("PASS — 6 species, original PRMR portraits, dynamic physiology, 4 3D molecules, all integrated pages");
 }catch(err){
  console.error("PRMR UI ERROR at "+step+": "+(err.stack||err));
  try{await page.screenshot({path:"/tmp/prmr-ui-error.png",fullPage:false})}catch(_){}
  process.exitCode=1;
 }finally{
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});

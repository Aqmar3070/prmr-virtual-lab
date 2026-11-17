// PRMR-R05 browser QA — genuine Chromium: species changes, isolated visuals, readable labels,
// touch-sized controls, mobile viewport and chemistry/render regression.
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const fs=require("node:fs");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader"]});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const issues=[],jsErrors=[];
 page.on("pageerror",e=>jsErrors.push(String(e.message)));
 let step="initialisation";
 try{
  page.setDefaultTimeout(30000);
  step="accueil desktop";
  await page.goto("http://127.0.0.1:4173/index.html?v=r05-check",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r5-home-stage .r4-st-species-card",{timeout:45000});
  assert.equal(await page.locator("#r5-home-stage .r4-st-species-card").count(),6);
  assert.equal(await page.locator("#r5-home-stage .r4-st-molecule-card").count(),4);
  assert.equal(await page.locator(".r4-home-promo").count(),0);
  await page.waitForFunction(()=>Array.from(document.querySelectorAll("#r5-home-stage .r5-animal-asset")).every(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await page.locator("#r5-home-stage .r5-animal-asset").count(),6);
  assert.equal(await page.locator("#r5-home-stage .r5-animal-asset").evaluateAll(imgs=>new Set(imgs.map(i=>i.getAttribute("src"))).size),6);
  await page.screenshot({path:"/tmp/prmr-r05-home-desktop.png",fullPage:false});
  step="porc complet, non recadré";
  await page.locator("#r5-home-stage button[data-stage-species=pig]").click();
  await page.waitForFunction(()=>document.querySelector("#r5-home-stage .r4-st-species-name")?.textContent.includes("Porc"));
  const portrait=page.locator("#r5-home-stage .r5-animal-static");
  assert.match(await portrait.getAttribute("src"),/\/pig\.(svg|webp)$/);
  assert.equal(await portrait.evaluate(el=>getComputedStyle(el).objectFit),"contain");
  const sourceBG=await page.locator("#r5-home-stage .r4-st-portrait").evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.ok(!sourceBG.includes(".png"),"No poster-based background crops");
  assert.ok((await page.locator("#r5-home-stage .r4-st-renal-details").innerText()).includes("multipapillaire"));
  const scene=page.locator("#r5-home-stage .r5-animal-sculpture");
  await scene.waitFor();assert.ok((await scene.boundingBox()).height>=220);
  await page.waitForFunction(
   ()=>document.querySelector("#r5-home-stage .r4-st-portrait")?.dataset.mode==="photo3d",
   {timeout:20000}
  );
  assert.equal(await page.locator("#r5-home-stage .r4-st-portrait").getAttribute("data-mode"),"photo3d",
    "Le porc doit utiliser le GLB phototexturé, pas la sculpture de secours");
  const renderer=await scene.evaluate(canvas=>({
   hasWebGL:!!canvas.getContext("webgl"),
   isActive:canvas.closest(".r4-st-portrait")?.classList.contains("r5-webgl-active")
  }));
  if(renderer.hasWebGL){
   assert.ok(renderer.isActive,"WebGL context exists but the animal mesh or material shader did not initialize");
   await scene.hover();await page.mouse.wheel(0,-160);
   await scene.dblclick();
  }
  step="texte et physiologie à l'accueil";
  const controls=page.locator("#r5-home-stage .r4-st-mini-controls select");
  await controls.nth(0).selectOption("old");
  assert.ok((await page.locator("#r5-home-stage .r4-st-annotations").innerText()).includes("Âgé"));
  assert.ok((await page.locator("#r5-home-stage .r4-st-kinetics").innerText()).includes("R02-A"));
  const desktopClip=await page.locator("#r5-home-stage").evaluate(root=>{
   const nodes=root.querySelectorAll(".r4-st-species-card>span,.r4-st-portrait-label,.r4-st-field,.r4-st-molecule-card strong");
   return [...nodes].filter(e=>e.scrollWidth>e.clientWidth+2 || e.scrollHeight>e.clientHeight+3).map(e=>e.className+" "+e.textContent.slice(0,35))
  });
  assert.deepEqual(desktopClip,[],"Text cut on desktop: "+desktopClip.join(","));
  await page.screenshot({path:"/tmp/prmr-r05-home-pig-desktop.png",fullPage:false});
  step="R04 interactions";
  await page.goto("http://127.0.0.1:4173/species-r04.html?v=r05-check",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r4-visual-atlas .r4-st-species-card",{timeout:45000});
  assert.equal(await page.locator("#r4-visual-atlas .r4-st-species-card").count(),6);
  assert.equal(await page.locator("#r4-original-gallery").count(),0);
  await page.locator("#r4-visual-atlas button[data-stage-species=dog]").click();
  await page.waitForFunction(()=>document.querySelector("#r4-3d-species")?.textContent.includes("Chien"));
  assert.equal(await page.locator("#r4-mass").inputValue(),"10");
  await page.locator("#r4-sex").selectOption("female");
  await page.waitForFunction(()=>document.querySelector("#r4-visual-atlas .r4-st-annotations")?.textContent.includes("Femelle"));
  assert.match(await page.locator('#r4-visual-atlas .r5-animal-static').getAttribute("src"),/\/dog\.(svg|webp)$/);
  await page.waitForFunction(
   ()=>document.querySelector("#r4-visual-atlas .r4-st-portrait")?.dataset.mode==="photo3d",
   {timeout:20000}
  );
  assert.equal(await page.locator("#r4-visual-atlas .r4-st-portrait").getAttribute("data-mode"),"photo3d",
   "Le chien doit charger le maillage GLB plutôt que le fallback R06");
  await page.screenshot({path:"/tmp/prmr-r05-r04-desktop.png",fullPage:false});
  step="R04 molecules";
  const molecules=page.locator("#r4-molecules .r4-molecule canvas");
  await molecules.first().waitFor({timeout:45000});
  assert.equal(await molecules.count(),4);
  assert.ok(await page.locator("#r4-molecule-3d").evaluate(e=>e.getContext("2d")!==null));
  step="R04 mobile 390";
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(350);
  const mobile=await page.locator("#r4-visual-atlas").evaluate(root=>{
   const cards=root.querySelectorAll(".r4-st-species-card");
   const panel=root.querySelector(".r4-st-portrait");
   const doc=document.documentElement;
   const clipped=[...root.querySelectorAll(".r4-st-species-card>span,.r4-st-portrait-label,.r4-st-field")].filter(e=>e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3).map(e=>e.className+" "+e.textContent.slice(0,30));
   return {width:doc.scrollWidth,viewport:innerWidth,clipped,cardWidth:cards[0].getBoundingClientRect().width,panelWidth:panel.getBoundingClientRect().width}
  });
  assert.ok(mobile.width<=mobile.viewport+5,"Horizontal mobile overflow: "+JSON.stringify(mobile));
  assert.deepEqual(mobile.clipped,[],"Clipped mobile labels: "+mobile.clipped.join(","));
  assert.ok(mobile.cardWidth>=125);
  assert.ok(mobile.panelWidth>=260);
  await page.screenshot({path:"/tmp/prmr-r05-mobile.png",fullPage:false});
  step="other pages";
  await page.setViewportSize({width:1440,height:900});
  for(const path of ["risk-r03.html","screening.html","preclinical.html"]){
   await page.goto("http://127.0.0.1:4173/"+path+"?v=r05-check",{waitUntil:"domcontentloaded"});
   const root={"risk-r03.html":"#r5-risk-stage","screening.html":"#r5-screening-stage","preclinical.html":"#r5-preclinical-stage"}[path];
   await page.waitForSelector(root+" .r4-st-species-card",{timeout:45000});
   assert.equal(await page.locator(root+" .r4-st-species-card").count(),6);
  }
  console.log("PASS PRMR-R07 — vrais GLB phototexturés porc/chien, contrôles 3D, 6 espèces, 390 px mobile, molécules RDKit");
  if(jsErrors.length)console.log("Page errors observed: "+jsErrors.slice(0,6).join(" | "));
 }catch(error){
  console.error("PRMR-R07 UI FAIL at "+step+": "+(error.stack||error));
  try{await page.screenshot({path:"/tmp/prmr-ui-error.png",fullPage:false})}catch{}
  process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

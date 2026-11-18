// PRMR-R09 — real Chromium test of the anatomy grid, not the former photo-textured GLB.
// Desktop/mobile, six species, all internal organ modes and untouched RDKit controls.
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader"]});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 let step="initialisation";
 const hash=selector=>page.locator(selector).evaluate(c=>{
  if(c.width<20||c.height<20)return -1;
  const png=c.toDataURL("image/png");
  let sum=0;for(let i=0;i<png.length;i+=47)sum=(sum*31+png.charCodeAt(i))%1000000007;return sum;
 });
 const onCanvas=selector=>page.waitForFunction(sel=>{
  const c=document.querySelector(sel);
  return c&&c.dataset.anatomyRender&&Number(c.dataset.anatomyRender)>0&&c.width>50&&c.height>50
 },selector,{timeout:45000});
 try{
  page.setDefaultTimeout(35000);
  // R11 a remplacé l'accueil par le tableau de bord des cinq étapes et déplacé
  // le poste de travail intégré sur research.html. Ce test visait toujours
  // index.html et attendait 45 s un atelier qui n'y est plus : il échouait sur
  // main depuis cette refonte.
  step="poste de travail intégré";
  await page.goto("http://127.0.0.1:4173/research.html?v=prmr-r09",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r5-home-stage .r4-st-species-card",{timeout:45000});
  // Deux espèces : celles dont l'anatomie provient de modèles réellement acquis.
  assert.equal(await page.locator("#r5-home-stage .r4-st-species-card").count(),2);
  assert.equal(await page.locator("#r5-home-stage .r4-st-molecule-card").count(),4);
  assert.equal(await page.locator("#r5-home-stage .r8-organ-button").count(),8);
  assert.equal(await page.locator("#r5-home-stage .r5-animal-static").count(),0,"Former 3D photo should not cover the anatomical grid");
  await onCanvas("#r5-home-stage .r8-anatomy-canvas");
  assert.equal(await page.locator("#r5-home-stage .r4-st-portrait").getAttribute("data-mode"),"anatomy");
  const first=await hash("#r5-home-stage .r8-anatomy-canvas");
  assert.equal(await page.locator("#r5-home-stage .r8-anatomy-canvas").getAttribute("data-anatomy-engine"),"webgl-three");
  assert.ok(first>0,"WebGL 3D canvas should contain visible pixels");
  await page.screenshot({path:"/tmp/prmr-r05-home-desktop.png",fullPage:false});
  step="sélection du chat, reins internes";
  await page.locator("#r5-home-stage button[data-stage-species=cat]").click();
  await page.waitForFunction(()=>document.querySelector("#r5-home-stage .r8-anatomy-canvas")?.dataset.anatomySpecies==="cat");
  assert.ok((await page.locator("#r5-home-stage .r4-st-renal-details").innerText()).includes("unipapillaire"));
  assert.equal(await page.locator("#r5-home-stage .r8-anatomy-canvas").getAttribute("data-anatomy-organ"),"kidneys");
  await page.locator("#r5-home-stage .r4-st-portrait").scrollIntoViewIfNeeded();
  await page.screenshot({path:"/tmp/prmr-r05-home-cat-desktop.png",fullPage:false});
  step="switch coeur / foie / poumons / tous";
  const root="#r5-home-stage",scene=root+" .r8-anatomy-canvas";
  let previous=await hash(scene);
  for(const mode of ["heart","liver","lungs","brain","digestive","pancreas","all","kidneys"]){
   await page.locator(root+' button[data-organ="'+mode+'"]').click();
   await page.waitForFunction(([sel,id])=>document.querySelector(sel)?.dataset.anatomyOrgan===id,[scene,mode]);
   const active=await page.locator(root+' button[data-organ="'+mode+'"]').getAttribute("aria-pressed");
   assert.equal(active,"true",mode+" must become selected");
   const element=page.locator(scene);
   await element.scrollIntoViewIfNeeded();
   await page.waitForTimeout(180);
   const n=await hash(scene);
   assert.notEqual(n,previous,"Anatomical painting unchanged after organ switch "+mode);
   previous=n;
   if(mode==="all"){
    await page.locator(scene).scrollIntoViewIfNeeded();
    await page.screenshot({path:"/tmp/prmr-r08-all-organs.png",fullPage:false});
   }
  }
  step="commandes corps transparent, isolement, connexions et organe indépendant";
  const flags=page.locator(root+" .r09-scene-toggle");
  assert.equal(await flags.count(),3);
  await flags.nth(0).click();assert.equal(await flags.nth(0).getAttribute("aria-pressed"),"false");
  await flags.nth(1).click();assert.equal(await flags.nth(1).getAttribute("aria-pressed"),"true");
  await flags.nth(2).click();assert.equal(await flags.nth(2).getAttribute("aria-pressed"),"true");
  await onCanvas(root+" .r09-isolated-canvas");
  await page.locator(root+' button[data-organ="heart"]').click();
  await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.anatomyOrgan==="heart",root+" .r09-isolated-canvas");
  await page.locator(root+' button[data-organ="all"]').click();
  await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.anatomyOrgan==="all",root+" .r09-isolated-canvas");
  await flags.nth(1).click();await flags.nth(0).click();
    step="gestes de rotation et zoom";
  const before=Number(await page.locator(scene).getAttribute("data-anatomy-render"));
  const box=await page.locator(scene).boundingBox();
  await page.mouse.move(box.x+box.width*.47,box.y+box.height*.53);
  await page.mouse.down();await page.mouse.move(box.x+box.width*.69,box.y+box.height*.44,{steps:8});await page.mouse.up();
  await page.waitForFunction(([selector,n])=>Number(document.querySelector(selector)?.dataset.anatomyRender)>n,[scene,before]);
  await page.locator(scene).hover();await page.mouse.wheel(0,-140);await page.locator(scene).dblclick();
  step="profil et état scientifique";
  const controls=page.locator(root+" .r4-st-mini-controls select");
  await controls.nth(0).selectOption("old");
  assert.ok((await page.locator(root+" .r4-st-annotations").innerText()).includes("Âgé"));
  assert.ok((await page.locator(root+" .r4-st-kinetics").innerText()).includes("R02-A"));
  const clips=await page.locator(root).evaluate(x=>[...x.querySelectorAll(".r4-st-species-card>span,.r4-st-portrait-label,.r4-st-field,.r8-organ-button")].filter(e=>e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3).map(e=>e.className));
  assert.deepEqual(clips,[],"Desktop clipped fields: "+clips.join(","));
  step="R04 with all six species and synchronized second view";
  await page.goto("http://127.0.0.1:4173/species-r04.html?v=prmr-r08",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r4-visual-atlas .r8-anatomy-canvas",{timeout:45000});
  await onCanvas("#r4-visual-atlas .r8-anatomy-canvas");await onCanvas("#r4-body-3d");
  for(const name of ["dog","cat"]){
   await page.locator('#r4-visual-atlas button[data-stage-species="'+name+'"]').click();
   await page.waitForFunction(id=>document.querySelector("#r4-visual-atlas .r8-anatomy-canvas")?.dataset.anatomySpecies===id,name);
   await page.waitForFunction(id=>document.querySelector("#r4-body-3d")?.dataset.anatomySpecies===id,name);
  }
  await page.locator('#r4-visual-atlas button[data-stage-species="dog"]').click();
  await page.waitForFunction(()=>document.querySelector("#r4-3d-species")?.textContent.includes("Chien"));
  await page.waitForFunction(()=>document.querySelector("#r4-visual-atlas .r8-anatomy-canvas")?.dataset.anatomySource==="canine-CT-derived-hybrid-GLB",null,{timeout:30000});
  assert.ok(Number(await page.locator("#r4-visual-atlas .r8-anatomy-canvas").getAttribute("data-canine-scan-nodes"))>=14);
  assert.equal(await page.locator("#r4-mass").inputValue(),"10");
  await page.locator('#r4-visual-atlas button[data-organ="heart"]').click();
  await page.waitForFunction(()=>document.querySelector("#r4-body-3d")?.dataset.anatomyOrgan==="heart");
  assert.equal(await page.locator("#r4-body-3d").getAttribute("data-anatomy-organ"),"heart");
  await page.locator('#r4-visual-atlas button[data-organ="kidneys"]').click();
  await page.waitForFunction(()=>document.querySelector("#r4-body-3d")?.dataset.anatomyOrgan==="kidneys");
  await page.locator("#r4-sex").selectOption("female");
  await page.waitForFunction(()=>document.querySelector("#r4-visual-atlas .r4-st-annotations")?.textContent.includes("Femelle"));
  await page.screenshot({path:"/tmp/prmr-r05-r04-desktop.png",fullPage:false});
  step="ateliers moléculaires préservés";
  const mols=page.locator("#r4-molecules .r4-molecule canvas");
  await mols.first().waitFor({timeout:45000});
  assert.equal(await mols.count(),4);
  assert.ok(await page.locator("#r4-molecule-3d").evaluate(e=>e.getContext("2d")!==null));
  step="R04 mobile";
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(450);
  const mobile=await page.locator("#r4-visual-atlas").evaluate(x=>{
   const card=x.querySelector(".r4-st-species-card").getBoundingClientRect();
   const canvas=x.querySelector(".r8-anatomy-canvas").getBoundingClientRect();
   const clipped=[...x.querySelectorAll(".r4-st-species-card>span,.r4-st-portrait-label,.r4-st-field,.r8-organ-button")].filter(e=>e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3).map(e=>e.className);
   return {documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,card:card.width,canvas:canvas.width,clipped}
  });
  assert.ok(mobile.documentWidth<=mobile.viewport+5,"Mobile horizontal overflow: "+JSON.stringify(mobile));
  assert.deepEqual(mobile.clipped,[],"Mobile text clipped: "+mobile.clipped.join(","));
  assert.ok(mobile.card>=125&&mobile.canvas>=250);
  await page.locator("#r4-visual-atlas .r4-st-portrait").scrollIntoViewIfNeeded();
  await page.screenshot({path:"/tmp/prmr-r05-mobile.png",fullPage:false});
  step="autres modules R01 R02 R03";
  await page.setViewportSize({width:1440,height:900});
  for(const path of ["risk-r03.html","screening.html","preclinical.html"]){
   await page.goto("http://127.0.0.1:4173/"+path+"?v=prmr-r08",{waitUntil:"domcontentloaded"});
   const selector={"risk-r03.html":"#r5-risk-stage","screening.html":"#r5-screening-stage","preclinical.html":"#r5-preclinical-stage"}[path];
   await onCanvas(selector+" .r8-anatomy-canvas");
   assert.equal(await page.locator(selector+" .r4-st-species-card").count(),2);
  }
  assert.deepEqual(errors,[],"Browser JS errors: "+errors.join(" | "));
  console.log("PASS PRMR-R09 — True Three.js WebGL, canine licensed CT GLB, 7 independent organ systems, les deux espèces acquises, isolation d'organe, physiological links, mobile and R04 RDKit");
 }catch(err){
  console.error("PRMR R09 browser failure — "+step+": "+(err.stack||err));
  try{await page.screenshot({path:"/tmp/prmr-ui-error.png",fullPage:false})}catch{}
  process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

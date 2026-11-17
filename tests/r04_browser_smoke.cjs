// PRMR-R08 — real Chromium test of the anatomy grid, not the former photo-textured GLB.
// Desktop/mobile, six species, all internal organ modes and untouched RDKit controls.
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader"]});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 let step="initialisation";
 const hash=selector=>page.locator(selector).evaluate(c=>{
  const {width:w,height:h}=c;if(w<2||h<2)return -1;
  const d=c.getContext("2d")?.getImageData(0,0,w,h).data;if(!d)return -1;
  let sum=0;for(let i=0;i<d.length;i+=31)sum=(sum*31+d[i]+d[i+1]+d[i+2])%1000000007;return sum;
 });
 const onCanvas=selector=>page.waitForFunction(sel=>{
  const c=document.querySelector(sel);
  return c&&c.dataset.anatomyRender&&Number(c.dataset.anatomyRender)>0&&c.width>50&&c.height>50
 },selector,{timeout:45000});
 try{
  page.setDefaultTimeout(35000);
  step="accueil R08";
  await page.goto("http://127.0.0.1:4173/index.html?v=prmr-r08",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#r5-home-stage .r4-st-species-card",{timeout:45000});
  assert.equal(await page.locator("#r5-home-stage .r4-st-species-card").count(),6);
  assert.equal(await page.locator("#r5-home-stage .r4-st-molecule-card").count(),4);
  assert.equal(await page.locator("#r5-home-stage .r8-organ-button").count(),5);
  assert.equal(await page.locator("#r5-home-stage .r5-animal-static").count(),0,"Former 3D photo should not cover the anatomical grid");
  await onCanvas("#r5-home-stage .r8-anatomy-canvas");
  assert.equal(await page.locator("#r5-home-stage .r4-st-portrait").getAttribute("data-mode"),"anatomy");
  const first=await hash("#r5-home-stage .r8-anatomy-canvas");
  assert.ok(first>0,"Anatomy canvas should contain visible pixels");
  await page.screenshot({path:"/tmp/prmr-r05-home-desktop.png",fullPage:false});
  step="sélection du porc, reins internes";
  await page.locator("#r5-home-stage button[data-stage-species=pig]").click();
  await page.waitForFunction(()=>document.querySelector("#r5-home-stage .r8-anatomy-canvas")?.dataset.anatomySpecies==="pig");
  assert.ok((await page.locator("#r5-home-stage .r4-st-renal-details").innerText()).includes("multipapillaire"));
  assert.equal(await page.locator("#r5-home-stage .r8-anatomy-canvas").getAttribute("data-anatomy-organ"),"kidneys");
  await page.screenshot({path:"/tmp/prmr-r05-home-pig-desktop.png",fullPage:false});
  step="switch coeur / foie / poumons / tous";
  const root="#r5-home-stage",scene=root+" .r8-anatomy-canvas";
  let previous=await hash(scene);
  for(const mode of ["heart","liver","lungs","all","kidneys"]){
   await page.locator(root+' button[data-organ="'+mode+'"]').click();
   await page.waitForFunction(([sel,id])=>document.querySelector(sel)?.dataset.anatomyOrgan===id,[scene,mode]);
   const active=await page.locator(root+' button[data-organ="'+mode+'"]').getAttribute("aria-pressed");
   assert.equal(active,"true",mode+" must become selected");
   const n=await hash(scene);
   assert.notEqual(n,previous,"Anatomical painting unchanged after organ switch "+mode);
   previous=n;
  }
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
  for(const name of ["mouse","rat","pig","dog","nhp","rabbit"]){
   await page.locator('#r4-visual-atlas button[data-stage-species="'+name+'"]').click();
   await page.waitForFunction(id=>document.querySelector("#r4-visual-atlas .r8-anatomy-canvas")?.dataset.anatomySpecies===id,name);
   await page.waitForFunction(id=>document.querySelector("#r4-body-3d")?.dataset.anatomySpecies===id,name);
  }
  await page.locator('#r4-visual-atlas button[data-stage-species="dog"]').click();
  await page.waitForFunction(()=>document.querySelector("#r4-3d-species")?.textContent.includes("Chien"));
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
  await page.screenshot({path:"/tmp/prmr-r05-mobile.png",fullPage:false});
  step="autres modules R01 R02 R03";
  await page.setViewportSize({width:1440,height:900});
  for(const path of ["risk-r03.html","screening.html","preclinical.html"]){
   await page.goto("http://127.0.0.1:4173/"+path+"?v=prmr-r08",{waitUntil:"domcontentloaded"});
   const selector={"risk-r03.html":"#r5-risk-stage","screening.html":"#r5-screening-stage","preclinical.html":"#r5-preclinical-stage"}[path];
   await onCanvas(selector+" .r8-anatomy-canvas");
   assert.equal(await page.locator(selector+" .r4-st-species-card").count(),6);
  }
  assert.deepEqual(errors,[],"Browser JS errors: "+errors.join(" | "));
  console.log("PASS PRMR-R08 — maillage transparent non vide, reins/coeur/foie/poumons, 6 espèces, synchronisation R04, 390px mobile, RDKit");
 }catch(err){
  console.error("PRMR R08 browser failure — "+step+": "+(err.stack||err));
  try{await page.screenshot({path:"/tmp/prmr-ui-error.png",fullPage:false})}catch{}
  process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

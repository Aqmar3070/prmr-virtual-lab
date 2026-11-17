// PRMR-R04 — Main fully interactive static-site dashboard.
import {computeR04,validateR04,SPECIES_R04,MOLECULES_R04,OPTIONS,DEFAULT_R04} from "./r04_engine.mjs";
import {ANCHORS} from "./r03_model.mjs";
import {create3D} from "./r04_visuals.mjs";
import {createAnatomyViewer} from "./r09_viewer.mjs";
import {createVisualAtlas} from "./r04_atlas.mjs?v=r09-real-organ-scenes-20261117";
const $=id=>document.getElementById(id);
const svgNS="http://www.w3.org/2000/svg";
const state={...DEFAULT_R04};
let atlas=null;
const colors=["#58dabe","#ffb877","#f07886"];
const fmt=(x,p=2)=>Number(x).toLocaleString("fr-FR",{maximumFractionDigits:p,minimumFractionDigits:p});
let kidney=null,body=null,molecule=null,coords=null,moleculeId="irbesartan";
const safeText=(id,text)=>{const e=$(id);if(e)e.textContent=text};
function el(tag,name,cls){const x=document.createElement(tag);if(name!==undefined)x.textContent=name;if(cls)x.className=cls;return x}
function speciesIcon(id){
 const sp=SPECIES_R04.find(item=>item.id===id);
 const alt=sp?sp.label:id;
 return '<div class="r4-st-art" data-species="'+id+'"><img src="./assets/animals-photo/'+id+'.webp" alt="Rendu visuel 3D-style de '+alt+'" width="512" height="384" loading="lazy"></div>';
}
function initSpecies(){
 for(const sp of SPECIES_R04){
  const btn=document.createElement("button");btn.type="button";btn.dataset.species=sp.id;
  btn.innerHTML=speciesIcon(sp.id)+"<span>"+sp.label+"</span>";
  const art=btn.querySelector("img");if(art)art.addEventListener("error",()=>{art.src="./assets/animals/"+sp.id+".svg"},{once:true});
  btn.title=sp.latin+" — "+sp.breed;btn.addEventListener("click",()=>setSpecies(sp.id));
  $("species-grid").append(btn);
  const row=el("tr");row.tabIndex=0;row.style.cursor="pointer";
  const tds=[sp.label,sp.anatomy,sp.focus,"Non mesurée chez PRMR (triple)"];
  for(const txt of tds)row.append(el("td",txt));
  const choose=()=>{setSpecies(sp.id);document.getElementById("parameters-heading").scrollIntoView({behavior:"smooth",block:"start"})};
  row.addEventListener("click",choose);
  row.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose()}});
  row.title="Choisir "+sp.label;
  row.dataset.species=sp.id;
  $("r4-species-table").append(row);
 }
}
function setSpecies(id){
 const sp=SPECIES_R04.find(s=>s.id===id);if(!sp)return;
 state.species=id;state.mass_kg=sp.ref_kg;
 const m=$("r4-mass");m.min=String(sp.min_kg);m.max=String(sp.max_kg);m.step=sp.ref_kg<.1?"0.001":sp.ref_kg<1?"0.005":"0.1";m.value=String(sp.ref_kg);
 $("mass-range").textContent="Plage illustrative : "+massFormat(sp.min_kg)+" à "+massFormat(sp.max_kg);
 document.querySelectorAll("#species-grid button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.species===id)));
 document.querySelectorAll("#r4-species-table tr").forEach(tr=>tr.style.background=tr.dataset.species===id?"#194454":"");
 update();
}
function massFormat(v){return v<1?fmt(v*1000,0)+" g":fmt(v,2)+" kg"}
function setOptions(){
 for(const field of ["age","sex","constitution","hydration","renal","hepatic","disease","regimen"]){
  $("r4-"+field).addEventListener("change",e=>{state[field]=e.target.value;update()});
 }
 $("r4-mass").addEventListener("input",e=>{state.mass_kg=Number(e.target.value);update()});
 $("r4-concentration").addEventListener("input",e=>{state.free_nM=Number(e.target.value);update()});
 $("r4-reset").addEventListener("click",()=>{
   Object.assign(state,DEFAULT_R04);
   for(const field of ["age","sex","constitution","hydration","renal","hepatic","disease","regimen"]){$("r4-"+field).value=state[field]}
   $("r4-concentration").value=String(state.free_nM);setSpecies(state.species);
 });
 $("r4-export").addEventListener("click",()=>{
  let result=computeR04(state);
  const file={created_at:new Date().toISOString(),project:"PRMR-R04",warning:"Résultats hypothétiques non calibrés; aucune probabilité de toxicité, bénéfice ni guérison",...result};
  const blob=new Blob([JSON.stringify(file,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(blob),a=el("a");a.href=u;a.download="PRMR-R04-"+state.species+"-scenario.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
 });
}
function makeSvg(svg,w=680,h=260){svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("preserveAspectRatio","xMidYMid meet");}
function updateExposure(result){
 const data=result.regimens.map((r,i)=>({id:r.id,v:r.renal.median,range:r.renal.range_5_95,color:colors[i]}));
 const svg=$("r4-exposure-chart");makeSvg(svg,630,235);
 const vmax=Math.max(2,...data.map(d=>d.range[1]))*1.13;
 const x0=72,yl=177,top=22,usable=yl-top,cell=158;
 let str='<title>Comparaison des marqueurs d’exposition relative, substances différentes, toxicité non estimable</title>';
 for(let tick=0;tick<=4;tick++){const y=yl-tick*usable/4;str+='<line x1="67" x2="600" y1="'+y+'" y2="'+y+'" stroke="#376077" stroke-width=".7"/><text x="60" y="'+(y+4)+'" fill="#b4ced6" font-size="11" text-anchor="end">'+fmt(vmax*tick/4,1)+'×</text>'}
 data.forEach((d,i)=>{
  const x=x0+i*cell+20,barW=64;
  const height=Math.max(2,usable*d.v/vmax),topY=yl-height;
  str+='<rect x="'+x+'" y="'+topY+'" width="'+barW+'" height="'+height+'" rx="6" fill="'+d.color+'"/>';
  const yL=yl-usable*d.range[0]/vmax,yH=yl-usable*d.range[1]/vmax,cx=x+barW/2;
  str+='<line x1="'+cx+'" x2="'+cx+'" y1="'+yL+'" y2="'+yH+'" stroke="#f3f9fb" stroke-width="2"/><path d="M'+(cx-7)+','+yL+' L'+(cx+7)+','+yL+' M'+(cx-7)+','+yH+' L'+(cx+7)+','+yH+'" fill="none" stroke="#f3f9fb" stroke-width="2"/>';
  str+='<text x="'+cx+'" y="'+Math.max(13,topY-7)+'" fill="#fff" text-anchor="middle" font-size="13" font-weight="bold">'+fmt(d.v)+'×</text>';
  str+='<text x="'+cx+'" y="197" fill="#d9e9ef" text-anchor="middle" font-size="12">'+d.id+'</text>';
 });
 str+='<text x="302" y="223" fill="#b3cbd4" font-size="10" text-anchor="middle">Modèle de sensibilité d’AUC, pas un indicateur commun de toxicité</text>';
 svg.innerHTML=str;
 const rows=result.regimens.map(g=>g.id+": ×"+fmt(g.renal.median)+" [×"+fmt(g.renal.range_5_95[0])+" ; ×"+fmt(g.renal.range_5_95[1])+"]");
 $("r4-exposure-note").replaceChildren(el("strong","Stress-test conditionnel (sans calibration animale)"),el("p",rows.join("   •   ")),el("p","Les fourchettes reflètent des coefficients exploratoires choisis, non un intervalle de confiance biologique."));
}
function updateHumanGraph(){
 const svg=$("r4-human-graph");makeSvg(svg,610,235);
 const anchors=[
  {label:"Dapagliflozine mère",values:ANCHORS.dapagliflozin_parent_renal,col:colors[0]},
  {label:"5-carboxypirfénidone",values:ANCHORS.pirfenidone_5carboxy_renal,col:colors[1]},
  {label:"Métabolite V pentoxifylline",values:ANCHORS.pentoxifylline_metabolite_V_renal,col:colors[2]}
 ];
 const left=62,right=580,top=20,bottom=172,ymax=14;
 let html='<title>Données humaines d’exposition AUC observée, par gravité rénale</title>';
 for(let t=0;t<=7;t++){let y=bottom-(t*2/ymax)*(bottom-top);html+='<line x1="60" x2="580" y1="'+y+'" y2="'+y+'" stroke="#285469"/><text x="54" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#bcd5de">'+(t*2)+'×</text>'}
 const xs=[80,232,384,545];
 for(const d of anchors){
  const points=d.values.map((v,i)=>xs[i]+","+(bottom-(v/ymax)*(bottom-top)));
  html+='<polyline fill="none" stroke="'+d.col+'" stroke-width="3" points="'+points.join(" ")+'"/>';
  d.values.forEach((v,i)=>{let y=bottom-(v/ymax)*(bottom-top);html+='<circle cx="'+xs[i]+'" cy="'+y+'" r="4" fill="'+d.col+'"/>'});
 }
 ["Normale","Légère","Modérée","Sévère"].forEach((name,i)=>html+='<text x="'+xs[i]+'" y="192" text-anchor="middle" fill="#c9dae1" font-size="10">'+name+'</text>');
 html+='<text x="310" y="217" text-anchor="middle" fill="#8eafbc" font-size="10">Atteinte rénale humaine · références pharmacocinétiques</text>';
 svg.innerHTML=html;
}
function updatePdGraph(result){
 const svg=$("r4-pd-graph");makeSvg(svg,610,235);
 let html='<title>Inhibition théorique SGLT2 uniquement si IC50 expérimentale connue</title>';
 if(result.species.ic50===null){
  html+='<rect x="38" y="34" width="534" height="154" rx="13" fill="#123246" stroke="#376475" stroke-dasharray="7 6"/>';
  html+='<text x="305" y="98" text-anchor="middle" fill="#ffcf99" font-size="16" font-weight="700">Non estimable pour cette espèce</text>';
  html+='<text x="305" y="126" text-anchor="middle" fill="#cadde5" font-size="12">IC₅₀ SGLT2 non documentée dans le modèle PRMR.</text>';
  html+='<text x="305" y="153" text-anchor="middle" fill="#abc5d2" font-size="11">Aucune valeur empruntée à la souris ou au rat.</text>';
  $("r4-pd-note").textContent="Modèle PD non disponible chez "+result.species.label+" : aucune puissance SGLT2 validée pour cette espèce dans notre jeu.";
  svg.innerHTML=html;return;
 }
 const ic=result.species.ic50,left=58,right=563,top=26,bottom=176,scale=10;
 for(let t=0;t<=5;t++){const y=bottom-t/5*(bottom-top);html+='<line x1="'+left+'" x2="'+right+'" y1="'+y+'" y2="'+y+'" stroke="#245368"/><text x="51" y="'+(y+4)+'" text-anchor="end" fill="#b7d5de" font-size="10">'+(t*20)+'%</text>'}
 let points=[];
 for(let c=0;c<=10.0001;c+=.1){const x=left+c/scale*(right-left),v=c/(ic+c),y=bottom-v*(bottom-top);points.push(fmt(x,2)+","+fmt(y,2))}
 html+='<polyline points="'+points.join(" ")+'" fill="none" stroke="#64e4cf" stroke-width="3"/>';
 const x=left+result.inputs.free_nM/scale*(right-left),y=bottom-result.sglt2_occupancy*(bottom-top);
 html+='<line x1="'+x+'" x2="'+x+'" y1="23" y2="'+bottom+'" stroke="#eabb79" stroke-dasharray="4 5"/><circle cx="'+x+'" cy="'+y+'" r="6" fill="#ffce85"/>';
 html+='<text x="'+Math.max(75,Math.min(x,530))+'" y="'+Math.max(18,y-13)+'" font-size="12" text-anchor="middle" font-weight="800" fill="#ffe2a6">'+fmt(100*result.sglt2_occupancy,1)+' %</text>';
 html+='<text x="312" y="215" font-size="10" fill="#afc6d1" text-anchor="middle">Concentration libre hypothétique (0 à 10 nM) · AUC et dose non reliées</text>';
 for(const t of [0,2,4,6,8,10])html+='<text x="'+(left+t/10*(right-left))+'" y="194" text-anchor="middle" font-size="10" fill="#b7d5de">'+t+'</text>';
 $("r4-pd-note").textContent="À "+fmt(result.inputs.free_nM,2)+" nM libre, inhibition SGLT2 théorique "+fmt(100*result.sglt2_occupancy,1)+" % (IC₅₀ "+ic+" nM, mesure in vitro). Ni dose ni efficacité rénale prédite.";
 svg.innerHTML=html;
}
function updateCard(result){
 const profile=result.species;
 safeText("r4-profile-title",profile.label+" — "+profile.breed);
 safeText("r4-profile-detail",profile.latin+" · "+massFormat(result.inputs.mass_kg)+" · "+OPTIONS.age[result.inputs.age]+" · "+OPTIONS.sex[result.inputs.sex]+" · "+OPTIONS.disease[result.inputs.disease]);
 safeText("mass-readout",massFormat(result.inputs.mass_kg));
 safeText("free-readout",fmt(result.inputs.free_nM,2)+" nM");
 safeText("r4-3d-species",profile.label+" · Organes séparables et rotatifs en 3D");
 safeText("r4-anatomy",profile.anatomy);
 safeText("r4-focus","Intérêt : "+profile.focus+". Mesures prioritaires : "+result.indication.markers+".");
 const link=$("r4-source");link.href=profile.source;link.textContent="Ouvrir la publication de référence ("+profile.label+")";
 safeText("r4-active-name",result.active.id);
 safeText("r4-risk-decision","Bénéfice additionnel non mesuré. La maladie « "+OPTIONS.disease[result.inputs.disease]+" » exige : "+result.indication.markers+". La marge de sécurité n'est pas calculable sans toxicocinétique.");
 const list=$("r4-observations");list.replaceChildren();
 const notes=[
  {name:"Question biologique",detail:"Cible : "+result.indication.target+"."},
  {name:"Allométrie interne",detail:"Multiplicateur purement mathématique masse^0,25 : ×"+fmt(result.mass_factor,3)+" contre l'animal de masse référence, sans prédiction de clairance."},
  ...result.observations,
  ...(result.observations.length===0?[{name:"Âge / sexe / constitution",detail:"Aucun facteur individuel calibré, les chiffres PK restent seulement des hypothèses de transfert."}]:[])
 ];
 notes.slice(0,9).forEach(n=>{const div=el("div",undefined,"r4-reason");div.append(el("b",n.name),el("span",n.detail));list.append(div)});
}
function update(){
 let result;
 try{result=computeR04(state)}catch(e){$("r4-profile-detail").textContent=e.message;return}
 updateCard(result);updateExposure(result);updatePdGraph(result);
 body?.set({species:state.species,inputs:result.inputs});
 kidney?.set({species:state.species,inputs:result.inputs});
 atlas?.render(result);
 const c=document.querySelector(".r4-banner");
 c.textContent="STATUT SCIENTIFIQUE — "+result.species.label+" : stress-test fondé sur des rapports AUC humains et un transfert arbitraire. Les changements âge / sexe / constitution sont documentés mais sans coefficient PK inventé. Probabilités de toxicité, d'efficacité ou de guérison : non estimables.";
 // make selected species visible
 document.querySelectorAll("#species-grid button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.species===state.species)));
}
async function initMolecules(){
 const host=$("r4-molecules");let data=null;
 try{
  const response=await fetch("./research-data/r04_molecular_3d.json");
  if(!response.ok)throw Error("HTTP "+response.status);
  data=await response.json();coords=data;
 }catch(e){$("r4-molecule-data").textContent="Conformères indisponibles : "+e.message;return}
 for(const mol of MOLECULES_R04){
  const btn=document.createElement("button");btn.className="r4-molecule";btn.type="button";btn.dataset.molecule=mol.id;
  const canvas=document.createElement("canvas");canvas.className="r4-molecule-thumb3d";
  canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Conformère 3D manipulable de "+mol.name);
  btn.append(canvas,el("h3",mol.name),el("p",mol.axis));
  btn.addEventListener("click",()=>selectMolecule(mol.id));host.append(btn);
  if(data[mol.id])create3D(canvas,{kind:"molecule",model:data[mol.id]});
 }
 selectMolecule("irbesartan");
}
function selectMolecule(id){
 if(!coords||!coords[id])return;
 moleculeId=id;const mol=MOLECULES_R04.find(m=>m.id===id),con=coords[id];
 document.querySelectorAll("[data-molecule]").forEach(b=>b.classList.toggle("active",b.dataset.molecule===id));
 safeText("r4-molecule-name",mol.name);safeText("r4-molecule-function",mol.axis);
 safeText("r4-molecule-data",con.formula+" · "+con.a.length+" atomes lourds · "+con.b.length+" liaisons · modèle RDKit ETKDG/MMFF");
 $("r4-molecule-pubchem").href="https://pubchem.ncbi.nlm.nih.gov/compound/"+mol.cid;
 if(molecule)molecule.set({kind:"molecule",model:con});else molecule=create3D($("r4-molecule-3d"),{kind:"molecule",model:con});
}
function init(){
 initSpecies();setOptions();atlas=createVisualAtlas({
  onChoose:setSpecies,
  onOrganChange:id=>{body?.set({organ:id});kidney?.setOrgan(id)},
  getResult:()=>computeR04(state),
  onEdit:patch=>{
   Object.assign(state,patch);
   for(const [key,value] of Object.entries(patch)){
    const field=$("r4-"+key);if(field)field.value=value;
   }
   update();
  }
 });kidney=createAnatomyViewer($("r4-kidney-3d"),{species:state.species,organ:"kidneys",isolated:true});
 body=createAnatomyViewer($("r4-body-3d"),{
  species:state.species,organ:"kidneys",
  onRender:({species,organ,count,source})=>{
   const target=$("r4-body-render-status");
   if(target)target.textContent=(source==="canine-CT-derived-hybrid-GLB"?"Chien : surfaces vétérinaires CT modifiées et sculptées":"3D anatomique pédagogique non validée")+" · "+organ+" · rotation interactive.";
   const viewer=$("r4-body-3d");
   if(viewer)viewer.dataset.renderMode="webgl-anatomy";
  }
 });
 if(!body.supported){
  const target=$("r4-body-render-status");
  if(target)target.textContent="WebGL 3D indisponible ; repli sur atlas Canvas 2D.";
 }
 updateHumanGraph();
 const requested=new URLSearchParams(location.search).get("species");
 setSpecies(SPECIES_R04.some(x=>x.id===requested)?requested:state.species);
 initMolecules();
}
init();

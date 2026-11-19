import {create3D} from "./r04_visuals.mjs?v=conformer2";
import {MOLECULES_R04} from "./r04_engine.mjs";

const byId=id=>document.getElementById(id);
const format=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:4});
const normalize=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const fmt=value=>format.format(value);
function element(tag,text){
  const el=document.createElement(tag);el.textContent=text;return el;
}
function structure(cid){
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg"),use=document.createElementNS(ns,"use");
  svg.setAttribute("viewBox","0 0 280 150");svg.setAttribute("aria-hidden","true");
  use.setAttribute("href","./assets/screen/structures.svg#cid-"+cid);
  svg.append(use);return svg;
}
function facts(id,entries){
  byId(id).replaceChildren(...entries.map(([label,value])=>{
    const row=document.createElement("div");row.append(element("dt",label),element("dd",value));return row;
  }));
}
function openRecord(){
  const name=location.hash.slice(1);
  const aliases={"rubrique-methode":"methode","rubrique-sources":"sources","rubrique-donnees":"all-combinations","rubrique-montre":"console"};
  const target=byId(aliases[name]||name);
  if(target?.tagName==="DETAILS"){target.open=true;target.scrollIntoView();}
  else if(aliases[name])target?.scrollIntoView();
}
window.addEventListener("hashchange",openRecord);
for(const link of document.querySelectorAll('nav a[href^="#"]')){
  link.addEventListener("click",()=>{const node=byId(link.hash.slice(1));if(node?.tagName==="DETAILS")node.open=true;});
}
openRecord();

async function start(){
  const response=await fetch(byId("console").dataset.source);
  if(!response.ok)throw Error("Registre indisponible");
  const data=await response.json();
  if(data.combinations.length!==165 || data.counts.remaining_hypotheses!==44)throw Error("Registre incomplet");
  let coords={};
  try {
    const res=await fetch("./research-data/r04_molecular_3d.json");if(res.ok)coords=await res.json();
  } catch { /* The verified 2D structures remain available offline from the same origin. */ }
  const molecules=data.molecules;
  const entries=[...data.combinations].sort((a,b)=>Number(b.status==="hypothese_in_silico")-Number(a.status==="hypothese_in_silico")||b.priority_index-a.priority_index)
    .map((combo,i)=>({...combo,code:"C-"+String(i+1).padStart(3,"0")}));
  const canvas=byId("model"),select=byId("compound"),motion=matchMedia("(prefers-reduced-motion: reduce)");
  let current,viewer=null,auto=!motion.matches;
  function spin(value){
    auto=value;viewer?.setAutoRotate(value);byId("spin").setAttribute("aria-pressed",String(value));
  }
  function displayDrug(){
    const drug=molecules[Number(select.value)];
    const known=MOLECULES_R04.find(m=>m.cid===drug.cid),model=known&&coords[known.id];
    byId("structure").replaceChildren(structure(drug.cid));
    byId("card-name").textContent="· "+drug.name;
    facts("identity",[["Formule",drug.formula],["Axe",drug.axis],["Masse",fmt(drug.mass_g_mol)+" g/mol"],["cLogP",fmt(drug.clogp)]]);
    const source=element("a","PubChem · "+drug.cid);source.href=drug.pubchem_url;
    const sourceRow=document.createElement("div"),sourceValue=document.createElement("dd");
    sourceValue.append(source);sourceRow.append(element("dt","Source"),sourceValue);byId("identity").append(sourceRow);
    byId("dimension").textContent=model?"3D · RDKit":"Structure 2D";
    canvas.hidden=!model;byId("flat").hidden=Boolean(model);
    byId("spin").disabled=byId("reset").disabled=!model;
    if(model){
      if(viewer){viewer.set({kind:"molecule",model});viewer.reset();}
      else viewer=create3D(canvas,{kind:"molecule",model,transparent:true,fitConformer:true,autoRotate:auto});
      canvas.setAttribute("aria-label",drug.name+" en 3D. Glisser ou utiliser les flèches pour tourner. Espace pour la pause.");
    }else{
      viewer?.destroy();viewer=null;
      byId("flat").replaceChildren(structure(drug.cid));
    }
    spin(auto);
  }
  function pick(combo,preferred){
    current=combo;
    for(const button of byId("rows").children)button.setAttribute("aria-pressed",String(button.dataset.code===combo.code));
    byId("preview-id").textContent="· "+combo.code;byId("detail-id").textContent="· "+combo.code;
    select.replaceChildren(...combo.indices.map(i=>new Option(molecules[i].name,i)));
    const member=combo.indices.includes(preferred)?preferred:combo.indices.find(i=>MOLECULES_R04.some(m=>m.cid===molecules[i].cid&&coords[m.id]));
    if(member!==undefined)select.value=String(member);
    facts("details",[["Association",combo.agents.join(" + ")],["Axes étudiés",combo.axes.join(" · ")],["Indice exploratoire",fmt(combo.priority_index)],["Diversité structurale",fmt(combo.structural_diversity)],["Statut",combo.status==="hypothese_in_silico"?"Hypothèse à valider":"Suspendue · "+combo.reasons.map(s=>s.replaceAll("_"," ")).join(", ")]]);
    displayDrug();
  }
  function filter(){
    const term=normalize(byId("query").value.trim()),size=byId("size").value,status=byId("status").value;
    const list=entries.filter(c=>(!size||Number(size)===c.n_agents)&&(!status||c.status===status)&&normalize(c.code+" "+c.agents.join(" ")).includes(term));
    const rows=byId("rows");rows.replaceChildren();
    byId("count").textContent=list.length+" combinaison"+(list.length===1?"":"s");
    for(const c of list){
      const btn=element("button","");btn.className="row";btn.dataset.code=c.code;btn.title=c.agents.join(" + ");
      btn.setAttribute("aria-pressed",String(c===current));
      const label=document.createElement("span");label.append(element("b",c.code),element("small",btn.title));
      btn.append(structure(molecules[c.indices.at(-1)].cid),label);
      btn.addEventListener("click",()=>pick(c));rows.append(btn);
    }
    if(!list.length){rows.append(element("p","Aucune combinaison pour ces critères."));return;}
    if(!list.includes(current))pick(list[0]);
  }
  function reveal(combo,member){
    byId("query").value="";byId("status").value="";byId("size").value="";filter();pick(combo,member);
    byId("rows").querySelector('[aria-pressed="true"]')?.scrollIntoView({block:"nearest"});
  }
  ["Pirfénidone","Pentoxifylline"].forEach((name,i)=>{
    const combo=entries.find(c=>c.n_agents===3&&["Irbesartan","Dapagliflozine",name].every(s=>c.agents.includes(s)));
    if(!combo)return;
    const id=molecules.findIndex(m=>m.name===name);
    const btn=element("button","");btn.className="lead";
    const label=document.createElement("span");label.append(element("b","Piste "+(i+1)),element("small",name+" · R02-"+(i?"B":"A")));
    btn.append(structure(molecules[id].cid),label,element("em","Validation préclinique requise"));
    btn.title=combo.agents.join(" + ");btn.addEventListener("click",()=>reveal(combo,id));byId("leads").append(btn);
  });
  for(const d of molecules){
    const card=document.createElement("article"),a=element("a","PubChem CID "+d.cid);a.href=d.pubchem_url;
    card.append(element("h3",d.name),structure(d.cid),element("p",d.axis+" · "+d.formula),element("p",fmt(d.mass_g_mol)+" g/mol · cLogP "+fmt(d.clogp)+" · TPSA "+fmt(d.tpsa_A2)+" Å²"),element("p",d.alert),a);byId("library").append(card);
  }
  select.addEventListener("change",displayDrug);
  byId("filters").onclick=()=>{byId("choices").hidden=!byId("choices").hidden;byId("filters").setAttribute("aria-expanded",String(!byId("choices").hidden));};
  byId("query").oninput=filter;byId("size").onchange=byId("status").onchange=filter;
  byId("spin").onclick=()=>spin(!auto);byId("reset").onclick=()=>viewer?.reset();
  motion.addEventListener("change",()=>spin(!motion.matches));
  canvas.onkeydown=e=>{
    const steps={ArrowLeft:[-.16,0],ArrowRight:[.16,0],ArrowUp:[0,-.16],ArrowDown:[0,.16]};
    if(e.key===" "){e.preventDefault();spin(!auto);}
    else if(steps[e.key]){e.preventDefault();viewer?.rotate(...steps[e.key]);}
  };
  const preview=byId("conformeres");
  byId("full").onclick=async()=>{
    if(document.fullscreenElement){await document.exitFullscreen();return;}
    if(preview.classList.contains("expanded")){preview.classList.remove("expanded");return;}
    try{await preview.requestFullscreen();}catch{preview.classList.add("expanded");}
  };
  document.addEventListener("keydown",e=>{if(e.key==="Escape")preview.classList.remove("expanded");});
  filter();
}
start().catch(error=>{byId("rows").textContent="Chargement impossible · "+error.message;byId("count").textContent="Registre indisponible";});

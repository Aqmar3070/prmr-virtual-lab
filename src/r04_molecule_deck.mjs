// PRMR core molecule workshop: interactive RDKit conformers integrated into the original editor.
import {create3D} from "./r04_visuals.mjs";
import {MOLECULES_R04} from "./r04_engine.mjs";
const root=document.getElementById("r5-molecular-deck");
if(root){
 const status=document.getElementById("r5-molecular-deck-status");
 Promise.all([
  fetch("./research-data/r04_molecular_3d.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Conformères non disponibles");return r.json()}),
  fetch("./research-data/prmr-r02-screen.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Bibliothèque R02 non disponible");return r.json()})
 ]).then(([coords,registry])=>{
  root.replaceChildren();
  for(const mol of MOLECULES_R04){
   const con=coords[mol.id],d=registry.molecules.find(x=>x.cid===mol.cid);
   if(!con||!d)continue;
   const btn=document.createElement("button");btn.type="button";btn.className="r4-st-molecule-card";btn.setAttribute("aria-label","Afficher la conformation 3D et remplir l'éditeur avec "+mol.name);
   const canvas=document.createElement("canvas");canvas.setAttribute("aria-label","Conformère 3D RDKit de "+mol.name+" ; pivoter au toucher");canvas.style.width="100%";canvas.style.height="160px";canvas.style.display="block";canvas.style.touchAction="none";canvas.style.borderRadius="9px";
   const title=document.createElement("strong");title.textContent=mol.name;
   const subtitle=document.createElement("small");subtitle.textContent=mol.axis;
   btn.append(canvas,title,subtitle);root.append(btn);
   create3D(canvas,{kind:"molecule",model:con});
   btn.addEventListener("click",()=>{
    root.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===btn)));
    const name=document.getElementById("mol-name"),smiles=document.getElementById("mol-smiles");
    if(name)name.value=mol.name;
    if(smiles)smiles.value=d.smiles;
    const button=document.getElementById("analyze-mol");
    if(button&&!button.disabled)button.click();
    if(status)status.textContent=mol.name+" : coordonnées 3D RDKit chargées ; SMILES transféré dans l'éditeur scientifique.";
   });
  }
  if(status)status.textContent="Quatre conformères RDKit disponibles et orientables. Cliquer sur une carte charge aussi le SMILES dans l'éditeur.";
 }).catch(e=>{if(status)status.textContent="Conformères indisponibles : "+e.message});
}

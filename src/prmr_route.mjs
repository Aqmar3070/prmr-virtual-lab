/* R11 consistent navigation across PRMR pages. Active page derived from path; no stored personal data. */
const PAGES=[
 {file:"index.html",name:"Parcours",phase:"Accueil"},
 {file:"preclinical.html",name:"Preuves",phase:"01"},
 {file:"species-r04.html",name:"Chien 3D",phase:"02"},
 {file:"screening.html",name:"Molécules",phase:"03"},
 {file:"risk-r03.html",name:"Simulations",phase:"04"},
 {file:"clinical.html",name:"Humain & clinique",phase:"05"}
];
const current=location.pathname.split("/").pop()||"index.html";
const bar=document.createElement("div");bar.className="prmr-routebar";bar.setAttribute("role","navigation");bar.setAttribute("aria-label","Parcours scientifique PRMR");
const inner=document.createElement("div");inner.className="prmr-route-inner";
const skip=document.createElement("a");skip.className="prmr-route-skip";skip.href="#prmr-primary-content";skip.textContent="Aller au contenu principal";bar.append(skip);
const brand=document.createElement("a");brand.href="./index.html";brand.className="prmr-route-brand";brand.textContent="PRMR · LABORATOIRE";inner.append(brand);
const caption=document.createElement("span");caption.className="prmr-route-caption";caption.textContent="Parcours de recherche";inner.append(caption);
const links=document.createElement("div");links.className="prmr-route-links";
for(const p of PAGES){const a=document.createElement("a");a.href="./"+p.file;if(current===p.file)a.setAttribute("aria-current","page");a.className="prmr-route-step";
 const phase=document.createElement("small");phase.textContent=p.phase;const label=document.createElement("span");label.textContent=p.name;a.append(phase,label);links.append(a)}
inner.append(links);
const state=document.createElement("span");state.className="prmr-route-state";state.textContent="Recherche exploratoire · aucun essai humain PRMR";inner.append(state);bar.append(inner);
document.body.prepend(bar);
const main=document.querySelector("main");if(main&&!main.id)main.id="prmr-primary-content";

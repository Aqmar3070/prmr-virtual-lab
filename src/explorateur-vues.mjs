// Deux vues dans le même explorateur : « Substances » (scénario d'exposition)
// et « Maladies » (registre). Le corps 3D est partagé ; seule la vue active
// envoie ses zones à l'atlas. Le choix est gardé dans l'adresse et, si possible,
// dans le navigateur.
const params=new URLSearchParams(location.search);
let memoire=null;
try{memoire=localStorage.getItem("prmr-vue");}catch{}
const depart=params.get("vue")||(params.get("maladie")?"maladies":memoire)||"substances";

export function vueActive(){return document.body.dataset.vue||"substances";}

function choisirVue(vue){
 if(vue!=="maladies")vue="substances";
 document.body.dataset.vue=vue;
 for(const b of document.querySelectorAll("[data-choix-vue]"))b.setAttribute("aria-pressed",String(b.dataset.choixVue===vue));
 const url=new URL(location.href);url.searchParams.set("vue",vue);history.replaceState(null,"",url);
 try{localStorage.setItem("prmr-vue",vue);}catch{}
 document.dispatchEvent(new CustomEvent("xp-focus",{detail:""}));
 document.dispatchEvent(new CustomEvent("xp-vue",{detail:vue}));
}
for(const b of document.querySelectorAll("[data-choix-vue]"))b.addEventListener("click",()=>choisirVue(b.dataset.choixVue));
document.body.dataset.vue=depart==="maladies"?"maladies":"substances";
for(const b of document.querySelectorAll("[data-choix-vue]"))b.setAttribute("aria-pressed",String(b.dataset.choixVue===document.body.dataset.vue));

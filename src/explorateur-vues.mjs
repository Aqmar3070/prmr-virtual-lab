export function vueActive(){return document.body.dataset.vue||"substances";}

const normaliser=vue=>["substances","maladies","symptomes"].includes(vue)?vue:"substances";

function choisirVue(vue){
 vue=normaliser(vue);
 document.body.dataset.vue=vue;
 for(const b of document.querySelectorAll("[data-choix-vue]"))b.setAttribute("aria-pressed",String(b.dataset.choixVue===vue));
 const url=new URL(location.href);url.searchParams.set("vue",vue);history.replaceState(null,"",url);
 try{localStorage.setItem("prmr-vue",vue);}catch{}
 document.dispatchEvent(new CustomEvent("xp-focus",{detail:""}));
 document.dispatchEvent(new CustomEvent("xp-vue",{detail:vue}));
}
for(const b of document.querySelectorAll("[data-choix-vue]"))b.addEventListener("click",()=>choisirVue(b.dataset.choixVue));

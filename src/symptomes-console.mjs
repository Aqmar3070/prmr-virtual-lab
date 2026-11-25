// Vue Symptômes : symptômes à gauche, corps 3D au centre, maladies correspondantes à droite.
import {filtrer,departager,urgence,zonesDe,chercher} from "./symptomes.mjs";

const $=id=>document.getElementById("sy-"+id);
const MSD="https://www.msdmanuals.com/fr/professional/";
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const sexe=()=>document.querySelector("#sex-choice [aria-pressed=true]")?.dataset.sex||"male";
const active=()=>document.body.dataset.vue==="symptomes";
const choix=new Set();
let data=null,parId=new Map(),ouverts=new Set();

function bouton(s){
 const b=el("button",s.nom,"sy-symptome");b.type="button";b.dataset.symptome=s.id;
 b.setAttribute("aria-pressed",String(choix.has(s.id)));
 b.onclick=()=>basculer(s.id);return b;
}
function basculer(id){if(choix.has(id))choix.delete(id);else choix.add(id);rendre();}

function rendreGauche(){
 const q=$("recherche").value;
 const sel=$("choisis");sel.replaceChildren();
 for(const id of choix){const s=parId.get(id);const b=el("button",s.nom+" ×","sy-puce");b.type="button";b.setAttribute("aria-label","Retirer "+s.nom);b.onclick=()=>basculer(id);sel.append(b);}
 if(choix.size){const t=el("button","Tout effacer","sy-effacer");t.type="button";t.onclick=()=>{choix.clear();rendre();};sel.append(t);}
 const dest=$("groupes");dest.replaceChildren();
 if(q.trim()){
  const r=chercher(data,q);
  if(!r.length)dest.append(el("p","Aucun symptôme ne correspond.","sy-vide"));
  for(const s of r)dest.append(bouton(s));
  return;
 }
 for(const g of data.groupes){
  const items=data.symptomes.filter(s=>s.groupe===g);
  const d=el("details");d.open=ouverts.has(g);d.ontoggle=()=>{if(d.open)ouverts.add(g);else ouverts.delete(g);};
  const n=items.filter(s=>choix.has(s.id)).length;
  const sum=el("summary",g);if(n)sum.append(el("b",String(n)));d.append(sum);
  const box=el("div",null,"sy-liste");box.append(...items.map(bouton));d.append(box);dest.append(d);
 }
}

function carte(m){
 const d=el("details",null,"sy-maladie");
 const sum=el("summary");sum.append(el("span",m.nom));
 if(choix.size)sum.append(el("small",choix.size+"/"+m.symptomes.length));
 d.append(sum);
 const ul=el("div",null,"sy-signes");
 for(const id of m.symptomes){const s=parId.get(id);const t=el("button",s.nom,choix.has(id)?"sy-signe sy-ok":"sy-signe");t.type="button";t.title=choix.has(id)?"Symptôme coché":"Ajouter ce symptôme";t.onclick=()=>basculer(id);ul.append(t);}
 d.append(ul);
 const liens=el("p",null,"sy-liens");
 if(m.fiche){const a=el("a","Fiche PRMR : Guéris · Testés · Pistes");a.href="?vue=maladies&maladie="+encodeURIComponent(m.id);liens.append(a);}
 if(m.msd){const a=el("a","Manuel MSD");a.href=MSD+m.msd;a.target="_blank";a.rel="noopener noreferrer";liens.append(a);}
 else liens.append(el("small","Source de référence à compléter"));
 d.append(liens);return d;
}

function rendreDroite(){
 const res=filtrer(data,choix,sexe());
 $("n").textContent=String(res.length);
 $("alerte").hidden=!urgence(data,choix);
 const dest=$("resultats");dest.replaceChildren();
 if(!choix.size)dest.append(el("p","Cliquez un symptôme à gauche : toutes les maladies où il apparaît s'affichent ici. Chaque symptôme ajouté réduit la liste.","sy-vide"));
 else if(!res.length)dest.append(el("p","Aucune maladie du registre ne réunit tous ces symptômes. Retirez le moins sûr, ou consultez : l'association peut relever d'une cause non répertoriée.","sy-vide"));
 else for(const m of res)dest.append(carte(m));
 const aff=$("affiner");aff.replaceChildren();
 const dep=choix.size?departager(res,choix):[];
 if(dep.length){aff.append(el("h3","Pour affiner, le sujet a-t-il aussi :"));const box=el("div",null,"sy-liste");box.append(...dep.map(id=>bouton(parId.get(id))));aff.append(box);}
}

function envoyerAtlas(){
 if(!data||!active())return;
 const zones=zonesDe(data,choix);
 document.dispatchEvent(new CustomEvent("xp-atlas",{detail:{sex:sexe(),signals:zones.length?[{zones,niveau:"modere"}]:[]}}));
}
function rendre(){if(!data)return;rendreGauche();rendreDroite();envoyerAtlas();}

$("recherche").addEventListener("input",rendreGauche);
document.getElementById("sex-choice").addEventListener("click",()=>setTimeout(()=>{if(active()&&data){rendreDroite();envoyerAtlas();}}));
document.addEventListener("xp-vue",e=>{if(e.detail==="symptomes")rendre();});
document.addEventListener("xp-atlas-ready",envoyerAtlas);
fetch("./research-data/symptomes.json").then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{
 data=d;parId=new Map(d.symptomes.map(s=>[s.id,s]));$("note").textContent=d.avertissement;rendre();
}).catch(()=>{$("resultats").textContent="Données des symptômes indisponibles.";});

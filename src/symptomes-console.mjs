import {regions,rules,correspondances,urgence} from "./symptomes-registre.mjs";
import {plier,TYPES,FORCES} from "./maladies.mjs";
const $=id=>document.getElementById("sx-"+id);
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
function button(text,act){const b=node("button",text);b.type="button";b.onclick=act;return b;}
function link(text,url){const a=node("a",text);a.href=url;a.target="_blank";a.rel="noopener";return a;}
const profile=[...$("profile").querySelectorAll("[name]")];
const catalogue=new Set(Object.values(regions).flatMap(group=>Object.values(group).flatMap(text=>text.split("|"))));
const signs=new Set();
let register,failed=false;
const key="prmr-observations-symptomes-v1";
function observations(){
 const list=JSON.parse(localStorage.getItem(key)||"[]");
 if(!Array.isArray(list))throw Error("Format indisponible");
 return list;
}
function historyList(){
 const dest=$("history");dest.replaceChildren();
 try{
 for(const o of observations().slice().reverse()){
  const row=node("div","");row.append(button(new Date(o.date).toLocaleString("fr")+" · "+o.signs.length+" signe(s)",()=>{
   for(const f of profile)f.value=o.profile[f.name]??"";
   signs.clear();for(const s of o.signs)signs.add(s);
   render();$("status").textContent="Observation rechargée.";
  }),button("Supprimer",()=>{
   try{localStorage.setItem(key,JSON.stringify(observations().filter(it=>it.id!==o.id)));historyList();$("status").textContent="Observation supprimée.";}
   catch{$("status").textContent="Suppression impossible dans ce navigateur.";}
  }));dest.append(row);
 }
 }catch{$("status").textContent="Historique local indisponible.";}
}
$("save").onclick=()=>{
 if(!signs.size){$("status").textContent="Sélectionnez au moins un symptôme.";return;}
 for(const f of profile)if(!f.reportValidity())return;
 try{
  const list=observations();list.push({id:crypto.randomUUID(),date:new Date().toISOString(),profile:Object.fromEntries(profile.map(f=>[f.name,f.value])),signs:[...signs]});
  localStorage.setItem(key,JSON.stringify(list));historyList();$("status").textContent="Observation enregistrée sur cet appareil.";
 }catch{$("status").textContent="Enregistrement local impossible.";}
};
for(const region of Object.keys(regions))$("region").add(new Option(region,region));
function toggle(s){if(signs.has(s))signs.delete(s);else signs.add(s);render();}
function signButton(s){const b=button(s,()=>toggle(s));b.setAttribute("aria-pressed",String(signs.has(s)));return b;}
function listSigns(){
 const dest=$("signs"),query=plier($("search").value.trim());dest.replaceChildren();
 for(const [region,groups] of Object.entries(regions)){
  if(!query&&region!==$("region").value)continue;
  for(const [group,terms] of Object.entries(groups)){
   const matches=terms.split("|").filter(s=>!query||plier([s,region,group].join(" ")).includes(query));
   if(matches.length)dest.append(node("h3",group),...matches.map(signButton));
  }
 }
 if(!dest.childElementCount)dest.append(node("p","Aucun libellé trouvé. Vous pouvez saisir le symptôme librement."));
}
function render(){
 listSigns();const sel=$("selected");sel.replaceChildren();
 if(!signs.size)sel.append(node("p","Aucun symptôme sélectionné."));
 for(const s of signs){const b=button(s+" ×",()=>toggle(s));b.setAttribute("aria-label","Retirer "+s);sel.append(b);}
 const dest=$("results");dest.replaceChildren();
 if(urgence(signs)){
  const alert=node("p","Si ces signes sont actuels, contactez immédiatement les urgences locales. Une évaluation urgente est nécessaire.");alert.className="sx-alert";dest.append(alert);return;
 }
 if(!signs.size){dest.append(node("p","Les fiches apparaissent lorsque plusieurs signes correspondent."));return;}
 if(!register){dest.append(node("p",failed?"Le registre est indisponible. La saisie reste accessible.":"Chargement du registre…"));return;}
 const diabete=$("profile").querySelector('[name=diabete]').value;
 const matches=correspondances(signs,diabete);
 dest.append(node("p","Rapprochements exploratoires selon les signes communs. Le catalogue est partiel. Une cause reste possible même en l’absence de correspondance."));
 for(const rule of matches){
  const m=register.maladies.find(m=>m.id===rule.id);if(!m)continue;
  const d=node("details","");d.append(node("summary",m.nom+" · "+rule.hits.length+" signes communs"),node("p","Signes concordants : "+rule.hits.join(", ")));
  const missing=[...signs].filter(s=>!rule.hits.includes(s));if(missing.length)d.append(node("p","Signes non couverts par cette fiche : "+missing.join(", ")));
  d.append(link("Source des signes · NHS",rule.source),node("h3","Prises en charge étudiées"));
  const age=profile.find(f=>f.name==="age").value;
  d.append(node("p",age!==""&&Number(age)<18?"Sujet mineur : l’applicabilité des données pédiatriques doit être vérifiée par un professionnel.":"Le choix individuel demande de vérifier le diagnostic, les antécédents, les allergies et les interactions. Le profil saisi ne détermine aucune dose."));
  for(const type of ["medicament","geste","naturel","regime"]){
   const items=(m.substances||[]).filter(s=>s.type===type);if(!items.length)continue;
   d.append(node("h4",TYPES[type]));const ul=node("ul","");
   for(const item of items){const li=node("li",item.nom+" · "+(FORCES[item.force]?.libelle??"Preuve non classée")+". "+(item.resume||item.effet||""));
    const src=register.sources[item.source];if(src?.url)li.append(" ",link("Étude",src.url));ul.append(li);}
   d.append(ul);
  }
  const full=link("Ouvrir la fiche Maladies","?vue=maladies&maladie="+encodeURIComponent(m.id));d.append(full);dest.append(d);
 }
 if(!matches.length)dest.append(node("p","Aucune fiche ne réunit actuellement deux des signes retenus."));
 const near=rules.map(r=>({r,count:r.terms.filter(s=>signs.has(s)).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
 const more=new Set(near.flatMap(x=>x.r.terms.filter(s=>!signs.has(s))));
 if(more.size){dest.append(node("h3","Autres signes présents ?"),node("p","Sélectionnez uniquement ce que le sujet ressent."),...[...more].slice(0,10).map(signButton));}
 if([...signs].some(s=>/des pieds$/.test(s))&&!diabete)dest.append(node("p","Un diabète a-t-il déjà été diagnostiqué ? Ce renseignement se saisit dans le profil."));
}
$("region").onchange=()=>{$("search").value="";listSigns();};$("search").oninput=listSigns;
$("profile").onchange=render;
$("add").onclick=()=>{const text=$("other").value.trim();if(text){signs.add(catalogue.has(text)?text:$("region").value+" · "+text);$("other").value="";render();}};
historyList();render();
fetch("./research-data/maladies.json").then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{register=data;render();}).catch(()=>{failed=true;render();});

// Références de lecture. La recherche reste locale, y compris dans la vue Symptômes.
import {plier} from "./maladies.mjs";

const CIM="https://icd.who.int/browse/2026-01/mms/fr";
const MSD="https://www.msdmanuals.com/fr/professional/";
const OMS="https://www.who.int/fr/news-room/fact-sheets";
const archives=new Map();
function charger(file){
 if(!archives.has(file)){
  const request=fetch("./research-data/"+file).then(async response=>{
   if(!response.ok)throw Error("Source indisponible");
   if(!file.endsWith(".gz"))return response.json();
   const bytes=await response.blob();
   const signature=new Uint8Array(await bytes.slice(0,2).arrayBuffer());
   if(signature[0]!==31||signature[1]!==139)return JSON.parse(await bytes.text());
   return new Response(bytes.stream().pipeThrough(new DecompressionStream("gzip"))).json();
  }).catch(error=>{archives.delete(file);throw error;});
  archives.set(file,request);
 }
 return archives.get(file);
}
function element(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
function lien(label,url){
 const a=element("a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function liste(parent,title,links){
 const group=element("div","");group.append(element("strong",title));
 const ul=element("ul","");
 for(const a of links){const li=element("li","");li.append(a);ul.append(li);}
 group.append(ul);parent.append(group);
}
export function lecturesMaladie(id){
 const details=element("details","");details.className="prmr-refs";
 details.append(element("summary","Fiches OMS et Manuel MSD"));
 const body=element("div","");details.append(body);
 details.addEventListener("toggle",async()=>{
  if(!details.open||body.dataset.ready)return;
  body.textContent="Chargement des références…";
  try{
   const entry=(await charger("references-maladies.json"))[id];
   body.replaceChildren();
   if(!entry){body.append(element("p","Références individuelles à documenter."));return;}
   if(entry.oms)liste(body,"OMS · repères de santé publique",[lien(entry.oms[0],OMS+"/detail/"+entry.oms[1])]);
   else body.append(element("p","Aucune fiche de santé publique de l’OMS reliée à cette entrée."));
   liste(body,"OMS · rubriques de la CIM-11 (2026-01)",entry.cim.map(([code,title,fragment])=>lien([code,title].filter(Boolean).join(" · "),CIM+"#"+fragment)));
   liste(body,"Manuel MSD · édition professionnelle",entry.msd.map(([title,path])=>lien(title,MSD+path)));
   body.append(element("small","Les titres indiquent le périmètre de chaque source. Une rubrique peut couvrir un groupe de maladies ou un sous-type."));
   body.dataset.ready="1";
  }catch{body.textContent="Références indisponibles. Fermez puis rouvrez cette rubrique pour réessayer.";}
 });
 return details;
}

const normaliser=s=>plier(s).replaceAll("œ","oe").replace(/[^a-z0-9]+/g," ").trim();
const sources=[
 {title:"OMS · fiches de santé publique",file:"oms-reperes-fr.json",home:OMS,parse:([title,slug])=>({title,url:OMS+"/detail/"+slug})},
 {title:"OMS · CIM-11",file:"cim11-fr-2026-01.json.gz",home:CIM,parse:([code,title,uri,fragment])=>({title,code,uri:"http://id.who.int/icd/release/11/mms/"+uri,url:CIM+"#"+fragment})},
 {title:"Manuel MSD · sujets professionnels",file:"msd-sujets-fr.json",home:MSD,parse:path=>{const last=path.split("/").pop().replaceAll("-"," ");return {title:last.charAt(0).toUpperCase()+last.slice(1),url:MSD+path};}}
];
export function monterRecherche(input,container){
 let generation=0,timer;
 const catalogues=new Map();
 async function section(source,query,token,box){
  try{
   if(!catalogues.has(source.file)){
    const rows=await charger(source.file);
    catalogues.set(source.file,rows.map(raw=>{const item=source.parse(raw);return {...item,key:normaliser(item.title),codeKey:normaliser(item.code||"")};}));
   }
   if(token!==generation)return;
   const words=query.split(" ");
   const found=catalogues.get(source.file).filter(item=>words.every(w=>item.key.includes(w)||item.codeKey.includes(w)));
   const rank=i=>i.codeKey===query||i.key===query?0:i.key.startsWith(query)?1:2;
   found.sort((a,b)=>rank(a)-rank(b)||a.title.length-b.title.length||a.title.localeCompare(b.title,"fr"));
   box.replaceChildren(element("strong",source.title+" · "+found.length));
   if(!found.length){box.append(element("p","Aucun résultat dans cet index."));return;}
   const list=element("ul","");box.append(list);
   const more=element("button","Voir davantage");more.type="button";
   let count=0;
   function show(){
    for(const item of found.slice(count,count+8)){
     const li=element("li","");li.append(lien([item.code,item.title].filter(Boolean).join(" · "),item.url));list.append(li);
    }
    count+=8;more.hidden=count>=found.length;
   }
   more.onclick=show;box.append(more);show();
  }catch{if(token===generation){box.replaceChildren(element("p","Index indisponible."),lien("Ouvrir "+source.title,source.home));}}
 }
 const results=container.querySelector("[data-ref-resultats]");
 function chercher(){
  clearTimeout(timer);const token=++generation;
  const query=normaliser(input.value);results.replaceChildren();
  if(query.length<2||!container.open)return;
  timer=setTimeout(()=>{
   for(const source of sources){
    const box=element("section","Recherche dans "+source.title+"…");results.append(box);section(source,query,token,box);
   }
  },150);
 }
 container.addEventListener("toggle",chercher);input.addEventListener("input",()=>{
  if(normaliser(input.value).length>=2)container.open=true;chercher();
 });
}

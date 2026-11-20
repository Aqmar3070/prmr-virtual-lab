// The example substances have deliberately synthetic effects. Published warnings
// are evaluated separately and never share the example response function.
const $=id=>document.getElementById(id);
const node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const svg=(tag,attributes,text)=>{
 const el=document.createElementNS("http://www.w3.org/2000/svg",tag);
 for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));
 if(text!==undefined)el.textContent=text;
 return el;
};
const families=["Médicaments","Molécules","Substances naturelles","Aliments"];
const demo=[
 {id:"A",name:"Médicament A",family:0,unit:"unité fictive",zone:"liver",sign:-1},
 {id:"D",name:"Molécule D",family:1,unit:"unité fictive",zone:"foot_l",sign:-1},
 {id:"B",name:"Extrait B",family:2,unit:"portion fictive",zone:"calf_l",sign:-1},
 {id:"C",name:"Aliment C",family:3,unit:"portion fictive",zone:"small_intestine",sign:1}
];
const published=[
 {id:"ibuprofene",name:"Ibuprofène oral",family:0,unit:"mg"},
 {id:"paracetamol",name:"Paracétamol",family:0,unit:"mg"},
 {id:"metformine",name:"Metformine",family:0,unit:"mg"},
 {id:"cafeine",name:"Caféine",family:1,unit:"mg"},
 {id:"the",name:"Thé noir",family:2,unit:"tasse"},
 {id:"cafe",name:"Café filtre",family:3,unit:"tasse"},
 {id:"chocolat",name:"Chocolat noir",family:3,unit:"portion"}
];
const names={liver:"Foie",small_intestine:"Intestin",calf_l:"Mollet gauche",foot_l:"Pied gauche",heart:"Système cardiovasculaire"};
const anchors={"male": {"foot_l": [370.2, 945.2], "calf_l": [366.0, 820.6], "heart": [322.3, 241.4], "liver": [304.6, 309.1], "small_intestine": [315.9, 400.8]}, "female": {"foot_l": [391.6, 942.4], "calf_l": [384.3, 805.6], "heart": [323.1, 254.9], "liver": [303.8, 306.8], "small_intestine": [313.5, 381.1]}};
const entry=(id,qty=1)=>({id,qty,after:qty/2,start:0,reduce:14,end:28});
const plans={demo:["A","B","C"].map(id=>entry(id)),published:[]};
let mode="demo",sex="male",family=0,selected="liver",editing=null,compare=true,timer;
const catalog=()=>mode==="demo"?demo:published;
const lookup=id=>catalog().find(s=>s.id===id);
const day=()=>Number($("xp-day").value);
const duration=()=>Number($("xp-day").max);
function doseAt(item,t,reduced=true){
 if(t<item.start||t>=item.end)return 0;
 return reduced&&t>=item.reduce?item.after:item.qty;
}
function response(item,t,reduced=true){
 // Arbitrary exponential transitions in display units. After a stop the example
 // decays continuously; a published threshold uses only the active day's intake.
 const rise=n=>n<=0?0:1-Math.exp(-n/5);
 const change=reduced?item.after-item.qty:0;
 return Math.max(0,item.qty*rise(t-item.start)+change*rise(t-item.reduce)-(item.qty+change)*rise(t-item.end));
}
const ema="https://www.ema.europa.eu/en/documents/press-release/updated-advice-use-high-dose-ibuprofen_en.pdf";
function signals(t){
 const found=[];
 if(mode==="demo"){
  for(const s of demo){
   const items=plans.demo.filter(row=>row.id===s.id);
   const value=items.reduce((sum,row)=>sum+response(row,t),0);
   if(value<.025)continue;
   const intake=items.reduce((total,row)=>total+doseAt(row,t),0);
   const history=items.map(row=>"J"+row.start+" : "+row.qty+" "+s.unit+"/j, J"+row.reduce+" : "+row.after+", arrêt à J"+row.end).join(" · ");
   found.push({zone:s.zone,value,sign:s.sign,title:s.name,reason:"La règle fictive de "+s.name+" attribue à cette zone un signal "+(s.sign<0?"défavorable":"favorable")+". Prise à J"+t+" : "+Number(intake.toFixed(2))+" "+s.unit+"/j. Historique : "+history+". Le signal fictif monte progressivement pendant la prise et décroît après réduction ou arrêt.",source:"Exemple pédagogique PRMR · loi de réponse arbitraire."});
  }
 }else{
  const amount=plans.published.filter(r=>r.id==="ibuprofene").reduce((sum,r)=>sum+doseAt(r,t),0);
  if(amount>=2400&&Number($("xp-age").value)>=18)found.push({zone:"heart",value:1,sign:-1,title:"Ibuprofène oral",reason:"À J"+t+", les prises saisies totalisent "+amount+" mg/j. À partir de 2 400 mg/j, l’EMA rapporte une légère augmentation du risque cardiovasculaire à l’échelle des populations. Le repère indique une exposition à surveiller et ne localise aucune lésion.",source:"EMA · évaluation européenne de 2015",url:ema});
 }
 return found;
}
function stop(){clearInterval(timer);timer=null;$("xp-play").textContent="▶";$("xp-play").ariaLabel="Lire la chronologie";}
function setDay(t){$("xp-day").value=t;render();}
function renderChart(active){
 const plot=$("xp-plot");plot.replaceChildren();
 const days=duration(),current=day(),isDemo=mode==="demo";
 const chartItem=catalog().find(s=>s.zone===active?.zone)||catalog().find(s=>plans[mode].some(r=>r.id===s.id));
 const items=plans[mode].filter(r=>r.id===(isDemo?chartItem?.id:"ibuprofene"));
 const at=(t,reduced)=>items.reduce((sum,r)=>sum+(isDemo?response(r,t,reduced):doseAt(r,t,reduced)),0);
 $("xp-chart-title").textContent=isDemo?(chartItem?.name||"Aucune prise")+" · intensité illustrative (u.a.)":"Ibuprofène oral · exposition saisie (mg/j)";
 const top=Math.max(1,...Array.from({length:days+1},(_,t)=>Math.max(at(t,true),compare?at(t,false):0)));
 const x=t=>38+360*t/days,y=v=>163-v/top*130;
 for(let i=0;i<=4;i++){
  const v=top*i/4,dt=Math.round(days*i/4);
  plot.append(svg("path",{d:"M38 "+y(v)+"H398",stroke:"#25465b"}),svg("text",{x:33,y:y(v)+3,"text-anchor":"end",fill:"#b4d4df","font-size":10},Number(v.toFixed(2)).toLocaleString("fr-FR")),svg("text",{x:x(dt),y:181,fill:"#bad9e4","font-size":11,"text-anchor":"middle"},"J"+dt));
 }
 for(const reduced of (compare?[false,true]:[true])){
  let path="";for(let t=0;t<=days;t++){if(t>0&&!isDemo)path+=" H"+x(t);path+=(t?" L":"M")+x(t)+" "+y(at(t,reduced));}
  plot.append(svg("path",{d:path,fill:"none",stroke:reduced?"#45e1e5":"#ffab55","stroke-width":reduced?2.3:4}));
 }
 plot.append(svg("path",{d:"M"+x(current)+" 16V163",stroke:"#68c7d7","stroke-dasharray":"3 4"}),svg("circle",{cx:x(current),cy:y(at(current,true)),r:4,fill:"#9dffff"}));
 $("xp-legend").firstChild.textContent=compare?"━ Prise maintenue ":"";
}
function render(){
 const t=day(),all=signals(t);
 const active=all.find(s=>s.zone===selected)||all[0];selected=active?.zone;
 $("xp-day-tag").value=$("xp-time-label").value="J"+t;
 $("xp-body-image").setAttribute("href","./assets/exposure/"+sex+".webp");
 const marks=$("xp-marks"),cards=$("xp-signals"),why=$("xp-reason");marks.replaceChildren();cards.replaceChildren();why.replaceChildren();
 for(const signal of all){
  const [cx,cy]=anchors[sex][signal.zone],left=["liver","small_intestine"].includes(signal.zone),ex=left?65:535;
  const adverse=signal.sign<0,shade=adverse?(mode==="demo"&&signal.value>1.25?"high":"bad"):"good";
  const group=svg("g",{});group.append(svg("ellipse",{cx,cy,rx:signal.zone==="small_intestine"?55:32,ry:signal.zone==="calf_l"?48:31,fill:"url(#xp-"+shade+")"}),svg("path",{class:"xp-leader",d:"M"+cx+" "+cy+" L"+(left?ex+78:ex-78)+" "+(cy-25)+" H"+ex}),svg("text",{x:ex,y:cy-30,"text-anchor":left?"start":"end"},names[signal.zone]));marks.append(group);
  const b=node("button","");b.type="button";b.setAttribute("aria-pressed",String(signal===active));b.append(node("b",names[signal.zone]),Object.assign(node("span",adverse?"− Défavorable":"+ Favorable"),{className:adverse?"minus":"plus"}));
  const select=()=>{selected=signal.zone;render()};b.onclick=select;group.onclick=select;cards.append(b);
 }
 if(active){
  why.append(node("h4",(active.sign<0?"Pourquoi ce signal est défavorable":"Pourquoi ce signal est favorable")+" · "+names[active.zone]),node("p",active.reason));
  if(active.url){const source=node("a",active.source);source.href=active.url;why.append(source)}else why.append(node("small",active.source));
 }else cards.append(node("p",mode==="demo"?"Aucun effet illustratif à ce jour du scénario.":"Aucun signal documenté applicable dans les règles intégrées. Les interactions et les effets non couverts restent indéterminés."));
 if(mode==="published")why.append(node("p","Couverture de la carte : alerte cardiovasculaire de l’ibuprofène oral chez l’adulte. Les autres repères se consultent dans le registre."));
 renderChart(active);
}
function renderList(){
 const list=$("xp-list");list.replaceChildren();
 for(const [i,row] of plans[mode].entries()){
  const s=lookup(row.id),box=node("div","");box.className="xp-row";
  const label=node("div",s.name);label.append(node("small",row.qty+" "+s.unit+"/j · J"+row.start+" à J"+row.end));
  const edit=node("button","✎"),del=node("button","×");edit.ariaLabel="Modifier "+s.name;del.ariaLabel="Retirer "+s.name;
  edit.onclick=()=>openEditor(i);del.onclick=()=>{plans[mode].splice(i,1);closeEditor();renderList();render();};box.append(label,edit,del);list.append(box);
 }
 if(!plans[mode].length)list.append(node("p","Aucune prise dans ce scénario."));
}
function categories(){
 const host=$("xp-categories");host.replaceChildren();
 families.forEach((f,i)=>{const b=node("button","");b.append(node("b",["▱","⬡","♧","♨"][i]),node("span",f));b.setAttribute("aria-pressed",String(i===family));b.onclick=()=>{family=i;categories();openEditor(null)};host.append(b)});
}
function closeEditor(){$("xp-editor").hidden=true;editing=null;$("xp-error").textContent="";}
function unit(){const s=lookup($("xp-substance").value);$("xp-unit").textContent="("+s.unit+"/j)";}
function openEditor(i){
 editing=i;const row=i===null?null:plans[mode][i];if(row)family=lookup(row.id).family;
 categories();const options=catalog().filter(x=>x.family===family);$("xp-substance").replaceChildren(...options.map(s=>new Option(s.name,s.id)));
 const val=row||entry(options[0].id,mode==="demo"?1:0);
 if(!row){val.reduce=Math.floor(duration()/2);val.end=duration();}
 $("xp-substance").value=val.id;unit();
 for(const k of ["start","reduce","after","end"])$("xp-"+k).value=(!row&&k==="after"&&mode==="published")?"":val[k];
 $("xp-dose").value=val.qty||"";$("xp-error").textContent="";$("xp-editor").hidden=false;$("xp-substance").focus();
}
$("xp-editor").onsubmit=e=>{
 e.preventDefault();
 const value=id=>Number($("xp-"+id).value);
 const row={id:$("xp-substance").value,qty:value("dose"),after:value("after"),start:value("start"),reduce:value("reduce"),end:value("end")};
 if(row.start>row.reduce||row.reduce>row.end||row.end<=row.start||row.after>row.qty){$("xp-error").textContent="La réduction doit se situer entre le début et l’arrêt. La quantité réduite doit être inférieure ou égale à la quantité initiale.";return;}
 if(editing===null)plans[mode].push(row);else plans[mode][editing]=row;
 closeEditor();renderList();render();
};
$("xp-substance").onchange=unit;$("xp-add").onclick=()=>openEditor(null);$("xp-cancel").onclick=closeEditor;
$("xp-day").oninput=render;$("xp-duration").onchange=()=>{const el=$("xp-duration");if(!el.value||!el.checkValidity()){el.value=duration();return;}$("xp-day").max=el.value;render();};
$("xp-play").onclick=()=>{if(timer){stop();return;}if(day()===duration())setDay(0);$("xp-play").textContent="Ⅱ";$("xp-play").ariaLabel="Suspendre la chronologie";timer=setInterval(()=>{setDay(day()+1);if(day()>=duration())stop();},400);};
$("xp-compare").onclick=()=>{compare=!compare;$("xp-compare").setAttribute("aria-pressed",String(compare));render();};
$("xp-mode").onchange=()=>{stop();closeEditor();mode=$("xp-mode").value;family=0;categories();renderList();render();};
for(const b of $("sex-choice").querySelectorAll("button"))b.onclick=()=>{sex=b.dataset.sex;for(const other of b.parentNode.children)other.setAttribute("aria-pressed",String(other===b));render();};
$("xp-age").oninput=render;
document.querySelector(".xp-head a:last-child").onclick=()=>{$("registre").open=true;};
const route=document.querySelector(".prmr-routebar");if(route)document.body.append(route);
categories();renderList();render();

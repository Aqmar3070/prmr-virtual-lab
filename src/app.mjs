import {DEFAULT_PARAMS, PARAMS, evaluate, scenarioEnvelope} from "./model.mjs";
let p={...DEFAULT_PARAMS};
const $=id=>document.getElementById(id);
const format=(x,n=2)=>Number(x).toLocaleString("fr-FR",{maximumFractionDigits:n,minimumFractionDigits:n});
function initControls(){
  $("controls").replaceChildren();
  for(const [key,spec] of Object.entries(PARAMS)){
    const wrap=document.createElement("div");wrap.className="control";
    const line=document.createElement("div");line.className="line";
    const label=document.createElement("label");label.textContent=spec.label;
    const output=document.createElement("output");
    const input=document.createElement("input");input.type="range";input.id="param-"+key;
    input.min=spec.min;input.max=spec.max;input.step=spec.step;input.value=p[key];
    label.htmlFor=input.id;line.append(label,output);wrap.append(line,input);$("controls").append(wrap);
    const display=()=>{output.textContent=format(p[key],key==="inhibition"||key==="F"||key==="renal"?2: key==="dose"||key==="V"?0:2)+" "+(spec.unit==="fraction"||spec.unit==="sans unité"?"":spec.unit)};
    input.addEventListener("input",()=>{p[key]=Number(input.value);display();render()});display();
  }
}
function metric(title,value,unit){
 const d=document.createElement("div");d.className="metric"; const l=document.createElement("label"),s=document.createElement("strong"),u=document.createElement("span");
 l.textContent=title;s.textContent=value;u.textContent=unit;d.append(l,s,u);return d;
}
function chart(profile,horizon){
 const W=760,H=270,L=58,R=20,T=18,B=36, max=Math.max(...profile.map(q=>q.c),0.01)*1.12;
 const X=t=>L+t/horizon*(W-L-R),Y=v=>T+(1-v/max)*(H-T-B);
 const pts=profile.map(q=>[X(q.t),Y(q.c)]);
 const coords=pts.map((z,i)=>(i?"L":"M")+z[0].toFixed(2)+" "+z[1].toFixed(2)).join(" ");
 const area=coords+" L "+X(horizon)+" "+Y(0)+" L "+X(0)+" "+Y(0)+" Z";
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("preserveAspectRatio","none");
 const el=(tag,attrs,text)=>{const e=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.append(e);return e};
 for(let i=0;i<=4;i++){
  const y=T+i*(H-T-B)/4;el("line",{x1:L,x2:W-R,y1:y,y2:y});
  el("text",{x:L-9,y:y+4,"text-anchor":"end"},format(max*(1-i/4),2));
 }
 for(let i=0;i<=6;i++){
  const x=L+i*(W-L-R)/6;el("text",{x:x,y:H-11,"text-anchor":"middle"},format(horizon*i/6,0));
 }
 el("path",{d:area,class:"area"});el("path",{d:coords,class:"curve"});
 $("chart").replaceChildren(svg);$("horizon").textContent=`0–${format(horizon,0)} heures`;
}
function render(){
 try{
 const m=evaluate(p),s=scenarioEnvelope(p);
 $("metrics").replaceChildren(
  metric("Cmax",format(m.Cmax,3),"mg/L"),
  metric("Tmax",format(m.Tmax),"heures"),
  metric("AUC₀–∞",format(m.AUC),"mg·h/L"),
  metric("Demi-vie",format(m.halfLife),"heures"),
  metric("Clairance totale",format(m.CL),"L/h"),
  metric("Constante kₑ",format(m.ke,4),"h⁻¹"),
  metric("Clairance rénale effective",format(m.CLrEff),"L/h"),
  metric("Indice d’effet Emax",format(m.effect,1)+" %","théorique")
 );
 chart(m.profile,m.horizon);
 $("uncertainty").replaceChildren();
 for(const [k,label,unit] of [["Cmax","Cmax","mg/L"],["AUC","AUC₀–∞","mg·h/L"]]){
  const div=document.createElement("div");div.className="range";
  const t=document.createElement("span");t.textContent=label;
  const v=document.createElement("b");v.textContent=`${format(s[k][0],2)} – ${format(s[k][1],2)} ${unit}`;
  div.append(t,v);$("uncertainty").append(div);
 }
 }catch(err){$("metrics").textContent="Erreur de simulation : "+err.message;$("chart").replaceChildren()}
}
$("reset").addEventListener("click",()=>{p={...DEFAULT_PARAMS};initControls();render()});
$("download").addEventListener("click",()=>{
 const data={project:"PRMR Virtual Lab",version:"1.1",generatedAt:new Date().toISOString(),disclaimer:"Modèle hypothétique non calibré, non clinique",units:{dose:"mg",V:"L",CL:"L/h",C:"mg/L",time:"h",AUC:"mg.h/L"},provenance:"Tous les paramètres d'entrée sont des hypothèses illustratives",parameters:p,prediction:evaluate(p),scenarios:scenarioEnvelope(p)};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="prmr-simulation-1.1.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
initControls();render();

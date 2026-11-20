// Published population findings are separate from amounts entered or calculated.
export function doseAt(r,t,reduced=true){
 if(t<r.start||t>=r.end)return 0;
 return reduced&&t>=r.reduce?r.after:r.qty;
}
export const fold=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function evaluateDay(rows,t,age,lookup){
 const totals={sugarG:0,ethanolG:0,ethanolMl:0,caffeineMg:0};
 const available=new Set(),classes=new Set();let ibuprofen=0,bedtime=0,habitual=false;
 function add(k,v){if(Number.isFinite(v)){totals[k]+=v;available.add(k);}}
 for(const r of rows){
  const q=doseAt(r,t),s=lookup(r.id);if(!q||!s)continue;
  let caffeine=null,alcohol=false;
  if(s.unit==="mL"){
   if(r.abv!=null){add("ethanolMl",q*r.abv/100);alcohol=r.abv>0;}
   if(r.sug!=null)add("sugarG",q*r.sug/100);
   if(r.caf!=null)caffeine=q*r.caf/100;
  }
  if(s.nutrients&&s.unit==="g"){
   const [sugar,ethanol]=s.nutrients;if(sugar!=null)add("sugarG",q*sugar/100);
   if(ethanol!=null){add("ethanolG",q*ethanol/100);alcohol=ethanol>0;}
  }
  if(r.id==="cafeine"||s.id.startsWith("sa")&&fold(s.name)==="cafeine")caffeine=q;
  if(caffeine!=null){add("caffeineMg",caffeine);if(r.bed)bedtime+=caffeine;}
  habitual||=Boolean(alcohol&&r.long);
  if(r.id==="ibuprofene"){ibuprofen+=q;classes.add("ains");}
  if(s.ibuMg)ibuprofen+=q*s.ibuMg;
  if(s.id.startsWith("cis")&&s.source.split(" · ")[0].split(";").map(v=>fold(v.trim())).includes("orale")){
   for(const id of s.active||[]){
    const n=fold(lookup("sa"+id)?.name||"");
    if(/\b(ibuprofene|naproxene|diclofenac|ketoprofene|piroxicam|celecoxib)\b/.test(n))classes.add("ains");
    if(/\b(ramipril|enalapril|lisinopril|perindopril|losartan|valsartan|irbesartan|candesartan)\b/.test(n))classes.add("raas");
    if(/\b(hydrochlorothiazide|furosemide|indapamide|chlortalidone|bumetanide)\b/.test(n))classes.add("diur");
   }
  }
 }
 const out=[];
 function signal(zone,title,reason,source,url){out.push({zone,title,reason,source,url,sign:-1});}
 if(Number.isFinite(age)&&age>=18&&age<=110){
  if(ibuprofen>=2400)signal("heart","Ibuprofène oral","Les prises orales quantifiables totalisent "+ibuprofen+" mg ce jour. À partir de 2 400 mg/j, l’évaluation européenne rapporte une légère hausse du risque cardiovasculaire dans les populations étudiées.","EMA · revue européenne, 2015","https://www.ema.europa.eu/en/documents/press-release/updated-advice-use-high-dose-ibuprofen_en.pdf");
  if(bedtime>=100)signal("brain","Caféine et sommeil","Prise groupée près du coucher déclarée : "+Number(bedtime.toFixed(1))+" mg de caféine quantifiable. Selon l’EFSA, une prise de 100 mg peut modifier le sommeil de certains adultes. Le repère concerne le sommeil, pas une lésion cérébrale.","EFSA · avis sur la caféine","https://www.efsa.europa.eu/en/topics/topic/caffeine");
  if(classes.has("ains")&&classes.has("raas")&&classes.has("diur"))signal("kidney_l","Association de trois classes","Un AINS oral, un diurétique et un IEC ou un sartan figurent ensemble ce jour. Une étude observationnelle a relevé davantage d’insuffisances rénales aiguës avec cette association. Rapport de taux 1,31 (IC 95 % 1,12–1,53), résultat de groupe et non probabilité individuelle.","Lapi et coll. · BMJ 2013, étude cas-témoins nichée","https://pubmed.ncbi.nlm.nih.gov/23299844/");
  if(habitual)signal("liver","Alcool et risque à long terme","La prise contient de l’alcool et vous avez indiqué une consommation habituelle de longue durée. La consommation d’alcool est un facteur causal de cancer du foie au niveau populationnel. La chronologie ne permet pas de dater une lésion ou de calculer votre risque personnel.","National Cancer Institute · Alcohol and Cancer Risk","https://www.cancer.gov/about-cancer/causes-prevention/risk/alcohol/alcohol-fact-sheet");
 }
 return {signals:out,totals,available};
}

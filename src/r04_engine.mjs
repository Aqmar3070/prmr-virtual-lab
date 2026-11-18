// PRMR-R04 · Cross-species scenario explorer, not validated animal PBPK or toxicity prediction.
import {stress,ANCHORS,REGIMENS} from "./r03_model.mjs";
export const VERSION_R04="r04-v1.0";
export const SPECIES_R04=[
// Seules les espèces dont l'anatomie 3D provient de modèles réellement
// acquis sont conservées. Les cinq autres n'avaient que des maillages
// construits, faute d'imagerie sous licence utilisable.
{id:"dog",label:"Chien",latin:"Canis lupus familiaris",breed:"Beagle",ref_kg:10,min_kg:4,max_kg:30,anatomy:"Rein principalement unipapillaire",focus:"Toxicologie non-rongeur, uniquement si modèle justifié",ic50:null,source:"https://pubmed.ncbi.nlm.nih.gov/32758521/"},
{id:"cat",label:"Chat",latin:"Felis catus",breed:"Européen",ref_kg:4,min_kg:2.5,max_kg:8,anatomy:"Rein unipapillaire ; maladie rénale chronique spontanée fréquente",focus:"Modèle spontané de maladie rénale chronique, non un modèle induit",ic50:null,source:"https://pubmed.ncbi.nlm.nih.gov/27197015/"}
];
export const OPTIONS={
age:{juvenile:"Jeune",adult:"Adulte",old:"Âgé"},
sex:{unknown:"Indéterminé",male:"Mâle",female:"Femelle"},
constitution:{lean:"Maigre",normal:"Normale",adipose:"Adiposité accrue"},
renal:{normal:"Conservée",mild:"Altération légère",moderate:"Altération modérée",severe:"Altération sévère"},
hepatic:{normal:"Conservée",moderate:"Altération modérée",severe:"Altération sévère"},
hydration:{normal:"Hydratation conservée",depleted:"Déshydraté / hypovolémique"},
disease:{diabetic:"Néphropathie diabétique",hypertensive:"Atteinte hypertensive",fibrotic:"Fibrose rénale",alport:"Néphropathie d'Alport",ischemic:"Lésion ischémique"}
};
export const DISEASE_INFO={
diabetic:{target:"Transport tubulaire, glomérule, inflammation",markers:"Albuminurie, DFG, glycémie, histologie"},
hypertensive:{target:"Angiotensine, perfusion rénale, pression",markers:"Pression artérielle, débit rénal, DFG, fibrose"},
fibrotic:{target:"Matrice extracellulaire, collagène, inflammation",markers:"COL1A1, FN1, ACTA2, collagène, DFG"},
alport:{target:"Membrane basale glomérulaire, collagène IV",markers:"Albuminurie, DFG, histologie, survie"},
ischemic:{target:"Perfusion, inflammation, réparation tubulaire",markers:"KIM-1, NGAL, DFG, lésions histologiques"}
};
export const DEFAULT_R04={species:"dog",mass_kg:10,age:"adult",sex:"unknown",constitution:"normal",renal:"moderate",hepatic:"normal",hydration:"normal",disease:"fibrotic",regimen:"R02-A",free_nM:3};
export const MOLECULES_R04=[
{id:"irbesartan",name:"Irbesartan",cid:3749,axis:"SRAA / récepteur AT1",colour:"#53e4d1"},
{id:"dapagliflozine",name:"Dapagliflozine",cid:9887712,axis:"SGLT2 / tubule rénal",colour:"#66b6ff"},
{id:"pirfenidone",name:"Pirfénidone",cid:40632,axis:"Hypothèse antifibrosante",colour:"#bda0ff"},
{id:"pentoxifylline",name:"Pentoxifylline",cid:4740,axis:"Hypothèse anti-inflammatoire",colour:"#ffc17e"}
];
const round=(n,p=3)=>Number(n.toFixed(p));
export function validateR04(v){
 const species=SPECIES_R04.find(s=>s.id===v.species);
 if(!species)throw Error("Espèce inconnue");
 for(const k of ["age","sex","constitution","renal","hepatic","hydration","disease"]){
  if(!Object.hasOwn(OPTIONS[k],v[k]))throw Error("Paramètre inconnu: "+k);
 }
 if(!REGIMENS.some(g=>g.id===v.regimen))throw Error("Combinaison inconnue");
 if(!(Number(v.mass_kg)>=species.min_kg&&Number(v.mass_kg)<=species.max_kg))throw Error("Poids hors intervalle exploratoire");
 if(!(Number(v.free_nM)>=0&&Number(v.free_nM)<=100))throw Error("Concentration illustratrice invalide");
 return species;
}
export function computeR04(v){
 const species=validateR04(v),mass=Number(v.mass_kg),mass_factor=round((mass/species.ref_kg)**.25,4);
 const observations=[];
 if(v.age!=="adult")observations.push({name:"Âge: "+OPTIONS.age[v.age],detail:"La maturation ou le vieillissement peuvent modifier clairance, réserve rénale et fragilité; aucune variation chiffrée validée sans mesure."});
 if(v.sex!=="unknown")observations.push({name:"Sexe: "+OPTIONS.sex[v.sex],detail:"Différences hormonales et métaboliques possibles; effet sur les trois associations non quantifié dans cette espèce."});
 if(v.constitution!=="normal")observations.push({name:"Constitution: "+OPTIONS.constitution[v.constitution],detail:"Volume de distribution et protéines plasmatiques à contrôler; pas de coefficient inventé."});
 if(v.hydration==="depleted")observations.push({name:"Déplétion",detail:"Surveiller hypotension, perfusion, électrolytes sous bloqueur SRAA et inhibiteur SGLT2."});
 if(v.renal!=="normal")observations.push({name:"Rein: "+OPTIONS.renal[v.renal],detail:"Les ratios AUC de référence sont HUMAINS; leur transfert à cette espèce n'est pas validé."});
 if(v.hepatic!=="normal")observations.push({name:"Foie: "+OPTIONS.hepatic[v.hepatic],detail:v.hepatic==="severe"?"Absence de résultat chiffrable: atteinte sévère hors données.":"Ancre AUC humaine, non calibrée chez l'animal."});
 const arr=REGIMENS.map(g=>{
  const rena=ANCHORS[g.renal][Object.keys(OPTIONS.renal).indexOf(v.renal)];
  const hepa=g.hepatic?ANCHORS[g.hepatic][v.hepatic]:null;
  const key=species.id+"_"+mass+"_"+v.renal+"_"+v.hepatic+"_"+g.id;
  return {id:g.id,agents:g.agents,renal:stress(rena,mass*1000,species.ref_kg*1000,key+"_r"),
    hepatic:g.hepatic?stress(hepa,mass*1000,species.ref_kg*1000,key+"_h"):null,
    human_renal_anchor:rena,human_hepatic_anchor:hepa,
    toxicity_probability:null,benefit_probability:null,cure_probability:null,
    pk_calibrated_for_animal:false,measured_in_PRMR_animals:false};
 });
 const active=arr.find(g=>g.id===v.regimen);
 const occupancy=species.ic50===null?null:round(Number(v.free_nM)/(Number(v.free_nM)+species.ic50),4);
 const warnings=[
 "Les variations de rapports AUC sont des scénarios hypothétiques et non des résultats PK chez "+species.label+".",
 "Les variations d'âge, sexe ou constitution changent l'analyse qualitative, pas l'AUC : aucun paramètre expérimental propre à l'espèce n'est disponible.",
 ...(v.renal==="severe"?["Affection rénale sévère : vigilance pour accumulation métabolique et hémodynamique."]:[]),
 ...(v.hepatic==="severe"?["Foie sévèrement altéré : résultat hépatique indisponible, ne pas extrapoler."]:[]),
 ...(v.hydration==="depleted"?["Hypovolémie : alerte qualitative liée au doublet SRAA + SGLT2."]:[]),
 ...(v.species==="cat"?["Chat : la maladie rénale chronique y est spontanée et fréquente ; ce n'est pas un modèle induit, et la transposition demande prudence."]:[])
 ];
 return {version:VERSION_R04,inputs:{...v,mass_kg:mass},species,indication:DISEASE_INFO[v.disease],
  regimens:arr,active,mass_factor,sglt2_occupancy:occupancy,observations,warnings,
  risk_benefit:"Indéterminé: aucune mesure de toxicité ni bénéfice supplémentaire des triples.",
  probability_toxicity:null,probability_benefit:null,probability_cure:null,experimental_results:false};
}

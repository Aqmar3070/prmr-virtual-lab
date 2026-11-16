// PRMR-R03: susceptibility/relative-exposure STRESS TEST, not a validated animal PBPK model.
// Inputs: HUMAN clinical exposure ratios transferred to rodent analogues ONLY via explicit assumptions.
// The output gives NO animal injury probability and NO treatment/curative probability.
export const VERSION="r03-conditional-exposure-v1.0";
export const SPECIES=[
 {id:"mouse",label:"Souris C57BL/6 (analogue)",ref_mass_g:25,masses_g:[18,25,35],sglt2_ic50_nM:2.3,sglt1_ic50_nM:299},
 {id:"rat",label:"Rat Sprague–Dawley (analogue)",ref_mass_g:250,masses_g:[180,250,400],sglt2_ic50_nM:3.0,sglt1_ic50_nM:620}
];
export const RENAL=["normal","mild","moderate","severe"];
export const HEPATIC=["normal","moderate","severe"];
export const HYDRATION=["normal","depleted"];
export const N=1000;
export const ANCHORS={
 dapagliflozin_parent_renal:[1,1.32,1.60,1.87],
 pirfenidone_5carboxy_renal:[1,49.3/28.7,100/28.7,168/28.7],
 pentoxifylline_metabolite_V_renal:[1,2.4,2.4,12.9],
 pirfenidone_parent_hepatic:{normal:1,moderate:1.6,severe:null},
 pentoxifylline_parent_hepatic:{normal:1,moderate:6.5,severe:null}
};
export const REGIMENS=[
 {id:"R02-DUO",agents:["Irbesartan","Dapagliflozine"],renal:"dapagliflozin_parent_renal",hepatic:null,goal:"Comparateur pharmacologique, sans troisième agent"},
 {id:"R02-A",agents:["Irbesartan","Dapagliflozine","Pirfénidone"],renal:"pirfenidone_5carboxy_renal",hepatic:"pirfenidone_parent_hepatic",goal:"Hypothèse antifibrosante, non démontrée"},
 {id:"R02-B",agents:["Irbesartan","Dapagliflozine","Pentoxifylline"],renal:"pentoxifylline_metabolite_V_renal",hepatic:"pentoxifylline_parent_hepatic",goal:"Hypothèse anti-inflammatoire, non démontrée"}
];
function hash(s){
 let x=2166136261>>>0;
 for(const c of s){x^=c.charCodeAt(0);x=Math.imul(x,16777619)>>>0}
 return x||1;
}
function generator(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
const round=(n,d=3)=>Number(n.toFixed(d));
export function massFactor(mass,reference){
 // If dose is normalized to mg/kg and CL∝body_mass^0.75, AUC∝body_mass^0.25.
 // This generalisation is NOT validated for these drugs or intra-species physiology.
 return (mass/reference)**0.25;
}
export function stress(anchor,mass,ref,seed){
 // Deliberately chosen uncertainty stress envelopes (not estimated distributions).
 // Cross-species strength=Uniform[0.5,1.5]; allometric exponent=Uniform[0.15,0.35];
 // residual exposure noise=Uniform[0.85,1.15]. No biological calibration.
 if(anchor===null||!Number.isFinite(anchor)||anchor<=0)return null;
 const u=generator(hash(seed)),values=[];
 for(let j=0;j<N;j++){
  const transfer=.5+u(),exponent=.15+.2*u(),variability=.85+.3*u();
  values.push(anchor**transfer*(mass/ref)**exponent*variability);
 }
 values.sort((a,b)=>a-b);
 const idx=q=>values[Math.max(0,Math.min(N-1,Math.floor(q*(N-1))))];
 return {anchor_human_ratio:round(anchor),median:round(idx(.5)),range_5_95:[round(idx(.05)),round(idx(.95))],
  share_above_2:round(values.filter(v=>v>2).length/N,3),
  share_above_5:round(values.filter(v=>v>5).length/N,3),
  interpretation:"Fractions de tirages conditionnelles aux enveloppes arbitraires; PAS des probabilités de toxicité."};
}
export function sglt2Inhibition(speciesId,free_nM){
 const species=SPECIES.find(s=>s.id===speciesId);
 if(!species||!Number.isFinite(free_nM)||free_nM<0)throw Error("Entrée invalide");
 return round(free_nM/(species.sglt2_ic50_nM+free_nM),4);
}
export function build(){
 const profiles=[];
 for(const animal of SPECIES)for(const mass of animal.masses_g)for(const renal of RENAL)
 for(const hepatic of HEPATIC)for(const hydration of HYDRATION){
  const id=[animal.id,mass,renal,hepatic,hydration].join("_");
  const groups=REGIMENS.map(g=>{
   const renalAnchor=ANCHORS[g.renal][RENAL.indexOf(renal)];
   const liverAnchor=g.hepatic?ANCHORS[g.hepatic][hepatic]:null;
   let flags=[];
   if(hydration==="depleted")flags.push("Vigilance hémodynamique : SGLT2 + bloqueur SRAA en déplétion volémique");
   if(renal==="severe"&&g.id==="R02-A")flags.push("Métabolite 5-carboxy-pirfénidone potentiellement accumulé; contre-indication humaine en insuffisance rénale sévère");
   if(renal==="severe"&&g.id==="R02-B")flags.push("Métabolite V de pentoxifylline fortement accumulé chez les humains insuffisants rénaux");
   if(hepatic==="severe")flags.push("Aucune extrapolation quantitative hépatique : situation hors données");
   if(g.id==="R02-DUO")flags.push("Absence de métabolite de troisième agent ne prouve pas l'innocuité de l'association");
   if(g.id==="R02-A")flags.push("Surveillance hépatique indispensable; métabolite de pirfénidone variable selon l'espèce");
   if(g.id==="R02-B")flags.push("Risques de saignement/hypotension et d'accumulation métabolique à caractériser");
   return {regimen:g.id,agents:g.agents,renal_marker:g.renal,renal_exposure:stress(renalAnchor,mass,animal.ref_mass_g,id+"-"+g.id+"-renal"),
    hepatic_marker:g.hepatic,hepatic_exposure:g.hepatic?stress(liverAnchor,mass,animal.ref_mass_g,id+"-"+g.id+"-hepatic"):null,
    flags,hepatic_extrapolation_valid:hepatic!=="severe",toxicity_probability:null,renal_injury_probability:null,
    benefit_probability:null,cure_probability:null,actual_animal_data:false};
  });
  profiles.push({id,species:animal.id,species_label:animal.label,mass_g:mass,ref_mass_g:animal.ref_mass_g,renal,hepatic,hydration,
   sex:"non stratifié : aucune différence quantifiée sans données PK",
   age:"non stratifié : données PK par âge manquantes",
   body_composition:"non stratifiée : fraction grasse/protéines de liaison inconnues",
   exposure_regimens:groups,
   not_modelled:["espèce spécifique CYP et transporteurs","fraction libre par molécule","âge","sexe","génotype et souche","glycémie","albuminémie","inflammation","microbiote","interactions enzymatiques","metabolites combinés","exposition rénale tissulaire","profil concentration-temps","dose réelle","durée d'exposition"]});
 }
 return {run_id:"PRMR-R03-2026-11-16",version:VERSION,run_type:"exploratory_exposure_stress_test",species:SPECIES,
  input_anchor_domain:"Human relative PK exposures, used for rodent sensitivity only; no rodent model calibration",
  conceptual_weight_model:"For a fixed normalized dose mg/kg: CL ∝ mass^0.75 and AUC ∝ mass^0.25; intra-species unvalidated",
  simulated_uncertainty:{n_draws:N,transfer_strength:"uniform 0.5–1.5",mass_exponent:"uniform 0.15–0.35",residual_factor:"uniform 0.85–1.15",
   values:"not physiological or toxicological probability distributions; chosen stress-test ranges"},
  anchors:ANCHORS,regimens:REGIMENS,cohorts_count:profiles.length,
  outputs_explained:{ratio:"relative exposure to reference healthy analogue",
   frac:"simulated fraction of scenarios exceeding 2x or 5x relative AUC, not a toxic threshold",
   hepatic_severe:"null = unknown/not extrapolable",toxic_probability:"null because no validated exposure-response injury data"},
  sources:[
   "https://www.medicines.org.uk/emc/product/13875/smpc",
   "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b0d1d50f-9023-4e2f-889f-a5febba70fa5",
   "https://www.medicines.org.uk/emc/product/7607/smpc",
   "https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=professional&setid=2113a901-2612-4557-b86d-3afc006fb8bb",
   "https://journals.sagepub.com/doi/full/10.1177/1091581813505331",
   "https://pmc.ncbi.nlm.nih.gov/articles/PMC11782306/"
  ],profiles};
}

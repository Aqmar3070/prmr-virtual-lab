/**
 * PRMR R09 anatomical object registry.
 * Dedicated species profiles, NOT interchangeable human organs.
 * The default procedural meshes are visual anatomical hypotheses, not segmented scans.
 * CT-derived canine meshes are credited separately in assets/vet3d/manifest.json.
 */
export const ORGAN_MODES=Object.freeze({
 kidneys:{label:"Reins / voies urinaires",color:"#70e3d8",role:"Rénal",group:["kidneys"]},
 heart:{label:"Cœur",color:"#fa788e",role:"Hémodynamique",group:["heart"]},
 lungs:{label:"Poumons",color:"#9bc9f6",role:"Respiratoire",group:["lungs"]},
 liver:{label:"Foie",color:"#e9a167",role:"Hépatique",group:["liver"]},
 brain:{label:"Cerveau",color:"#d3a9f9",role:"Neurologique",group:["brain"]},
 digestive:{label:"Système digestif",color:"#f5af94",role:"Digestif",group:["digestive"]},
 pancreas:{label:"Pancréas",color:"#f3d27c",role:"Métabolique",group:["pancreas"]},
 all:{label:"Tous les organes",color:"#f1f4ff",role:"Systémique",group:["kidneys","heart","lungs","liver","brain","digestive","pancreas"]}
});
export const SPECIES_ANATOMY=Object.freeze({
 mouse:{label:"Souris",latin:"Mus musculus",torso:[1.28,.60,.55],head:[-1.15,.27,.0,.47,.46,.39],ear:"round",tail:1.65,legs:.56,brain:"smooth",leftLung:1,rightLung:4,cecum:"large",kidney:"unipapillary",gallbladder:true,bodyColor:0xced7d5},
 rat:{label:"Rat",latin:"Rattus norvegicus",torso:[1.44,.61,.57],head:[-1.26,.25,.0,.50,.44,.40],ear:"round",tail:1.78,legs:.61,brain:"smooth",leftLung:1,rightLung:4,cecum:"large",kidney:"unipapillary",gallbladder:false,bodyColor:0xb1a095},
 pig:{label:"Porc / miniporc",latin:"Sus scrofa domesticus",torso:[1.55,.82,.74],head:[-1.40,.20,.0,.64,.61,.51],ear:"triangular",tail:.55,legs:.66,brain:"folded",leftLung:2,rightLung:4,cecum:"spiral-colon",kidney:"multipapillary",gallbladder:true,bodyColor:0xe9b1b6},
 dog:{label:"Chien",latin:"Canis lupus familiaris",torso:[1.42,.71,.58],head:[-1.30,.38,.0,.55,.48,.46],ear:"floppy",tail:1.07,legs:.90,brain:"folded",leftLung:3,rightLung:4,cecum:"small",kidney:"unipapillary",gallbladder:true,bodyColor:0xc6a78d},
 nhp:{label:"Primate non humain",latin:"Macaca sp. (référence illustrative)",torso:[1.13,.75,.58],head:[-1.08,.59,.0,.53,.55,.46],ear:"small",tail:1.11,legs:.83,brain:"folded",leftLung:2,rightLung:3,cecum:"moderate",kidney:"species-dependent",gallbladder:true,bodyColor:0xa39186},
 rabbit:{label:"Lapin",latin:"Oryctolagus cuniculus",torso:[1.33,.63,.54],head:[-1.14,.31,.0,.49,.47,.42],ear:"long",tail:.16,legs:.62,brain:"smooth",leftLung:3,rightLung:4,cecum:"very-large",kidney:"unipapillary",gallbladder:true,bodyColor:0xe4e7e9}
});
export const ORGAN_IDS=Object.freeze(Object.keys(ORGAN_MODES).filter(k=>k!=="all"));
export const SPECIES_IDS=Object.freeze(Object.keys(SPECIES_ANATOMY));
export const ORGANS_INTERACTIONS=Object.freeze({
 renal_cardiac:{a:"kidneys",b:"heart",description:"Lien hémodynamique rein–cœur, conceptuel ; aucune intensité calibrée"},
 renal_hepatic:{a:"kidneys",b:"liver",description:"Clairances rénale et hépatique, conceptualisation PK ; pas de mécanisme individuel identifié"},
 renal_vascular:{a:"kidneys",b:"lungs",description:"Lien systémique illustratif, pas une lésion pulmonaire établie"},
 diabetic_pancreas:{a:"kidneys",b:"pancreas",description:"Axe glycémie–fonction rénale exploratoire ; non prédictif"},
 hepatic_digestive:{a:"liver",b:"digestive",description:"Axe hépatodigestif illustratif"}
});
export const DISEASE_VISUAL_TARGET=Object.freeze({
 diabetic:["kidneys","pancreas","heart"],
 hypertensive:["kidneys","heart"],
 fibrotic:["kidneys"],
 alport:["kidneys"],
 ischemic:["kidneys","heart"]
});
export function organAssessment(inputs){
 const renal=inputs?.renal||"normal",hepatic=inputs?.hepatic||"normal";
 const disease=inputs?.disease||"fibrotic";
 const active=new Set(DISEASE_VISUAL_TARGET[disease]||["kidneys"]);
 if(hepatic!=="normal")active.add("liver");
 const attention={
  kidneys:renal==="normal"?"context":renal==="severe"?"severe":renal==="moderate"?"moderate":"mild",
  liver:hepatic==="normal"?"context":hepatic==="severe"?"severe":"moderate"
 };
 return {active:[...active],attention,links:ORGANS_INTERACTIONS,illustrative:true,
  disclaimer:"Surlignage de zones d'intérêt théoriques, pas localisation diagnostique ni lésion constatée."};
}
export const ANATOMY_SOURCES=Object.freeze({
 comparative_mouse_rat:"https://pmc.ncbi.nlm.nih.gov/articles/PMC9291387/",
 biliary_mouse_rat:"https://pubmed.ncbi.nlm.nih.gov/29023691/",
 veterinary_canine:"https://github.com/Ketbome/vet-atlas",
 anatomical_validation:"non_validée_par_imagerie_PRMR",
 modeled_fidelity:"maillage analytique pédagogique, pas de segmentation"
});

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
// Seules les espèces dont l'anatomie provient de modèles réellement
// acquis figurent ici. Souris, rat, porc, primate et lapin ont été
// retirés : aucune imagerie sous licence utilisable n'existe pour eux, et
// leurs organes n'étaient que des maillages construits.
 dog:{label:"Chien",latin:"Canis lupus familiaris",torso:[1.42,.71,.58],head:[-1.30,.38,.0,.55,.48,.46],ear:"floppy",tail:1.07,legs:.90,brain:"folded",leftLung:3,rightLung:4,cecum:"small",kidney:"unipapillary",gallbladder:true,bodyColor:0xc6a78d},
 cat:{label:"Chat",latin:"Felis catus",torso:[1.30,.62,.52],head:[-1.18,.34,.0,.50,.46,.44],ear:"triangular",tail:1.18,legs:.74,brain:"folded",leftLung:3,rightLung:4,cecum:"vestigial",kidney:"unipapillary",gallbladder:true,bodyColor:0xb9a596}
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

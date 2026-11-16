// Moteur moléculaire client: RDKit.js MinimalLib (WebAssembly).
// Les descripteurs sont déterministes pour une structure donnée; ils ne prédisent pas activité, toxicité ou synthèse.
export const EXAMPLES = Object.freeze([
 {name:"Caféine",smiles:"Cn1c(=O)c2c(ncn2C)n(C)c1=O",source:"exemple connu"},
 {name:"Acide acétylsalicylique",smiles:"CC(=O)Oc1ccccc1C(=O)O",source:"exemple connu"},
 {name:"Paracétamol",smiles:"CC(=O)Nc1ccc(O)cc1",source:"exemple connu"},
 {name:"Ibuprofène",smiles:"CC(C)Cc1ccc(cc1)C(C)C(=O)O",source:"exemple connu"},
 {name:"Metformine",smiles:"CN(C)C(=N)NC(=N)N",source:"exemple connu"}
]);
export const SYSTEMS = Object.freeze([
 {name:"Rénal",area:"Filtration, transport tubulaire, fibrose",status:"Modèle en préparation"},
 {name:"Cardiovasculaire",area:"Hémodynamique, récepteurs, endothélium",status:"Atlas de recherche"},
 {name:"Neurologique",area:"Barrière hémato-encéphalique, signalisation",status:"Atlas de recherche"},
 {name:"Hépatique",area:"Métabolisme, transporteurs, atteintes",status:"Atlas de recherche"},
 {name:"Respiratoire",area:"Inflammation, échange gazeux",status:"Atlas de recherche"},
 {name:"Endocrinien",area:"Régulation hormonale et métabolique",status:"Atlas de recherche"},
 {name:"Immunitaire",area:"Cytokines, populations cellulaires",status:"Atlas de recherche"},
 {name:"Digestif",area:"Absorption, microbiote, muqueuses",status:"Atlas de recherche"},
 {name:"Oncologique",area:"Prolifération, cibles et résistances",status:"Atlas de recherche"},
 {name:"Musculosquelettique",area:"Remodelage et inflammation",status:"Atlas de recherche"},
 {name:"Reproducteur",area:"Physiologie et sécurité",status:"Atlas de recherche"},
 {name:"Dermatologique",area:"Barrière cutanée et réparation",status:"Atlas de recherche"}
]);
const GROUPS=["F","Cl","Br","O","N","C","OC","C#N","C(=O)O","C(=O)N","S(=O)(=O)N"];
export function enumerateStructures(max=16){
 const generated=[];
 for(let i=0;i<GROUPS.length && generated.length<max;i++){
  const g=GROUPS[i];
  generated.push({name:"Candidat V-"+String(i+1).padStart(2,"0"),smiles:`c1ccc(${g})cc1`,source:"énumération virtuelle non validée"});
 }
 for(let i=0;i<GROUPS.length && generated.length<max;i++){
  generated.push({name:"Candidat V-"+String(generated.length+1).padStart(2,"0"),smiles:`c1cc(${GROUPS[i]})ccc1F`,source:"énumération virtuelle non validée"});
 }
 return generated;
}
export function similarity(a,b) {
 if(!a || !b || a.length !== b.length) return null;
 let intersection=0,union=0;
 for(let i=0;i<a.length;i++){
   const x=a[i]==="1",y=b[i]==="1";
   if(x&&y) intersection++;
   if(x||y) union++;
 }
 return union===0?1:intersection/union;
}
export function normalizeDescriptor(raw){
 const d=typeof raw==="string"?JSON.parse(raw):raw;
 const select=(...keys)=>{for(const key of keys)if(d[key]!==null&&d[key]!==undefined&&d[key]!==""&&Number.isFinite(Number(d[key])))return Number(d[key]);return null};
 return {
  mass:select("amw","MolWt","molwt","MW"),
  logp:select("CrippenClogP","CrippenLogP","logp","MolLogP"),
  tpsa:select("tpsa","TPSA"),
  hba:select("lipinskiHBA","NumHAcceptors","HBA"),
  hbd:select("lipinskiHBD","NumHDonors","HBD"),
  rotb:select("NumRotatableBonds","NumRotatableBondsStrict","NumRotatableBondsNonStrict"),
  raw:d
 };
}
export async function loadRDKit(url="https://unpkg.com/@rdkit/rdkit@2026.9.2/dist/"){
 if(typeof window==="undefined") throw new Error("RDKit requiert un navigateur.");
 if(!window.initRDKitModule) throw new Error("Bibliothèque RDKit.js inaccessible. Vérifier la connexion et les restrictions du navigateur.");
 const kit=await window.initRDKitModule({locateFile:file=>url+file});
 if(!kit || typeof kit.get_mol!=="function")throw new Error("RDKit.js initialisé sans analyseur moléculaire.");
 return kit;
}
export function analyzeSmiles(kit,smiles){
 if(!kit)throw new Error("RDKit non chargé. Aucune analyse moléculaire n'est simulée.");
 const input=String(smiles||"").trim();
 if(!input || input.length>600)throw new Error("SMILES vide ou trop long (600 caractères maximum).");
 const mol=kit.get_mol(input);
 if(!mol)throw new Error("Structure refusée par RDKit : SMILES invalide ou chimiquement non interprétable.");
 try{
  const descriptors=normalizeDescriptor(mol.get_descriptors());
  const svg=mol.get_svg(460,320);
  const fingerprint=mol.get_morgan_fp();
  return {smiles:input,descriptors,svg,fingerprint,numAtoms:mol.get_num_atoms(),numBonds:mol.get_num_bonds()};
 } finally {mol.delete();}
}

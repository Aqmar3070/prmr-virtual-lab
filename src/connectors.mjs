// Connecteurs publics. Un échec réseau ou CORS n'est jamais transformé en donnée supposée.
async function requestJSON(url,limitMs=12000){
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),limitMs);
 try {
  const r=await fetch(url,{method:"GET",headers:{"Accept":"application/json"},signal:ctrl.signal});
  if(!r.ok)throw new Error("Service HTTP "+r.status);
  return await r.json();
 }catch(err){if(err.name==="AbortError")throw new Error("Délai réseau dépassé");throw err}
 finally {clearTimeout(timeout)}
}
export async function findPubChem(name){
 const term=String(name||"").trim();
 if(!term || term.length>90)throw new Error("Saisir un nom de molécule (90 caractères maximum).");
 const url="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"+encodeURIComponent(term)+"/property/MolecularFormula,MolecularWeight,ConnectivitySMILES,SMILES,InChIKey,XLogP,TPSA/JSON";
 const data=await requestJSON(url);
 const item=data?.PropertyTable?.Properties?.[0];
 if(!item)throw new Error("Aucun résultat PubChem");
 return {cid:item.CID,name:term,smiles:item.SMILES||item.ConnectivitySMILES||"",formula:item.MolecularFormula,mass:item.MolecularWeight,logp:item.XLogP,tpsa:item.TPSA,inchikey:item.InChIKey,source:"PubChem PUG REST",url:"https://pubchem.ncbi.nlm.nih.gov/compound/"+item.CID};
}
export async function searchChEMBLTargets(term){
 const q=String(term||"").trim();
 if(!q || q.length>70)throw new Error("Saisir une cible biologique ou un terme de recherche.");
 const url="https://www.ebi.ac.uk/chembl/api/data/target.json?pref_name__icontains="+encodeURIComponent(q)+"&limit=9";
 const data=await requestJSON(url);
 return (data?.targets||[]).map(t=>({id:t.target_chembl_id,name:t.pref_name||"Sans nom",organism:t.organism||"",type:t.target_type||"",url:"https://www.ebi.ac.uk/chembl/target_report_card/"+encodeURIComponent(t.target_chembl_id)+"/"}));
}

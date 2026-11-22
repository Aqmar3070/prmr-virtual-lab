import test from "node:test";
import assert from "node:assert/strict";
import {plantePour,fichesMonographies} from "../src/exposure-monographies.mjs";
const donnees={plantes:[
 {latin:"Zingiberis rhizoma",commun:"Ginger",monographie:"https://www.ema.europa.eu/x_en.pdf",posologie:"Single dose 0.5 g",effets_indesirables:"Mild gastrointestinal complaints such as heartburn have been reported. The frequency is not known.",interactions:"None reported."},
 {latin:"Hyperici herba;Cimicifugae rhizoma",commun:"Association"},
 {latin:"Hyperici herba",commun:"St John's wort",interactions:"Induces CYP3A4: reduces the effect of many medicines."}]};
test("Nom français relié à la monographie latine",()=>{
 assert.equal(plantePour({id:"type2_0",name:"Gingembre (rhizome)"},donnees).commun,"Ginger");
 assert.equal(plantePour({id:"type2_6",name:"Millepertuis (extrait)"},donnees).commun,"St John's wort");
 assert.equal(plantePour({id:"type2_9",name:"Camomille"},donnees),null);
 assert.equal(plantePour({id:"ema:2",name:"x"},donnees).latin,"Hyperici herba");
});
test("Fiche : rubriques officielles, organes touchés, rubrique vide neutre",()=>{
 const rows=[{id:"g",qty:100,after:100,start:0,reduce:30,end:30}];
 const [f]=fichesMonographies(rows,()=>({id:"g",name:"Gingembre",unit:"g",family:2}),donnees,30);
 assert.match(f.titre,/Monographie européenne/);
 const ei=f.resultats.find(r=>r.id==="ema_effets_indesirables");
 assert.deepEqual(ei.zones,["stomach"]);assert.equal(ei.signe,-1);
 assert.equal(f.resultats.find(r=>r.id==="ema_interactions").signe,0);
 assert.match(f.entete[1],/100 g par jour sur 30 jours/);
});

// Shared interactive PRMR research-workbench for landing, R03 and screening.
import {createVisualAtlas} from "./r04_atlas.mjs";
import {computeR04,SPECIES_R04,DEFAULT_R04} from "./r04_engine.mjs";
const sessions=[];
function bind(hostId){
 const host=document.getElementById(hostId);if(!host)return;
 const state={...DEFAULT_R04};
 let stage=null;
 function update(){
  const result=computeR04(state);
  stage?.render(result);
  const deep=document.getElementById(hostId+"-deep");
  if(deep)deep.href="./species-r04.html?species="+encodeURIComponent(state.species)+"&v=full-workbench-20261117";
 }
 const onSpecies=id=>{
  const s=SPECIES_R04.find(x=>x.id===id);if(!s)return;
  state.species=id;state.mass_kg=s.ref_kg;
  update();
 };
 stage=createVisualAtlas({hostId,compact:true,onChoose:onSpecies,getResult:()=>computeR04(state),onEdit:patch=>{Object.assign(state,patch);update()}});
 sessions.push(stage);
 update();
}
for(const id of ["r5-home-stage","r5-risk-stage","r5-screening-stage","r5-preclinical-stage"])bind(id);

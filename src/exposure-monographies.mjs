// Monographies de plantes de l'Agence européenne du médicament (comité HMPC).
// Fichier produit par scripts/extraire_monographies.py : research-data/monographies-ema.json.gz.
// Le texte des rubriques est celui de la monographie officielle, en anglais ; il n'est ni résumé ni complété.
import {doseAt,fold} from "./exposure-evidence.mjs";

// Nom français courant → genre latin utilisé par l'EMA.
export const NOMS_FR={
 gingembre:"zingiber",curcuma:"curcuma",ginseng:"panax",guarana:"paullinia",mate:"ilex",the:"camellia",
 millepertuis:"hypericum",reglisse:"glycyrrhiza",menthe:"mentha",camomille:"matricaria",hibiscus:"hibiscus",bissap:"hibiscus",
 valeriane:"valeriana",ail:"allium",cannelle:"cinnamomum",romarin:"rosmarinus",thym:"thymus",girofle:"syzygium",
 fenugrec:"trigonella",fenouil:"foeniculum",nigelle:"nigella",lin:"linum",cacao:"theobroma",moringa:"moringa",
 baobab:"adansonia",kola:"cola",artemisia:"artemisia",armoise:"artemisia",aloes:"aloe",aloe:"aloe",sene:"senna",
 artichaut:"cynara",ortie:"urtica",passiflore:"passiflora",melisse:"melissa",lavande:"lavandula",tilleul:"tilia",
 aubepine:"crataegus",echinacee:"echinacea",ginkgo:"ginkgo",harpagophyton:"harpagophytum",prele:"equisetum",
 pissenlit:"taraxacum",bourrache:"borago",psyllium:"plantago",plantain:"plantago",sauge:"salvia",eucalyptus:"eucalyptus",
 anis:"pimpinella",badiane:"illicium",houblon:"humulus",avoine:"avena",sureau:"sambucus",cassis:"ribes",
 bouleau:"betula",reine:"filipendula",saule:"salix",chardon:"silybum",rhubarbe:"rheum",bourdaine:"frangula",
 cascara:"rhamnus",gentiane:"gentiana",angelique:"angelica",coriandre:"coriandrum",cumin:"carum",carvi:"carum",
 calendula:"calendula",souci:"calendula",mauve:"malva",guimauve:"althaea",olivier:"olea",olive:"olea",
 pelargonium:"pelargonium",rhodiola:"rhodiola",eleutherocoque:"eleutherococcus",verveine:"verbena",
 marronnier:"aesculus",vigne:"vitis",myrtille:"vaccinium",canneberge:"vaccinium",busserole:"arctostaphylos",
 lierre:"hedera",primevere:"primula",thym_serpolet:"thymus",polygala:"polygala",grindelia:"grindelia",
 rose:"rosa",eglantier:"rosa",souchet:"cyperus",oignon:"allium"
};

export async function chargerMonographies(url="./research-data/monographies-ema.json.gz"){
 const res=await fetch(url);if(!res.ok)throw Error("monographies indisponibles");
 const flux=res.body.pipeThrough(new DecompressionStream("gzip"));
 return new Response(flux).json();
}

// Retrouve la monographie d'un produit : identifiant « ema: » direct, sinon nom français ou latin.
export function plantePour(produit,donnees){
 if(!produit||!donnees?.plantes)return null;
 if(produit.id?.startsWith("ema:"))return donnees.plantes[Number(produit.id.slice(4))]||null;
 const nom=fold(produit.name||"");
 const genres=new Set();
 for(const mot of nom.split(/[^a-z]+/)){if(NOMS_FR[mot])genres.add(NOMS_FR[mot]);}
 for(const p of donnees.plantes){
  const latin=fold(p.latin||"");
  const genre=latin.split(/[^a-z]+/)[0];
  // Le latin de l'EMA est au génitif (Hyperici herba, Zingiberis rhizoma) : comparaison sur le radical.
  if(genre&&[...genres].some(g=>genre.slice(0,5)===g.slice(0,5)))return p;
 }
 return null;
}

const RUBRIQUES=[
 ["posologie","Doses étudiées et durée d’usage",0],
 ["contre_indications","Contre-indications",-1],
 ["mises_en_garde","Mises en garde",-1],
 ["interactions","Interactions avec médicaments et autres substances",-1],
 ["grossesse","Grossesse, allaitement, fertilité",-1],
 ["effets_indesirables","Effets indésirables",-1],
 ["surdosage","Surdosage",-1],
];
function zones(texte){
 const t=fold(texte),z=new Set();
 if(/gastro|stomach|nausea|vomit|diarrh|abdominal|heartburn|dyspeps/.test(t))z.add("stomach");
 if(/liver|hepat/.test(t))z.add("liver");
 if(/kidney|renal/.test(t)){z.add("kidney_l");z.add("kidney_r");}
 if(/skin|rash|urticaria|pruritus|photosensit/.test(t))z.add("skin");
 if(/bleeding|anticoagul|platelet/.test(t))z.add("heart");
 if(/blood pressure|hypotension|hypertension|cardiac|\bheart\b(?!burn)/.test(t))z.add("heart");
 if(/headache|dizziness|sleep|seizure|nervous/.test(t))z.add("brain");
 return [...z];
}

export function fichesMonographies(rows,lookup,donnees,duree){
 if(!donnees?.plantes)return [];
 const vues=new Map();
 for(const r of rows){
  const p=lookup(r.id),pl=plantePour(p,donnees);if(!pl||vues.has(pl))continue;
  let jours=0,g=0;for(let t=0;t<=duree;t++){const d=doseAt(r,t);if(d>0){jours++;g=Math.max(g,d);}}
  vues.set(pl,{p,jours,g,unite:p.unit});
 }
 const fiches=[];
 for(const [pl,{p,jours,g,unite}] of vues){
  const resultats=RUBRIQUES.filter(([k])=>pl[k]).map(([k,titre,signe])=>{
   const vide=/^(none|not applicable|none reported|none known)\b/i.test(pl[k].trim());
   return {id:"ema_"+k,titre,zones:signe<0&&!vide?zones(pl[k]):[],signe:vide?0:signe,niveau:k==="posologie"?"non_chiffre":vide?"non_chiffre":"faible",
    badge:k==="effets_indesirables"&&!vide?"notice":undefined,rr:null,statut:k==="effets_indesirables"?"pharmacovigilance":"reglementaire",domaine:"etudie",
    constat:pl[k],pourquoi:"Texte officiel de la monographie européenne (en anglais), rubrique "+({posologie:"4.2",contre_indications:"4.3",mises_en_garde:"4.4",interactions:"4.5",grossesse:"4.6",effets_indesirables:"4.8",surdosage:"4.9"}[k])+".",
    source:"EMA · monographie de l’Union européenne · "+(pl.latin||pl.commun),url:pl.monographie||pl.page};
  });
  if(!resultats.length)continue;
  fiches.push({id:"ema_"+fold(pl.latin||pl.commun).replace(/[^a-z]+/g,"_"),titre:"Monographie européenne · "+(p.name||pl.commun),unite:"",moyenne:0,nbJours:jours,total:0,
   entete:["Plante : "+[pl.latin,pl.commun].filter(Boolean).join(" · ")+".",
    "Quantité saisie : "+g+" "+unite+" par jour sur "+jours+" jour"+(jours>1?"s":"")+". Comparer avec les doses de la rubrique « Doses étudiées » : au-delà, aucun effet n’est chiffré par la monographie."],
   equivalences:[],resultats});
 }
 return fiches;
}

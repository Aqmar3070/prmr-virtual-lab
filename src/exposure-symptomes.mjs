// Lecture d'un récit libre : profil (sexe, âge, poids, taille), durée globale et symptômes décrits.
// Les symptômes sont ensuite cherchés dans les effets déjà enregistrés (notices, monographies, fiches sourcées)
// des substances du scénario. Aucun diagnostic : on montre quels effets documentés ressemblent au symptôme.
import {fold} from "./exposure-evidence.mjs";

const n=s=>Number(String(s).replace(",","."));

export function lireProfil(texte){
 const t=fold(texte).replace(/[’']/g," ");
 const p={};
 if(/\b(je suis|moi|un|une)?\s*(homme|garcon|monsieur|masculin)\b/.test(t))p.sexe="male";
 if(/\b(femme|fille|madame|feminin|enceinte)\b/.test(t))p.sexe="female";
 const age=t.match(/\b(\d{1,3})\s*ans\b/);if(age&&n(age[1])>0&&n(age[1])<120)p.age=n(age[1]);
 const poids=t.match(/\b(\d{2,3}(?:[.,]\d)?)\s*(?:kg|kilos?|kilogrammes?)\b/);if(poids)p.poids=n(poids[1]);
 const taille=t.match(/\b(1)\s*m\s*(\d{2})\b|\b(1[.,]\d{2})\s*m\b|\b(1\d{2})\s*cm\b/);
 if(taille)p.taille=taille[1]?n("1."+taille[2])*100:taille[3]?n(taille[3])*100:n(taille[4]);
 return p;
}

// Durée commune annoncée à part (« ça fait 4 semaines », « depuis 3 mois »).
export function dureeGlobale(texte){
 const t=fold(texte).replace(/[’']/g," ");
 const m=[...t.matchAll(/\b(?:depuis|ca fait|cela fait|il y a|pendant|durant|voila)\s*(?:maintenant\s*|deja\s*|environ\s*|plus de\s*)?(\d+(?:[.,]\d+)?)\s*(jours?|semaines?|mois|ans?|annees?)\b/g)];
 if(!m.length)return null;
 const jours=m.map(x=>Math.round(n(x[1])*({j:1,s:7,m:30,a:365}[x[2][0]])));
 return Math.max(...jours);
}

// Symptômes : mots de la personne → mots des notices (français et anglais des monographies).
export const SYMPTOMES=[
 {nom:"mal de tête",dit:/\b(mal a la tete|maux de tete|mal de tete|migraines?|cephalees?)\b/,cherche:/cephal|maux de tete|mal de tete|migraine|headache/},
 {nom:"nausées",dit:/\b(nausees?|envie de vomir|ecoeure)\b/,cherche:/nausee|nausea/},
 {nom:"vomissements",dit:/\b(vomi|vomis|vomissements?|vomir)\b/,cherche:/vomiss|vomit/},
 {nom:"diarrhée",dit:/\bdiarrhees?\b/,cherche:/diarrh/},
 {nom:"constipation",dit:/\bconstipe|constipation\b/,cherche:/constipation/},
 {nom:"mal au ventre",dit:/\b(mal au ventre|maux de ventre|douleurs? abdominales?|crampes? d estomac)\b/,cherche:/douleurs? abdominale|abdominal pain|mal au ventre|crampe/},
 {nom:"brûlures d'estomac",dit:/\b(brulures? d estomac|aigreurs?|reflux|acidite)\b/,cherche:/brulure|reflux|dyspeps|heartburn|aigreur|gastrite|ulcere/},
 {nom:"vertiges",dit:/\b(vertiges?|etourdissements?|tete qui tourne)\b/,cherche:/vertige|etourdiss|dizziness/},
 {nom:"fatigue",dit:/\b(fatigue|fatigues|epuise|somnolent|somnolence|asthenie)\b/,cherche:/fatigue|asthenie|somnolence/},
 {nom:"troubles du sommeil",dit:/\b(insomnies?|dors mal|sommeil|pas dormir)\b/,cherche:/insomnie|sommeil/},
 {nom:"palpitations",dit:/\b(palpitations?|coeur qui bat|tachycardie)\b/,cherche:/palpitation|tachycardie|rythme cardiaque|arythmie/},
 {nom:"nervosité",dit:/\b(nerveux|nervosite|anxieux|anxiete|agite|irritable|stresse)\b/,cherche:/anxiete|nervosite|agitation|irritabilite/},
 {nom:"boutons ou démangeaisons",dit:/\b(boutons?|demangeaisons?|gratte|eruption|urticaire|plaques? rouges?)\b/,cherche:/eruption|rash|prurit|demangeaison|urticaire|cutane/},
 {nom:"jaunisse ou foie",dit:/\b(jaunisse|yeux jaunes|peau jaune|foie)\b/,cherche:/ictere|jaunisse|hepat|transaminase|foie/},
 {nom:"reins ou urines",dit:/\b(reins?|urines?|uriner|pipi)\b/,cherche:/renal|rein|urinaire|urine/},
 {nom:"saignements",dit:/\b(saigne|saignements?|sang dans|bleus?|hematomes?)\b/,cherche:/saignement|hemorrag|bleeding|ecchymose/},
 {nom:"essoufflement",dit:/\b(essouffle|essoufflement|respire mal|souffle court)\b/,cherche:/dyspnee|essoufflement|bronchospasme|respiratoire/},
 {nom:"douleurs musculaires",dit:/\b(courbatures?|douleurs? musculaires?|crampes?|mal aux muscles)\b/,cherche:/myalgie|musculaire|crampe/},
 {nom:"tension",dit:/\b(tension|hypertension|hypotension)\b/,cherche:/hypotension|hypertension|pression arterielle|tension/},
 {nom:"tremblements",dit:/\btremble|tremblements?\b/,cherche:/tremblement|tremor/},
 {nom:"perte d'appétit",dit:/\b(pas faim|perte d appetit|appetit)\b/,cherche:/anorexie|appetit/},
];

export function lireSymptomes(texte){
 const t=fold(texte).replace(/[’']/g," ");
 return SYMPTOMES.filter(s=>s.dit.test(t));
}

// Effets enregistrés des substances du scénario qui correspondent aux symptômes décrits.
export function ficheSymptomes(symptomes,fiches){
 if(!symptomes?.length)return null;
 const resultats=[];
 for(const s of symptomes){
  const trouves=[];
  for(const f of fiches){
   if(f.id==="symptomes")continue;
   for(const r of f.resultats||[]){
    const texte=fold((r.titre||"")+" "+(r.constat||""));
    if(s.cherche.test(texte))trouves.push({f,r});
   }
  }
  if(!trouves.length){
   resultats.push({id:"sym_"+s.nom,titre:s.nom[0].toUpperCase()+s.nom.slice(1)+" · non décrit pour ces substances",zones:[],signe:0,niveau:"non_chiffre",rr:null,statut:"non_documente",domaine:"etudie",
    constat:"Aucun effet de ce type n’est décrit pour les substances saisies dans les sources enregistrées. D’autres causes sont possibles : seul un professionnel de santé peut les rechercher.",pourquoi:"Rapprochement entre le symptôme décrit et les effets enregistrés."});
   continue;
  }
  for(const {f,r} of trouves.slice(0,8)){
   const extrait=(r.constat||"").split(/\n|(?<=\.)\s/).find(l=>s.cherche.test(fold(l)))||r.constat||"";
   resultats.push({...r,id:"sym_"+s.nom+"_"+f.id+"_"+r.id,titre:s.nom[0].toUpperCase()+s.nom.slice(1)+" · "+f.titre.replace(/^(Notice officielle|Monographie européenne) · /,""),
    constat:"Effet décrit pour cette substance : « "+r.titre+" ». "+extrait.slice(0,400),
    pourquoi:"Rapprochement automatique entre votre symptôme et un effet documenté. Ce n’est pas un diagnostic : la cause peut être autre."});
  }
 }
 return {id:"symptomes",titre:"Vos symptômes · "+symptomes.map(s=>s.nom).join(", "),unite:"",moyenne:0,nbJours:0,total:0,
  entete:["Effets documentés des substances saisies qui correspondent à ce que vous décrivez."],equivalences:[],resultats};
}

// Les libellés communs servent de clés entre la saisie régionale et les fiches sourcées.
export const regions = {
 "Général": {"Corps entier":"Fièvre|Frissons|Fatigue|Courbatures|Perte de poids|Sueurs nocturnes|Perte d’appétit|Malaise"},
 "Tête et cou": {"Tête":"Mal de tête|Douleur pulsatile|Mal de tête brutal et intense|Vertiges", "Yeux":"Sensibilité à la lumière|Yeux rouges|Yeux qui démangent|Yeux qui coulent|Sécrétions oculaires collantes|Vision trouble|Perte soudaine de vision", "Oreilles":"Douleur d’oreille|Bourdonnements|Baisse d’audition|Écoulement de l’oreille", "Nez et sinus":"Nez qui coule|Nez bouché|Éternuements|Douleur du visage", "Bouche, dents et gorge":"Mal de gorge|Douleur dentaire|Difficulté à avaler|Bouche sèche", "Cou et nuque":"Douleur du cou|Raideur de nuque|Gonflement du cou"},
 "Thorax et seins":{"Poitrine":"Douleur thoracique|Douleur thoracique persistante|Palpitations|Essoufflement|Difficulté respiratoire sévère|Toux|Respiration sifflante","Seins":"Douleur du sein|Masse ressentie|Écoulement du mamelon"},
 "Abdomen et digestion":{"Abdomen":"Douleur abdominale|Nausées|Vomissements|Ballonnements|Brûlures d’estomac|Remontées acides","Transit":"Diarrhée|Constipation|Selles dures|Efforts pour aller à la selle|Sang dans les selles"},
 "Dos et flancs":{"Dos":"Douleur lombaire|Douleur descendant dans une jambe|Douleur entre les omoplates","Flancs":"Douleur du flanc"},
 "Bassin et périnée":{"Urines":"Brûlure en urinant|Envies fréquentes d’uriner|Sang dans les urines","Organes génitaux et pelvis":"Douleur pelvienne|Douleur testiculaire|Démangeaisons génitales|Saignement inhabituel|Règles douloureuses","Anus":"Douleur anale|Démangeaisons anales"},
 "Bras et mains":{"Épaule, bras et coude":"Douleur d’épaule|Douleur du bras|Douleur du coude","Poignet, main et doigts":"Douleur du poignet|Fourmillements des mains|Raideur des doigts|Perte de force de la main"},
 "Jambes et pieds":{"Hanche, cuisse et genou":"Douleur de hanche|Douleur de cuisse|Douleur du genou","Mollet et cheville":"Crampe du mollet|Gonflement de cheville","Pied et orteils":"Fourmillements des pieds|Engourdissement des pieds|Brûlures des pieds|Douleur du pied|Démangeaisons entre les orteils|Peau fissurée entre les orteils"},
 "Peau, cheveux et ongles":{"Peau":"Démangeaisons de la peau|Peau sèche|Plaques inflammatoires|Éruption|Ecchymoses","Cheveux et ongles":"Chute de cheveux|Ongle épaissi"},
 "Sommeil, humeur et neurologie":{"Sommeil et humeur":"Insomnie|Somnolence|Anxiété|Tristesse persistante","Fonctions neurologiques":"Faiblesse soudaine d’un côté|Trouble soudain de la parole|Trouble de mémoire|Trouble de l’équilibre"}
};
export const rules = [
 ["constipation","constipation","Constipation|Selles dures|Efforts pour aller à la selle"],
 ["reflux","heartburn-and-acid-reflux","Brûlures d’estomac|Remontées acides"],
 ["asthme","asthma","Toux|Essoufflement|Respiration sifflante"],
 ["intestin_irritable","irritable-bowel-syndrome-ibs/symptoms","Douleur abdominale|Ballonnements|Diarrhée|Constipation"],
 ["endometriose","endometriosis","Douleur pelvienne|Règles douloureuses|Douleur lombaire"],
 ["migraine","migraine","Mal de tête|Douleur pulsatile|Sensibilité à la lumière|Nausées|Vomissements"],
 ["grippe","flu","Fièvre|Frissons|Courbatures|Fatigue|Toux|Mal de tête|Mal de gorge"],
 ["rhume","common-cold","Nez qui coule|Nez bouché|Éternuements|Mal de gorge|Toux"],
 ["rhinite_allergique","allergic-rhinitis","Éternuements|Yeux qui démangent|Yeux qui coulent|Nez qui coule|Nez bouché"],
 ["conjonctivite","conjunctivitis","Yeux rouges|Yeux qui démangent|Yeux qui coulent|Sécrétions oculaires collantes"],
 ["infection_urinaire","urinary-tract-infections-utis","Brûlure en urinant|Envies fréquentes d’uriner|Sang dans les urines|Douleur du flanc|Fièvre"],
 ["hernie_discale","sciatica","Douleur descendant dans une jambe|Fourmillements des pieds|Engourdissement des pieds|Douleur lombaire"],
 ["neuropathie_diabetique","peripheral-neuropathy","Fourmillements des pieds|Engourdissement des pieds|Brûlures des pieds"],
 ["eczema","atopic-eczema","Démangeaisons de la peau|Peau sèche|Plaques inflammatoires"],
 ["pied_athlete","athletes-foot","Démangeaisons entre les orteils|Peau fissurée entre les orteils"]
].map(([id,source,terms])=>({id,source:'https://www.nhs.uk/conditions/'+source+'/',terms:terms.split('|')}));
export function correspondances(signs,diabete=""){
 return rules.map(rule=>({...rule,hits:rule.terms.filter(s=>signs.has(s))})).filter(rule=>rule.hits.length>=2 && (rule.id!=="neuropathie_diabetique" || diabete==="Oui") && (rule.id!=="hernie_discale" || signs.has("Douleur descendant dans une jambe"))).sort((a,b)=>b.hits.length-a.hits.length);
}
export function urgence(signs){
 return ["Mal de tête brutal et intense","Difficulté respiratoire sévère","Faiblesse soudaine d’un côté","Trouble soudain de la parole","Douleur thoracique persistante","Perte soudaine de vision"].some(s=>signs.has(s)) || (signs.has("Fièvre")&&signs.has("Raideur de nuque"));
}

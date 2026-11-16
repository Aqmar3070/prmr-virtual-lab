# PRMR-R02 — Recherche computationnelle originale de combinaisons moléculaires

**Date :** 16 novembre 2026. **Programme :** PRMR-R01, maladie rénale chronique, inflammation et fibrose. **Étape :** préclinique `in silico` exploratoire ; **aucun test sur des animaux ou des cellules n'a été exécuté**.

## Question expérimentale

À partir de structures et mécanismes individuels de médicaments existants, quelles combinaisons de deux et trois molécules méritent d'être soumises à une validation biologique ultérieure sur des mécanismes différents et des critères de sécurité connus ?

La recherche R02 a été exécutée indépendamment des résultats des trois études de combinaisons animales archivées dans R01. Elle n'utilise ni effets de ces associations, ni taux de survie déjà mesurés, ni hypothèse d'efficacité issue de ces études pour fixer son score.

## Sources unitaires

Structures chimiques, formules et identifiants : pages PubChem CIDs **3749** (irbesartan), **3961** (losartan), **9887712** (dapagliflozine), **11949646** (empagliflozine), **40632** (pirfénidone), **4740** (pentoxifylline), **10096344** (linagliptine), **443872** (éplérénone), **5281104** (paricalcitol) et **135401907** (allopurinol).

Mécanismes et limites :
- RAS/ARB, SGLT2, antagonistes de minéralocorticoïdes : contexte des recommandations rénales KDIGO 2024, https://kdigo.org/guidelines/ckd-evaluation-and-management/ . Attention : l'éplérénone ne bénéficie pas automatiquement des mêmes indications que la finérénone.
- Pirfénidone : action antifibrosante suggérée, mécanisme exact non complètement déterminé, indication établie *pulmonaire* et non rénale ; précautions hépatiques et rénales. https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=73db516f-8c80-431f-8190-33081718cf8d
- Pentoxifylline : propriétés hémorhéologiques et modulation de l'inflammation, élimination urinaire de métabolites dont l'exposition augmente avec l'insuffisance rénale. https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b0d1d50f-9023-4e2f-889f-a5febba70fa5
- Linagliptine : DPP-4, principalement gestion de la glycémie ; aucune efficacité de guérison rénale imputée. https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c797ea5c-cab7-494b-9044-27eba0cfe40f
- Éplérénone : potentiel d'hyperkaliémie, contre-indications rénales et interactions CYP3A. https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b0886e4e-5710-4053-9270-4d7de34068e7
- Paricalcitol : activation du récepteur de la vitamine D selon un contexte minéral, risque d'hypercalcémie et d'hyperphosphatémie. https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=664253fb-d99d-4af6-971b-95c0087406d9
- Allopurinol : inhibition de la xanthine oxydase ; l'essai CKD-FIX n'a pas montré de ralentissement de perte du DFG en maladie rénale chronique sans goutte. https://www.nejm.org/doi/full/10.1056/NEJMoa1915833

Ces sources documentent les **molécules prises individuellement** ou les règles générales de sécurité. Elles ne sont pas des observations de R02 chez un animal traité par une combinaison.

## Procédure réellement exécutée

1. Lecture et validation chimique des dix SMILES PubChem dans **RDKit 2025.09.4**, environnement Python hors réseau.
2. Calculs : masse moléculaire, cLogP Crippen, TPSA, donneurs/ accepteurs de liaisons hydrogène, liaisons rotatables, formule brute.
3. Génération des empreintes de Morgan (rayon 2, 2048 bits) et indices de similarité Tanimoto des 45 paires de structures distinctes. La similarité structurale n'est **pas** une interaction pharmacologique.
4. Génération exhaustive des 45 paires et 120 triples possibles dans cet ensemble de dix molécules (165 combinaisons sans ordre).
5. Identification d'axes mécanistiques et application de filtres méthodologiques explicitement hypothétiques :
   - répétition de la même classe pharmacologique (ARB+ARB ou SGLT2+SGLT2) : suspendue ;
   - allopurinol : suspendu pour l'objectif général « ralentir la progression MRC » en l'absence d'indication de goutte ;
   - paricalcitol : suspendu sans phénotype de trouble minéral préalablement défini ;
   - éplérénone : suspendue par prudence sans fonction rénale et kaliémie caractérisées, non assimilée à une interdiction universelle ;
   - les autres associations retenues restent **non évaluées sur la sécurité réelle**.
6. Classement documentaire non pharmacologique : poids d'axes **SRAA 2**, **SGLT2 2**, **fibrose 1,5**, **inflammation 1,5**, **DPP4 0,6**, **MR 0,4**, **VDR 0,1**, **XOR 0**. Pénalités de vigilance : pirfénidone 0,45, pentoxifylline 0,50, linagliptine 0,35, éplérénone 1,50, paricalcitol 2,00, allopurinol 3,00. Troisième molécule : pénalité additionnelle 0,4. Bonus structurel : 0,2 × (1 − Tanimoto moyen).
7. Test de sensibilité des poids exploratoires et pénalités : 2 000 réévaluations déterministes avec variation de ±20 % ; générateur Python `Random(260116)`. Ce test ne simule pas l'incertitude biologique.

**Équation** : indice = somme des poids d'axes représentés + 0,2 × diversité structurale − somme des pénalités de vigilance − 0,4 par agent au-delà de deux.

Ce score est **inventé uniquement pour organiser un criblage de projets**. Son échelle, ses chiffres et ses classements ne sont pas calibrés sur des réductions de fibrose, un DFG, des effets secondaires, des toxicités ou une survie animale.

## Résultats computationnels vérifiés

- Dix structures valides RDKit.
- 45 associations binaires + 120 associations ternaires = **165 combinaisons**.
- **121** associations écartées ou conditionnelles, **44** hypothèses ouvertes pour évaluation ultérieure.
- Similarité Morgan Tanimoto (r=2, 2048 bits) : irbesartan/losartan **0,5139** ; dapagliflozine/empagliflozine **0,6613** ; irbesartan/dapagliflozine **0,1183** ; pirfénidone/pentoxifylline **0,1273**.
- La liste exhaustive, les caractéristiques de chacune des dix molécules, les 45 similarités par paire et tous les indices sont consignés dans `research-data/prmr-r02-screen.json`.

### Hypothèses principales — modalités expérimentales encore inconnues

**R02-A** : irbesartan + dapagliflozine + pirfénidone. Indice d'exploration **4,829**. Trois axes heuristiques distincts. Hypothèse falsifiable : l'ajout d'une composante antifibrosante pourrait modifier la transcription fibrotique (COL1A1, FN1, ACTA2) dans un modèle rénal pertinent, à viabilité préservée, comparativement aux agents seuls et aux paires. Risques à élucider : exposition rénale/hépatique à la pirfénidone, mécanismes insuffisamment définis, absence de bénéfice démontré sur l'organe ciblé.

**R02-B** : irbesartan + dapagliflozine + pentoxifylline. Indice **4,780**. Hypothèse falsifiable : l'ajout d'une composante de modulation inflammatoire pourrait affecter des signaux NF-κB, IL-6 et CCL2, à viabilité préservée. Risque à élucider : accumulation de métabolites rénaux et effets pharmacologiques/ hémodynamiques.

**Autres hypothèses moins prioritaires au sens du barème :** irbesartan + dapagliflozine + linagliptine (indice 4,028) ; dapagliflozine + pirfénidone + pentoxifylline (3,832).

Les axes qui incluent une composante déjà recommandée dans certaines populations (ARB/SGLT2) ne prouvent pas que l'ajout d'un troisième agent apporte quelque chose. L'analyse chimique **ne démontre ni synergie ni additivité pharmacodynamique**, ne calcule pas ADMET, ne fournit aucune dose humaine ou animale, et ne prédit aucune guérison.

### Sensibilité du classement

Parmi les dix triples composés des cinq représentants irbesartan, dapagliflozine, pirfénidone, pentoxifylline et linagliptine :
- R02-A première : **1 161 / 2 000** variations, soit **58,05 %**.
- R02-B première : **839 / 2 000**, soit **41,95 %**.

Ces fréquences ne mesurent pas une chance de succès, seulement la stabilité relative des poids arbitraires choisis pour ordonner ces dix hypothèses.

## Contrôles de qualité et reproduction

- Script Python **research-tools/prmr_r02_validate.py** : revalide SMILES, formules, descripteurs, similarités Morgan, indices, rangs et statuts. Requiert RDKit 2025.09.4.
- Script Python **research-tools/prmr_r02_sensitivity.py** : recalcule les 2 000 scénarios de pondération.
- Tests Node **tests/screening.test.mjs** : exhaustivité du registre, filtrage, sources et assertions d'absence de résultats biologiques fictifs.
- Fichier de référence **research-data/prmr-r02-screen.json** ; interface publique **screening.html**.

## Interprétation et prochaines expériences réellement nécessaires

**Le programme R02 est terminé au stade computationnel.** Aucune donnée de viabilité cellulaire, de protéinurie expérimentale, de DFG, de toxicité animale, de fibrose tissulaire ou de guérison n'a été obtenue.

Une validation préclinique indépendante devrait commencer par un modèle cellulaire rénal et/ou organoïde approprié, avec bras témoin, chaque agent seul, les paires et l'association triple, lectures de toxicité/viabilité et marqueurs d'inflammation/fibrose, réplications biologiques, analyse préspécifiée et critères d'arrêt. La preuve de synergie nécessiterait un modèle expérimental validé (Bliss ou Loewe) et des intervalles d'incertitude. Si cette phase est positive, le passage à l'animal exige justification du modèle, protocole autorisé, préenregistrement, calcul de taille d'échantillon, randomisation, aveugle, critères de santé et respect des 3R. Rien de ceci n'a encore été effectué par PRMR.

## Version compréhensible par un enfant

Nous avons étudié dix médicaments déjà existants et calculé 165 façons de les regrouper. L'ordinateur a montré leurs différences chimiques. Certaines associations semblent intéressantes pour préparer des expériences, mais **nous ne savons pas si elles aideront réellement les reins ou si elles sont dangereuses ensemble**. Il faut encore de vrais essais en laboratoire. Nous n'avons pas guéri de souris.

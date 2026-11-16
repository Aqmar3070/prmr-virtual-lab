# PRMR-R03 — Étude computationnelle PK/PD et signaux toxicologiques chez des analogues de rongeurs
**Date scientifique : 16 novembre 2026 — Version r03-conditional-exposure-v1.0.**

## Statut d'intégrité
**Travail original exécuté :** stress-test numérique reproductible. **Aucune expérience animale ni culture cellulaire**, aucun dosage administré, aucune analyse de sang ou histologie réalisée, aucune probabilité de toxicité ou de guérison estimée.

**Il n'existe pas de « guérison certaine, même hypothétique »** : une hypothèse de guérison peut être formulée et falsifiée, jamais comptée comme un résultat avéré. PRMR-R03 ne produit aucune prédiction biologique de guérison.

La demande de tester « tous les facteurs » est mathématiquement et expérimentalement impossible sans données propres aux espèces, génotypes, individus, concentrations tissulaires et mécanismes des médicaments combinés. Le registre ci-dessous sépare les facteurs simulés, évalués qualitativement et non quantifiés.

## Question
Parmi trois combinaisons découlant du criblage original PRMR-R02 — irbesartan + dapagliflozine (référence double), R02-A (+ pirfénidone) et R02-B (+ pentoxifylline) — dans quels scénarios de physiologie des souris et des rats les signaux d'exposition relative rénale et hépatique sont-ils les plus préoccupants, compte tenu des incertitudes interespèces ?

## Hiérarchie des sources
1. **Expositions réellement mesurées chez des personnes, sources pharmaceutiques** : pirfénidone, pentoxifylline, dapagliflozine. Ce ne sont pas des mesures chez les animaux de R03, ni sous triple association.
2. **Puissance in vitro mesurée** : inhibition SGLT2 de dapagliflozine (IC50) sur transporteurs murin et rat, non effet de guérison.
3. **Hypothèses mathématiques PRMR-R03** : transfert interespèces, allométrie, facteurs de stress aléatoires, composition du modèle. Aucune calibration sur des données d'efficacité animale.
4. **Non disponible** : exposition absolue des quatre molécules à des doses combinées, ADMET de la combinaison, interactions métaboliques, probabilité de lésion rénale/hépatique, probabilité de récupération complète.

Références :
- Pirfénidone SmPC : https://www.medicines.org.uk/emc/product/13875/smpc
- Pentoxifylline DailyMed : https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b0d1d50f-9023-4e2f-889f-a5febba70fa5
- Dapagliflozine SmPC : https://www.medicines.org.uk/emc/product/7607/smpc
- Irbesartan DailyMed : https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=professional&setid=2113a901-2612-4557-b86d-3afc006fb8bb
- Dapagliflozine pharmacologie animal SGLT2 : https://journals.sagepub.com/doi/full/10.1177/1091581813505331
- Allométrie et limites : https://pmc.ncbi.nlm.nih.gov/articles/PMC11782306/
- ARRIVE 2.0 : https://pmc.ncbi.nlm.nih.gov/articles/PMC7610906/

## Les données réellement observées, distinctes de la simulation
Toutes les AUC relatives concernent des adultes humains :
- Pirfénidone métabolite 5-carboxy : AUC moyenne 28,7 à fonction rénale normale ; 49,3 légère ; 100 modérée ; 168 sévère (mg·h/L), soit rapports 1,00 ; 1,72 ; 3,48 ; 5,85. Petits effectifs par groupe (6).
- Pirfénidone *parent* : hausse moyenne d'AUC de 60 % en atteinte hépatique modérée (rapport 1,60). Maladie hépatique sévère : situation contre-indiquée dans le SmPC cité, sans extrapolation.
- Pentoxifylline métabolite V : AUC ×2,4 en atteinte rénale légère/modérée, ×12,9 en atteinte rénale sévère, sous régime de libération prolongée précis ; ces ratios ne sont pas des mesures rénales animales.
- Pentoxifylline *parent* : AUC ×6,5 en insuffisance hépatique légère/modérée ; pas de mesure permettant extrapolation hépatique sévère.
- Dapagliflozine *parent* : exposition systémique ↑32 %, ↑60 %, ↑87 % en atteinte rénale légère, modérée, sévère, respectivement (rapports 1,32 ; 1,60 ; 1,87).
- Irbesartan : exposition peu affectée par insuffisance rénale ou cirrhose légère/modérée dans le cadre de l'étiquetage, mais les risques de déplétion, hypotension et hyperkaliémie nécessitent une analyse PD indépendante.
- Inhibition de SGLT2 par dapagliflozine in vitro : IC50 souris 2,3 nM ; rat 3,0 nM (transporteurs surexprimés). Ces valeurs ne sont pas des concentrations libres rénales mesurées.

**Ne jamais comparer ×12,9 pour un métabolite avec ×5,85 pour un autre comme si cela était une mesure commune de toxicité.** Ces facteurs mesurent des modifications d'exposition, non la nocivité par unité d'exposition.

## Physiologies animales et échantillonnage réellement exécutés
Espèce : C57BL/6 *analogue* (souris 18/25/35 g) et Sprague–Dawley *analogue* (rat 180/250/400 g). Quatre états rénaux (normal, léger, modéré, sévère), trois hépatiques (normal, modéré, sévère), deux états d'hydratation (normal, déplétion). **2 × 3 × 4 × 3 × 2 = 144 profils.** Trois associations dans chaque profil : **432 évaluations de combinaison**.

**Variables non numériquement calibrées :** âge, sexe, composition grasse, albumine, hormones, maladies infectieuses concomitantes, transporteurs, isoenzymes, génome, souche réelle, glycémie, régime alimentaire, métabolites combinés, perfusion tissulaire, pH, voies biliaires et interactions médicamenteuses. La page permet d'afficher ces facteurs pour signaler leur absence de calibration ; elle ne leur assigne pas de faux coefficients.

## Modèle : ce qui est calculé
- Approximation AUC ≈ biodisponibilité × dose / clairance, sans doses prescrites ni concentrations plasmatiques réelles.
- À titre **exploratoire**, à dose nominale égale par masse (mg/kg), clairance ≈ masse^0,75 implique rapport AUC ≈ (masse/masse de référence)^0,25. L'exposant universel est controversé et non validé dans ces médicaments à l'intérieur des espèces.
- Les rapports AUC humains par degré de dysfonction sont uniquement des « ancres » d'exposition **extrapolées par scénarios d'incertitude**, pas de la PK animale calculée selon des compartiments physiologiques :
  rapport simulé = (rapport AUC humain)^(coefficient de transfert) × (masse/masse de référence)^(exposant de sensibilité) × (facteur résiduel).
  Coefficient de transfert uniforme **0,5 à 1,5**, exposant **0,15 à 0,35**, facteur résiduel **0,85 à 1,15**. **Ces distributions ont été choisies arbitrairement** par l'analyse et ne sont estimées sur aucune observation animale.
- **1 000 tirages reproductibles par marqueur par profil**, générateur xorshift32 initialisé par empreinte du scénario. Résumé par médiane, 5e/95e percentiles, fraction des tirages dépassant une AUC ×2 ou ×5.
- Les seuils ×2 et ×5 servent à décrire le stress-test **et ne correspondent à aucun seuil toxicologique validé**. Les fractions obtenues ne sont pas des probabilités de lésion, de mortalité, de toxicité ou d'absence de toxicité.
- **Foie sévèrement altéré : aucun rapport simulé**, la référence ne justifiant pas d'extrapolation. **Foie + rein** : les marqueurs de molécules/métabolites différents sont présentés séparément et ne sont pas multipliés.
- Déshydratation : alerte hémodynamique qualitative identique sous les trois schémas partageant ARB + SGLT2, sans multiplicateur de concentration.
- Pharmacodynamie calculée seulement pour SGLT2 à concentration libre hypothétique C : inhibition illustrative = C/(IC50+C), pour C = 1, 3, 10 nM. Aucune translation dose–concentration–effet rénal.

## Résultat numérique de référence (validé par GitHub Actions)
Analogue souris, **25 g**, rein **sévèrement altéré**, foie **modérément altéré**, hydratation conservée :
- **R02-A**, métabolite 5-carboxy pirfénidone : médiane **×5,832**, échantillonnage 5–95 % **×2,528–×13,063**, fraction >×5 **0,587**. Pirfénidone parent avec atteinte hépatique : médiane **×1,590**, 5–95 % **×1,222–×2,068**.
- **R02-B**, métabolite V pentoxifylline : médiane **×12,712**, échantillonnage 5–95 % **×3,975–×40,116**, fraction >×5 **0,860**. Pentoxifylline parent avec atteinte hépatique : médiane **×6,779**, 5–95 % **×2,808–×15,391**.
- Ces chiffres sont propres à la **formule illustrative PRMR**. La comparaison des expositions de molécules différentes n'autorise pas à hiérarchiser leur toxicité réelle.

## Balance risque–bénéfice conditionnelle
- **R02-DUO (irbesartan + dapagliflozine)** : aucun troisième agent exploratoire, mais risques hémodynamiques, pression artérielle et potassium. Bénéfice rénal de l'association dans le modèle animal R03 : non mesuré.
- **R02-A (+ pirfénidone)** : hypothèse de modulation antifibrotique ; nécessité d'une mesure biologique d'amélioration des marqueurs et de la fonction rénale, de l'ALT/AST, de l'exposition parent + métabolite. Risque hépatique et accumulation rénale connus qualitativement.
- **R02-B (+ pentoxifylline)** : hypothèse de modulation inflammatoire ; importance de caractériser M5 en insuffisance rénale, M1 et parent en maladie hépatique, ainsi que les effets hémodynamiques et hémorragiques.
- **Avantage net individuel : INCONNU** pour toutes les triples combinaisons. Aucun calcul ne justifie une recommandation de ces molécules, ni une qualification « guérison probable » ou « certaine ».

R02-B constitue le **signal d'exposition le plus fort** sous défaillance rénale/hépatique dans les rapports disponibles, mais cela **ne démontre pas** qu'elle provoque plus de lésions qu'une autre molécule. Le candidat le plus raisonnable *à tester ensuite sur des modèles cellulaires* dépend du phénotype rénal et des objectifs mécanistiques ; aucune association triple n'est validée en clinique ou en animal par R03.

## Hypothèse d'une véritable rémission / guérison et sa falsification
**Hypothèse prospective (non observation)** : une association qui modifie plusieurs voies pourrait, dans une maladie rénale **réversible et non génétique**, réduire durablement inflammation et fibrose, puis maintenir une filtration rénale normalisée **après arrêt du traitement** sans lésion hépatique, rénale ou autre. Dans une maladie génétique du collagène ou une néphropathie terminale avec perte de néphrons, ces mécanismes ne démontrent pas le remplacement du tissu perdu ou une correction génétique.

**Critères à préenregistrer** :
1. Précondition : un système cellulaire, organoïde ou modèle animal dont la maladie et sa réversibilité sont définies, avec autorisation éthique.
2. Contrôles : témoin sain, malade non traité, traitement individuel, doubles et triples ; randomisation/aveugle dès les expérimentations animales.
3. Fonction : DFG mesuré, albuminurie/protéinurie et perfusion ; histologie quantitative interstitielle et glomérulaire ; marqueurs collagène, inflammation et viabilité.
4. Toxicocinétique : parent et principaux métabolites, concentration plasmatique/tissulaire, biomarqueurs hépatiques ALT/AST et biliaires, potassium, pertes hydriques, pression artérielle, lésions tubulaires KIM-1/NGAL et mortalité.
5. Critère de « rémission prolongée » : amélioration persistante sans traitement, pas de rebond, absence de toxicité cliniquement significative ; « guérison » requiert démonstration complète et réplicable, pas seulement un score biochimique.

Une estimation de **P(toxicité)** nécessitera enfin des données calibrées dose–exposition–événement dans le modèle spécifique, des taux de lésions sur plusieurs niveaux de doses, un modèle statistique validé et des intervalles d'incertitude externes.

## Fichiers, reproduction et statut
- Interface : \`risk-r03.html\`, génératrice de 144 profils côté navigateur.
- Moteur : \`src/r03_model.mjs\` (ES module Node/navigateur).
- Tests automatiques : \`tests/r03.test.mjs\`, incluant contrôle que toutes les probabilités de toxicité, efficacité et guérison restent **null**.
- Archivage prévu dans le workspace privé Supabase PRMR-R01 via \`simulation_runs\`, avec provenance \`calculated:conditional_exposure_not_toxicity_probability\`.
- Antérieurs : \`docs/PRMR_R02_RESEARCH_LOG.md\` et \`docs/PRMR_R01_RESEARCH_LOG.md\`.

## Version enfant
On compare deux sortes de petits animaux. Chaque animal peut avoir un poids différent et des reins ou un foie plus ou moins abîmés. Certains médicaments ou substances issues de leur transformation peuvent alors rester davantage dans le corps. Nous avons calculé des **situations possibles**, sans vraiment soigner d'animaux. Les calculs montrent où il faudrait être prudent. Ils ne permettent pas de dire qu'un animal sera empoisonné ou guéri.

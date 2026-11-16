# PRMR-R01 · Journal de recherche préclinique rénale
Date d'analyse : 16 novembre 2026. Statut : **revue bibliographique ciblée**, non exhaustive.
**Aucune expérience animale n'a été menée par PRMR.** Les résultats sont repris des publications originales ; aucune valeur de « guérison » n'a été inférée.

## Contexte récupéré dans le laboratoire
Projet privé existant : **PRMR-R01 — Recherche rénale**, inscrit dans l'espace Supabase. Champ de recherche : maladie rénale chronique, inflammation, fibrose, protection et réparation. Les moteurs actuels (RDKit.js et PK/PD un compartiment) ne disposent **d'aucune validation prédictive de guérison**, ne sont pas un modèle mécanistique rénal et ne permettent pas de calculer la synergie clinique de molécules.

## Question de recherche
Les associations de molécules pharmacologiques existantes présentent-elles des bénéfices précliniques mesurés sur la survie, la protéinurie, les lésions et la fibrose rénale, comparées à un témoin ou aux molécules seules ?

## Recherche et sélection documentaire
Recherche manuelle ciblée dans PubMed, PMC et pages de revues scientifiques, effectuée le 16/11/2026. Termes regroupés : `finerenone empagliflozin rat preclinical kidney`, `Alport Col4a3 mice ramipril empagliflozin finerenone randomized trial`, `valsartan empagliflozin mRen2 diabetic rats albuminuria`. Les identifiants PMID et DOI ont été confrontés aux articles originaux.

**Inclusion** : résultats expérimentaux publiés chez des animaux, au moins une association de molécules déjà connues, comparateur explicite, critère fonctionnel ou histologique rénal. **Exclusion de ce dossier** : essais cliniques humains (ne répondent pas au premier objectif animal), modélisations virtuelles non validées, articles présentant uniquement des hypothèses et extrapolations de guérison sans mesure. Trois études ont été retenues comme cas de référence. **Il n'y a ni journal exhaustif de tous les résultats recherchés, ni diagramme PRISMA, ni protocole de revue systématique** ; il serait incorrect de qualifier ce travail de méta-analyse ou de revue exhaustive.

## Étude R01-01 — Souris : triple thérapie et néphropathie d'Alport
- **Référence** : Zhu Z et al., *J Am Soc Nephrol*. 2023;34:1513–1520. PMID 37428955. DOI 10.1681/ASN.0000000000000186. https://pubmed.ncbi.nlm.nih.gov/37428955/
- **Modèle** : 80 souris Col4a3−/−, 40 mâles et 40 femelles ; maladie rénale progressive monogénique.
- **Contrôle qualité** : étude préenregistrée PCTE0000266, randomisation en blocs, aveugle, quatre bras de 20 animaux, critère principal de survie prédéfini.
- **Comparateurs** : véhicule ; ramipril ; ramipril + empagliflozine ; ramipril + empagliflozine + finérénone.
- **Résultats** (survie moyenne ± écart-type, jours) : 63,7 ± 10,0 ; 77,3 ± 5,3 ; 80,3 ± 11,0 ; 103,1 ± 20,3. Gain descriptif triple vs véhicule : **39,4 jours**.
- **Autres données** : effet favorable de la triple association sur inflammation et fibrose rénale résiduelles ; histologie et transcription.
- **Conclusion PRMR** : prolongation nette de survie et atténuation de lésions expérimentales. **Aucune guérison** de la mutation ou de la maladie chronique n'est démontrée.
- **Limites** : progression accélérée sur fond génétique spécifique, impossibilité d'extrapoler un taux de guérison à l'humain.

## Étude R01-02 — Rats : finérénone + empagliflozine
- **Référence** : Kolkhof P et al., *Am J Nephrol*. 2021;52:642–652. PMID 34111864. DOI 10.1159/000516213. https://pubmed.ncbi.nlm.nih.gov/34111864/
- **Modèle** : rats femelles mRen2 hypertendus, atteintes cardiorénales induites, environ 13–17 animaux par groupe.
- **Comparateurs** : placebo, deux niveaux de finérénone, deux niveaux d'empagliflozine, association des doses basses, suivi jusqu'à sept semaines.
- **Résultats** : survie rapportée de **93 %** sous association vs **50 %** sous placebo ; baisse de **86 %** du rapport protéines/créatinine urinaire sous association après six semaines ; amélioration de la créatinine plasmatique et de paramètres histologiques rénaux.
- **Conclusion PRMR** : bénéfice préclinique rénal et cardiorénal significatif dans ce modèle. **Aucune guérison** démontrée.
- **Limites** : femelles seulement et modèle hypertensif ciblé ; affiliations industrielles Bayer de plusieurs auteurs, nécessité de réplication indépendante.

## Étude R01-03 — Rats : valsartan + empagliflozine
- **Référence** : Cruz-López EO et al., *J Hypertens*. 2024;42:883–892. PMID 38088400. DOI 10.1097/HJH.0000000000003633. https://pubmed.ncbi.nlm.nih.gov/38088400/
- **Modèle** : rats mRen2 hypertendus rendus diabétiques ; étude de quatre bras (véhicule, valsartan, empagliflozine, association).
- **Résultats** : diminution statistiquement significative de l'albuminurie uniquement avec la combinaison ; réduction associée de la glomérulosclérose ; **pas de changement de DFG** observé.
- **Conclusion PRMR** : intérêt potentiel de l'association dans ce modèle précis ; **pas de guérison ni de restauration fonctionnelle complète démontrées**.
- **Limites** : effectifs et paramètres détaillés à approfondir dans l'intégralité des tableaux et annexes ; pas de transfert automatique aux maladies rénales non diabétiques.

## Traçabilité et permanence
- Page visible et éducative : `preclinical.html`, accessible dans le menu et le tableau d'accueil de PRMR Virtual Lab.
- Trois enregistrements de référence dans Supabase `public.experiments`, liés au projet privé PRMR-R01, classés `evidence_type=external_reference`, avec `cure_demonstrated=false`. Leur statut `completed` signifie que les **études externes publiées** sont terminées, jamais que PRMR a réalisé ces expériences.
- Tests de cohérence documentaire : `tests/preclinical.test.mjs`, exécutés par GitHub Actions avec les tests existants.

## Conditions d'une véritable nouvelle expérimentation
Une comparaison réalisée par PRMR nécessiterait d'abord une hypothèse précise, une question d'espèce et de maladie, des évaluations pharmacologiques et de tolérance, la conception de groupes comparateurs et des analyses statistiques prospectives, un protocole préenregistré, les autorisations éthiques applicables, les principes de réduction, remplacement et raffinement (3R), un laboratoire agréé et des mesures expérimentales indépendantes. **Aucun nouvel essai animal ni aucune nouvelle donnée de guérison ne peuvent être annoncés ici.**

## Explication accessible
Des chercheurs ont donné à des animaux atteints de problèmes rénaux différents médicaments seuls ou associés. Pour certaines associations, les animaux ont vécu plus longtemps et leurs reins étaient moins abîmés. Cependant, ils n'ont pas démontré la disparition totale de la maladie. C'est une piste de recherche, pas une cure.

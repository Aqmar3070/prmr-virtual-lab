# PRMR-R05 — Finition professionnelle des cartes animales, visuels autonomes et simulation

**Date : 17 novembre 2026.** Poursuite de PRMR-R04 sans effacer les résultats R01–R04.

## Objectif et correction apportée

La version précédente recadrait des affiches PNG 16:9 pour prétendre en tirer des illustrations d'animaux. Ce procédé entraînait des fragments de texte, des morceaux de panneaux et des proportions incorrectes. R05 **supprime complètement cette pratique** des interfaces principales.

Les six portraits ne sont plus des fragments : ils ont été dessinés séparément en **SVG vectoriels de 840 × 560**, sans lettres, chiffres, bordures d'interface ou étiquettes incrustées. Ils sont utilisés directement dans les cartes d'espèces et dans la vue de profil via \`<img>\` et \`object-fit:contain\`, avec nom, nom latin et variables affichés dans des blocs HTML séparés.

Sources des fichiers :
- \`assets/animals/mouse.svg\` — souris.
- \`assets/animals/rat.svg\` — rat.
- \`assets/animals/pig.svg\` — porc / miniporc.
- \`assets/animals/dog.svg\` — chien.
- \`assets/animals/nhp.svg\` — primate non humain (macaque comme référence du modèle).
- \`assets/animals/rabbit.svg\` — lapin.

**Nature de ces images :** dessins vectoriels originaux à éclairage et ombres simulés, non photographies, non reconstructions d'imagerie, non anatomie morphométrique validée. La taille de l'animal ou la forme exacte des organes ne doivent pas être mesurées sur ces images.

## Nouvelle 3D autonome

Le module \`src/r05_animal3d.mjs\` calcule des maillages 3D lisses pour les six silhouettes au moyen d'ellipsoïdes et de points de surface. Il les affiche avec WebGL et un éclairage directionnel diffus, un liseré de lumière et des reflets spéculaires, sans bibliothèque extérieure. La rotation par pointeur/toucher permet d'observer leur volume. En cas d'absence de WebGL, le profil utilise l'image SVG entière en remplacement.

L'éclairage, les ombres et les géométries sont **artistiques et éducatifs**, sans lien avec une simulation physiologique réelle ni preuve de toxicité d'organe. Les visualiseurs rénaux antérieurs sont conservés ; les quatre conformères moléculaires réellement calculés par RDKit restent des modèles 3D de chimie structurale, pas de liaison pharmacologique validée.

## Architecture / lisibilité

- \`src/r04_atlas.mjs\` : sélecteur de six cartes animales contenant des \`img\` indépendants, libellés HTML hors des images, profil WebGL avec repli SVG ; état unique de la simulation R04.
- \`r04-atlas.css\` : supprimer les fonds \`background-size:470%\` / \`650%\` / \`900%\` issus de posters ; fixer une grille adaptable avec aspect ratio, \`contain\`, espacements et retour à la ligne des libellés. Les titres du profil se trouvent dans un bloc **sous** l'image, sans superposition.
- \`src/r04_app.mjs\` : les petits sélecteurs de R04 utilisent aussi les SVG autonomes ; la grande vue d'organisme utilise la sculpture WebGL, avec fallback à la scène 3D précédente en cas d'indisponibilité du contexte.
- Tous les modules de l'accueil, de R01, R02 et R03 qui partagent \`createVisualAtlas\` héritent des corrections.
- Les paramètres sont éditables dans un panneau principal comprenant les contrôles rapides (âge, sexe, maladie, état rénal) et un volet avancé (constitution, foie, hydratation, association, masse, concentration SGLT2 théorique). Les variables non calibrées ne modifient pas artificiellement les valeurs numériques.

## Intégrité des données

**Pas de nouvelle étude animale physique, pas de modèle PBPK calibré, pas de prédiction de guérison.** Les marqueurs AUC utilisés dans les graphiques restent issus des données humaines et de l'exploration de sensibilité R03. Les valeurs de référence sont différenciées par analyte : elles ne sont pas des taux de toxicité comparables. Le réemploi chez d'autres espèces est une hypothèse mathématique, pas une mesure animale.

Les six anciennes affiches PNG restent archivées sous \`assets/illustrations/r04\` avec leurs SHA256 comme sources historiques ; elles ne sont plus utilisées par les cartes ou les profils.

## Tests et contrôle visuel

- \`tests/r04_atlas.test.mjs\` : six fichiers propres, aucun texte SVG, suppression des anciens recadrages, 3D WebGL avec fallback et connexion au moteur.
- \`tests/r04_original_images.test.mjs\` : conservation des six archives sources mais suppression de leur présence dans les vues actives.
- \`tests/r04_browser_smoke.cjs\` : Chromium desktop et mobile, chargement réel de six illustrations distinctes, clic sur porc / chien, état physiologique mis à jour, quatre molécules 3D, absence de titre tronqué et débordement horizontal.
- \`.github/workflows/ui-smoke.yml\` : captures des interfaces desktop et mobile publiées dans un artefact GitHub Actions pour inspection du rendu réel.

Le registre doit refléter l'état des tests et de la publication vérifiés à l'issue des actions GitHub, jamais par anticipation.

## Pour les enfants

Avant, on voyait des morceaux d'une grande affiche, parfois avec des lettres coupées. Maintenant chaque animal possède son propre dessin entier, avec son nom écrit séparément et un modèle 3D qu'on peut tourner. On peut changer certaines données du scénario et observer ce que l'ordinateur calcule réellement. Quand une information scientifique manque, l'application ne doit pas l'inventer.

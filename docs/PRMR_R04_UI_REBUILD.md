# PRMR — Refonte intégrée du laboratoire 3D (17 novembre 2026)

## Décision de conception

À la demande de l'utilisateur, les **anciens portraits animaux, la galerie d'affiches accolée aux pages et les anciennes vignettes chimiques 2D** sont retirés des panneaux principaux. Les visuels originaux du programme PRMR sont désormais **des matériaux graphiques intégrés à des composants HTML interactifs** et non une suite d'images PNG collées.

L'application conserve son infrastructure GitHub Pages, ses outils RDKit.js et son cloud Supabase, ainsi que les résultats précédemment tracés R01/R02/R03/R04.

## Pages remaniées

- **Accueil principal** \`index.html\` et \`research.html\` : la vue générale est dominée par le nouveau poste interactif de choix d'espèce, portrait, données physiologiques, diagramme d'exposition, rein orientable en 3D et cartes de molécules 3D. L'ancienne promotion « galerie des six images » et l'ancienne zone d'accueil générique ont été remplacées. Les workflows et la connexion privée demeurent accessibles.
- **PRMR-R04** \`species-r04.html\` : suppression de la galerie d'affiches indépendantes et de l'ancien atlas fondé sur des portraits Wikimedia externes ; reconstruction avec le même poste interactif relié aux onze variables de physiologie déjà disponibles. Les sélecteurs d'animaux du panneau latéral utilisent également les nouveaux visuels PRMR. Le moteur de calcul \`src/r04_engine.mjs\` n'est pas remplacé par un modèle fictif.
- **R03** \`risk-r03.html\` : retrait du poster PK/PD décoratif ; insertion du poste interactif au début des travaux R03. Le modèle historique d'exposition rodent R03 demeure disponible plus bas.
- **R02** \`screening.html\` : nouvelles visualisations de molécules 3D et comparaison animale interactive, avec conservation du registre original des 165 associations.
- **R01** \`preclinical.html\` : insertion du poste pour explorer le contexte animal, tout en préservant la distinction des trois études publiées comme « références externes », non expériences PRMR.
- **Atelier moléculaire principal** : nouvelles cartes 3D RDKit orientables dans la vue « Atelier moléculaire » ; cliquer sur l'une transfère nom et SMILES de référence à l'éditeur existant. L'éditeur 2D reste disponible pour les structures libres dont la conformation 3D n'est pas calculée, sans les présenter comme des mesures biologiques.

## Graphiques et visualisations

- Les six images originales de \`assets/illustrations/r04\` demeurent dans le dépôt, avec un contrôle cryptographique. Les zones artistiques des posters sont **recadrées avec des fonds CSS** pour les cartes souris, rat, miniporc, chien, macaque et lapin. Les chiffres éventuellement imprimés dans les posters ne sont plus utilisés dans la couche interactive.
- Les **vrais textes, menus, indicateurs, tableaux et graphiques** sont générés à partir des données du moteur \`computeR04()\`, pas extraits des affiches.
- Les graphiques HTML/SVG recalculent les indicateurs d'exposition relative à partir des paramètres modélisés. **Ils n'estiment pas une toxicité réelle**.
- Le rein est dessiné via un moteur 3D Canvas orientable. Le second visualiseur d'organisme possède maintenant six géométries animales procédurales distinctes (têtes, oreilles, membres, museaux, queues et marqueurs d'organes), et ne reprend pas l'ancienne forme anatomique générique. **Ce sont des sculptures conceptuelles, pas des scans, pas des modèles physiologiques validés et pas des jumeaux numériques.**
- Les structures 3D de quatre agents (irbesartan, dapagliflozine, pirfénidone, pentoxifylline) sont des conformères construits par RDKit ETKDG/MMFF, importés des coordonnées du registre R04. Orientation par pointeur/toucher, sans nouvelle simulation de liaison avec une cible.

## Unicité des états

Le module partagé \`src/r04_atlas.mjs\` expose \`createVisualAtlas({onChoose,onEdit,getResult,hostId})\`, qui est réutilisé :

1. Dans R04 avec le même \`state\` et \`update()\` que les contrôles physiologiques complets ; choisir une espèce change sa masse de référence, l'anatomie et les graphiques modélisés.
2. Sur l'accueil, R01, R02 et R03 via \`src/r04_embedded.mjs\`, avec des états de démonstration distincts à chaque page (pas de synchronisation inter-onglets revendiquée).
3. Dans la vue de chimie de l'accueil via \`src/r04_molecule_deck.mjs\`, avec un branchement au champ SMILES et à RDKit.js si ce moteur est chargé.

Les variables âge/sexe/constitution/maladie sont montrées comme telles. Certaines changent les textes de profil et les critères de mesure, sans fausse variation numérique, parce qu'aucun coefficient PK validé par espèce, sexe et âge n'est disponible pour les associations. Poids et état rénal modifient les **scénarios mathématiques conditionnels** définis dans R03/R04. Les différences d'espèce changent notamment l'architecture documentaire et la disponibilité d'une IC₅₀ SGLT2.

## Architecture du code

- \`src/r04_atlas.mjs\` : composant de présentation interactive commun, édition des variables, portraits originaux recadrés et SVG d'exposition.
- \`r04-atlas.css\` : identité visuelle teal/cyan, cartes, grilles adaptatives et intégration des illustrations PRMR.
- \`src/r04_embedded.mjs\` : pilotage de la présentation dans l'accueil, R01/R02/R03, indépendamment des moteurs spécifiques.
- \`src/r04_app.mjs\` : connexion au moteur R04, sélecteurs et ateliers moléculaires spécialisés.
- \`src/r04_visuals.mjs\` : projection 3D native Canvas, sculptures anatomiques conceptuelles différenciées et conformères chimiques.
- \`src/r04_molecule_deck.mjs\` : remplacement des anciennes vignettes du module moléculaire principal par des contrôles 3D.
- \`research-data/r04_molecular_3d.json\` : quatre conformères RDKit et leurs liaisons atomiques.
- \`research-data/prmr-r02-screen.json\` : identités et SMILES de dix agents, provenance chimique.
- \`assets/illustrations/r04/*.png\` : images originales ; SHA256 vérifiés.
- \`tests/r04_atlas.test.mjs\`, \`tests/r04_gallery_visible.test.mjs\`, \`tests/r04_original_images.test.mjs\`, \`tests/r04.test.mjs\` : invariants et compatibilité du nouvel agencement.

## Distinction entre calcul et biologie

Aucun animal n'a été administré ou étudié physiquement par ces mises à jour. Les graphiques d'exposition et leur incertitude sont dérivés d'ancres humaines transférées avec une enveloppe **arbitraire** à des analogues animaux, sans calibration PBPK. Un autre choix d'espèce peut modifier sensiblement le métabolisme, l'hémodynamique ou les structures rénales ; **la réalité ni la direction d'un effet des triples R02-A/R02-B ne peuvent être déduites de cette interface**.

Aucune probabilité de néphrotoxicité, d'hépatotoxicité, de synergie, de rémission ou de guérison n'a été fabriquée. Les recherches originales R02/R03/R04 restent des hypothèses exploratoires *in silico*.

## Problèmes explicitement non résolus

- Les quatre conformères de référence ne couvrent pas à eux seuls les dix molécules du registre R02 ; l'éditeur de structures arbitraires conserve son rendu RDKit 2D.
- Les sculptures 3D d'animaux/reins sont conceptuelles, sans données morphométriques comparatives validées ; la PK réelle de chaque association sous chaque espèce et maladie n'a pas été calculée.
- Les calculs d'exposition de substances **différentes** ne peuvent pas être convertis en classement objectif de leur toxicité.
- Le navigateur conserve son propre état, sans persistance de la sélection d'espèce au cloud entre les modules. Le module privé antérieur n'a pas été supprimé.

## Vérification

Les tests automatiques GitHub Actions doivent être verts sur le dernier commit ; la dernière publication GitHub Pages doit être confirmée. Une URL avec paramètre de version peut contourner le cache de page du navigateur. Aucun essai de fonctionnement sur tous les navigateurs, tailles d'écran et appareils physiques n'est affirmé sans test correspondant.

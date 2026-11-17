# PRMR-R08 — Atlas transparent en grille 3D et organes internes

**Date : 17 novembre 2026.** Continuation de PRMR R01–R07. Cette version répond au changement de priorité : la visualisation d'organes internes est utile à la recherche rénale ; le simple habillage externe photo-texturé de R07 n'était pas adapté au poste scientifique.

## Décision

La grande case de profil animal du laboratoire partagé est maintenant un **atlas anatomique pédagogique transparent**. Elle ne charge plus de texture GLB et n'exige plus WebGL. Le corps, dessiné en grille filaire semi-transparente, conserve des coordonnées tridimensionnelles et peut être orienté et agrandi. Des volumes schématiques d'organes internes sont affichés au sein du corps.

**Modes accessibles :** `kidneys` (deux reins, sélection par défaut), `heart` (cœur), `liver` (foie), `lungs` (deux poumons), `all` (six volumes internes simultanés : deux reins, un cœur, un foie, deux poumons). Changer l'organe met à jour la représentation et les légendes, sans modifier les prédictions pharmacologiques.

**Six silhouettes filaires différenciées :** souris, rat, miniporc, chien, macaque, lapin. Elles ont des dimensions relatives, membres, têtes, museaux, oreilles et queues schématiques distincts. Les organes sont disposés dans un repère tridimensionnel local puis mis à l'échelle **uniquement pour s'accorder visuellement à la silhouette dessinée**.

## Code réellement modifié

- `src/r08_anatomy.mjs` : calcul et rendu 3D projeté sur **Canvas 2D** ; grille filaire translucide du corps (courbes de latitude/longitude), organes en surfaces triangulées coloriées avec structure en lignes, légendes mobiles, repères de voies urinaires indicatives. Pas de téléchargement de GLB, pas de shaders, pas de bibliothèque externe.
- `src/r04_atlas.mjs` : nouvelle fenêtre anatomique à la place de l'ancien profil photo-3D, avec sélection clavier et boutons **Reins / Cœur / Foie / Poumons / Tous**. Un SVG filaire de secours reste en DOM si le contexte Canvas 2D est indisponible. La barre supérieure conserve les portraits animaux réalistes dans des cartes autonomes.
- `src/r04_app.mjs` : le second visualiseur « Organisme transparent / organes internes » de R04 utilise également R08 et se synchronise avec le mode d'organe de l'atlas.
- `r04-atlas.css` : panneaux responsifs, statut de l'organe actif, libellés hors du dessin, grille visible même avant le premier frame.
- `species-r04.html` : titre, infobulles, texte de sécurité et identification en accord avec la nouvelle représentation anatomique.
- Le composant `createVisualAtlas` étant partagé, l'accueil et R01, R02 et R03 reprennent les mêmes options de visualisation sans duplication d'état.
- Les simulations PK/PD originales R02–R04 et les quatre conformères moléculaires RDKit 3D restent indépendants du rendu anatomique.

## Pourquoi cette stratégie corrige la zone vide

R07 tentait de créer une projection WebGL à partir des GLB phototexturés mono-vue ; le rendu dépendait du contexte WebGL, des textures et du chargement des fichiers. R08 utilise **Canvas 2D**, commun aux navigateurs modernes, pour projeter et tracer lui-même les coordonnées 3D. Si Canvas n'est pas utilisable, une silhouette filaire SVG et des organes colorés sont disponibles en repli. Ainsi le panneau ne dépend plus de la disponibilité du pipeline GLB/WebGL et le basculement d'espèce ne déclenche aucun fetch du corps.

Les anciens GLB R07 ne sont **pas supprimés de GitHub** : ils sont conservés comme archives de recherche visuelle. Ils ne pilotent plus le poste d'anatomie. Le chargement reste léger et les scènes ne sont redessinées qu'en cas de sélection, d'interaction ou de changement de taille, sans boucle de rendu permanent.

## Manipulation

- Glisser le pointeur ou le doigt : changer le point de vue.
- Molette / touches `+` et `-` : agrandir ou réduire.
- Double-clic / touche `Home` : retrouver le cadrage initial.
- Flèches du clavier quand le canvas a le focus : orienter le corps.
- Boutons d'organe : afficher l'organe étudié ; `Tous` affiche tous les volumes internes.

## Limitations scientifiques et règles d'intégrité

**Le nouveau modèle n'est pas un atlas anatomique validé.** Il ne repose pas sur une imagerie tomographique, une segmentation clinique, une histologie mesurée ni un recalage morphométrique interespèces. Il s'agit d'une **visualisation pédagogique en coordonnées 3D**, conçue pour rendre visible la relation conceptuelle entre silhouette externe et organes internes. Les géométries, tailles et positions sont approximatives ; les changements d'âge, sexe ou maladie ne modifient pas artificiellement la forme des organes.

Les couleurs des organes sont des **codes d'interface**, pas une représentation de lésion, stade de fibrose, toxicité, perfusion ni efficacité. Une sélection de cœur, foie, poumons ou reins **ne recalibre pas** les équations PK/PD et n'est pas une preuve de guérison. Les véritables valeurs physiologiques spécifiques à l'espèce devront être acquises et tracées séparément avant toute utilisation quantitative.

## Vérification

- `tests/r08_anatomy.test.mjs` : six silhouettes distinctes, présence de chaque mode d'organe et des volumes correspondants, projection 3D réelle et indépendance des calculs.
- `tests/r04_atlas.test.mjs` : suppression du rendu photo 3D actif et intégration de la grille.
- `tests/r04_browser_smoke.cjs` : vérification avec Chromium de la scène réellement peinte, changement de couleur/forme entre modes, rotation et zoom, les six espèces, la synchronisation R04, ainsi que la mise en page mobile à 390 px. Les captures sont déposées dans les artefacts GitHub Actions.

Le résultat doit être déclaré publié seulement après succès du workflow Pages ; le test navigateur doit confirmer un canvas réellement non vide.

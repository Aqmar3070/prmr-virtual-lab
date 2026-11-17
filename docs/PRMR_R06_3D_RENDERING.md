# PRMR-R06 — Amélioration du rendu animal 3D

Date : 17 novembre 2026. Complément des journaux PRMR-R04 et PRMR-R05.

## Nature de cette intervention

R06 améliore directement le moteur de sculpture WebGL intégré à l'accueil du laboratoire, R01, R02, R03 et R04, dans `src/r05_animal3d.mjs`. Les six espèces continuent d'utiliser les mêmes profils et les paramètres du moteur scientifique R04.

Le modèle précédent était constitué de volumes ellipsoïdaux à facettes assez grossières, avec un éclairage plastique uniforme. R06 passe de 12 × 18 à 20 × 28 segments de tessellation pour chaque primitive. Cela rend les courbures plus continues, au prix d'une augmentation de la charge géométrique.

## Matériaux différenciés

Le maillage fournit désormais un attribut matériau par sommet (10 attributs flottants : position 3, normale 3, couleur 3, type de matière 1). Un shader WebGL / GLSL ES 1.00 différencie :

- Pelage : diffusion douce, micro-variations procédurales déterministes et reflets atténués.
- Peau : microtexture plus discrète et légère composante de diffusion simulée.
- Parties sombres / yeux : matériau plus lisse avec reflets spéculaires localisés.
- Éclairage : source principale, lumière d'appoint, reflet de contour et occlusion directionnelle simplifiée.

Cette technique est **un éclairage et des textures synthétiques approximatifs**. Elle ne fournit ni vraies textures de fourrure, ni reconstruction de poils en volumes, ni photométrie mesurée, ni matériau PBR physiquement exact.

## Manipulation

- Faire glisser : rotation du modèle 3D animal.
- Molette : zoom progressif, limité pour éviter la disparition du sujet.
- Double-clic : réinitialiser l'angle et le zoom.
- Quand WebGL n'est pas pris en charge, l'illustration SVG autonome de l'espèce reste visible.

Le rendu reste distinct de la partie scientifique : changer un modèle ou le faire tourner n'altère pas les sorties PK/PD.

## Limite structurelle et prochain palier de réalisme

**Cette version n'est pas photoréaliste.** Les corps, pattes, oreilles, museaux et yeux restent générés à partir de primitives ellipsoïdales assemblées. Pour un niveau de réalisme comparable à un jeu haut de gamme, à une application vétérinaire 3D ou à une visualisation anatomique professionnelle, les six espèces nécessitent des maillages dédiés **GLB/glTF** à topologie continue, des UV, des textures d'épiderme/pelage, des yeux et oreilles sculptés, une illumination PBR contrôlée et des proportions vérifiées sur des références anatomiques. Une licence explicite compatible avec la publication sur GitHub Pages est nécessaire pour chaque ressource externe. Les scènes ne doivent pas être présentées comme des jumeaux numériques sans validation.

Une texture photographique plaquée sur les ellipsoïdes existants ne résoudrait pas le problème des formes.

## Évaluation

Le contrôle de syntaxe Node et les tests scientifiques PRMR continuent de s'exécuter en CI. `tests/r04_browser_smoke.cjs` inspecte l'initialisation de WebGL dans Chromium, le zoom et la réinitialisation (lorsqu'un contexte est disponible) et la cohérence de six espèces ainsi que la compatibilité mobile.

Aucun résultat animal, aucune mesure de toxicité et aucune probabilité de guérison n'a été ajouté par ce changement purement visuel.

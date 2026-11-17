# Anatomie humaine : état actuel et voie vers une anatomie réelle

Date : 17 novembre 2026.

## État actuel

Le corps humain affiché dans la phase 5 est construit par `src/r08_human_local.mjs`.
Son propre en-tête le dit : *educational reconstruction, not segmented medical imagery*.
Concrètement, il s'agit d'ellipsoïdes et de tubes placés selon une posture de
référence, à l'échelle arbitraire de 5,5 unités de scène. Les positions relatives
sont plausibles, les volumes ne sont pas mesurés, et aucune structure ne provient
d'un examen d'imagerie.

Le catalogue `research-data/r05_human_anatomy_catalog.json` décrit 147 entrées
documentaires. Ce sont des descriptions, pas des géométries acquises.

## Ce qu'une anatomie réelle exige

Une anatomie humaine exacte ne se sculpte pas : elle se segmente à partir
d'images. Il faut donc un jeu d'imagerie, une segmentation par structure, et une
licence qui autorise la redistribution.

Ce jeu existe et il est ouvert.

**TotalSegmentator** (Jakob Wasserthal, Zenodo, doi 10.5281/zenodo.10047263)
publie sous **CC BY 4.0** des examens CT accompagnés de segmentations de
référence couvrant 104 structures anatomiques. La publication de référence est
Wasserthal J. et al., *TotalSegmentator: Robust Segmentation of 104 Anatomic
Structures in CT Images*, Radiology: Artificial Intelligence, 2023,
doi 10.1148/ryai.230024.

Le dépôt **open-anatomy** (Opening Science, code sous Apache-2.0) construit par
script des glTF à partir de ce jeu et les publie en version téléchargeable. Chaque
étape, de la segmentation au fichier livré, est un script du dépôt, ce qui rend la
construction rejouable.

## Pourquoi l'import passe par GitHub Actions

L'environnement de développement utilisé pour cette refonte n'a pas accès à
Zenodo ni aux fichiers de publication GitHub : ces hôtes sont hors de la liste
d'autorisation du réseau. Les runners GitHub Actions, eux, ont un accès réseau
complet, et le dépôt importe déjà ses modèles canins de cette façon.

Le workflow `.github/workflows/import-r12-human-anatomy.yml` applique le même
schéma, avec une différence volontaire : il ne code en dur ni nom de fichier ni
empreinte, parce qu'aucune de ces valeurs n'a pu être vérifiée au préalable
depuis cet environnement. Il interroge la publication la plus récente, contrôle
que le fichier reçu est bien un glTF binaire exploitable, puis **consigne ce
qu'il a réellement obtenu** dans `assets/human3d/manifest.json` : empreinte
SHA-256, taille, nombre de maillages et noms des nœuds. En cas d'anomalie il
échoue, plutôt que d'ajouter au dépôt un fichier dont l'origine n'est pas établie.

Lancement : onglet Actions du dépôt, workflow « PRMR R12 import de l'anatomie
humaine segmentée », bouton *Run workflow*.

## Après l'import

L'import ne branche volontairement pas le maillage dans le visualiseur. L'ordre
correct est :

1. Lancer le workflow et lire le manifeste produit, en particulier la liste des
   nœuds : elle dit quelles structures sont réellement présentes.
2. Confronter ces noms au vocabulaire employé dans `clinical.html` et dans le
   catalogue documentaire, puis établir la correspondance structure par structure.
3. Brancher le chargement GLB dans le visualiseur humain, en conservant la
   reconstruction procédurale en repli lorsque WebGL ou le fichier manquent.
4. Afficher l'attribution exigée par CC BY 4.0 à côté du modèle, avec la citation
   de l'article, comme cela est fait pour les surfaces canines.

## Ce que cela ne rendra pas vrai

Même importée, cette anatomie reste le corps d'une personne anonyme recalé sur une
silhouette générique. Elle n'est le corps d'aucun patient suivi, ne mesure l'état
d'aucun individu, et ne devient à aucun moment un support de diagnostic. Elle
remplace une forme inventée par une forme acquise : c'est un gain de véracité
anatomique, pas un gain de portée clinique.

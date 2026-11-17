# Anatomie humaine : état réel et robustesse

Date : 17 novembre 2026.

## Ce qui était cassé

La phase 5 charge un atlas anatomique humain sous licence, de 147 structures :
squelette complet, organes, vaisseaux. Ce modèle **n'apparaissait jamais**.

`src/r05_clinical.mjs` déclarait `refModel` avec `let` après les fonctions
`select()` et `update()` et après l'appel initial à `update()`. Cet appel entrait
donc dans la zone morte temporelle de la variable, l'initialisation du module
s'arrêtait sur `Cannot access 'refModel' before initialization`, et la zone
d'anatomie restait vide. Aucune des commandes de la page ne fonctionnait.

La déclaration a été remontée avant sa première utilisation. L'atlas se charge et
s'affiche désormais : squelette, organes internes, réseau vasculaire, sélection
au clic, rotation et zoom.

Un test de non-régression couvre cet ordre de déclaration, car l'échec était
silencieux pour qui ne regardait pas la console : la page semblait seulement
afficher un cadre vide.

## Ce que montre réellement cet atlas

| Élément | Origine | Licence |
| --- | --- | --- |
| Corps masculin, structures | BodyParts3D © DBCLS | CC BY 4.0 |
| Corps féminin, structures | HRA / HuBMAP | CC BY 4.0 |
| Peau du corps féminin | MakeHuman | CC0 |
| Assemblage et conversion | open-anatomy-3d | CC BY 4.0 |

Le catalogue `research-data/r05_human_anatomy_catalog.json` décrit les 147
structures et leurs points d'ancrage. Ce sont des structures anatomiques
segmentées, non des formes sculptées : l'anatomie humaine du laboratoire repose
donc bien sur des données réelles.

Elle ne devient pas pour autant un support clinique. Ce corps n'est celui
d'aucune personne suivie, ne mesure l'état d'aucun individu et ne sert à aucun
diagnostic.

## La fragilité qui demeure

Le modèle est téléchargé à l'exécution depuis un CDN, avec un dépôt public en
second recours. Si aucune des deux sources n'est joignable — réseau d'entreprise
filtrant, version retirée, panne —, la page bascule silencieusement sur la
reconstruction procédurale de `src/r08_human_local.mjs`, faite d'ellipsoïdes et
de tubes. Son en-tête l'annonce : *educational reconstruction, not segmented
medical imagery*.

Le repli est un bon comportement ; sa discrétion ne l'est pas. Un visiteur peut
croire regarder une anatomie segmentée alors qu'il regarde des ellipsoïdes. Le
message de statut distingue déjà les deux cas : il doit le rester, et la
distinction mérite d'être aussi visible que les jetons de provenance employés
ailleurs dans le laboratoire.

## Rendre l'anatomie humaine indépendante du réseau

Le workflow `.github/workflows/import-r12-human-anatomy.yml` importe une
anatomie humaine segmentée **dans le dépôt**, de la même façon que les surfaces
canines sont déjà versionnées. Le laboratoire cesse alors de dépendre d'un CDN
pour sa structure la plus importante.

Source retenue : le jeu **TotalSegmentator** (Jakob Wasserthal, Zenodo,
doi 10.5281/zenodo.10047263, **CC BY 4.0**), qui couvre 104 structures
segmentées à partir d'examens CT, via le dépôt **open-anatomy** (code
Apache-2.0) qui en construit des glTF par script. Publication à citer :
Wasserthal J. et al., *TotalSegmentator: Robust Segmentation of 104 Anatomic
Structures in CT Images*, Radiology: Artificial Intelligence, 2023,
doi 10.1148/ryai.230024.

L'import passe par GitHub Actions parce que Zenodo et les fichiers de
publication GitHub sont hors de la liste d'autorisation réseau de
l'environnement de développement, alors que les runners disposent d'un accès
complet. Le workflow ne code en dur ni nom de fichier ni empreinte, puisque
aucune de ces valeurs n'a pu être vérifiée au préalable : il interroge la
publication la plus récente, contrôle que le fichier reçu est un glTF binaire
exploitable, puis consigne empreinte SHA-256, taille, nombre de maillages et
noms de nœuds tels qu'obtenus, dans `assets/human3d/manifest.json`. En cas
d'anomalie il échoue plutôt que d'ajouter au dépôt un fichier dont l'origine
n'est pas établie.

Lancement : onglet Actions du dépôt, workflow « PRMR R12 import de l'anatomie
humaine segmentée », bouton *Run workflow*.

### Après l'import

1. Lire le manifeste produit, en particulier la liste des nœuds : elle dit
   quelles structures sont réellement présentes.
2. Établir la correspondance entre ces noms et les clés du catalogue des 147
   structures.
3. Brancher le chargement local **avant** les deux sources distantes, en les
   conservant en recours, et garder la reconstruction procédurale en dernier
   repli.
4. Afficher l'attribution exigée par CC BY 4.0 à côté du modèle, avec la
   citation de l'article, comme pour les surfaces canines.

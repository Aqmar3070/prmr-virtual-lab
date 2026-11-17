# PRMR-R07 — Modèles animaux 3D phototexturés légers

**Date : 17 novembre 2026.**

## Travaux réellement effectués

Six nouveaux fichiers de maillage **glTF 2.0 binaire (.glb)** ont été générés localement à partir des six PNG réalistes approuvés dans la conversation :

| Espèce | Fichier GLB | Taille | Image d'aperçu WebP |
| --- | --- | ---: | ---: |
| Souris | `mouse.glb` | 344 604 o | 17 736 o |
| Rat | `rat.glb` | 312 440 o | 17 542 o |
| Porc/miniporc | `pig.glb` | 438 316 o | 18 868 o |
| Chien/beagle | `dog.glb` | 343 880 o | 18 560 o |
| Macaque | `nhp.glb` | 435 844 o | 29 636 o |
| Lapin | `rabbit.glb` | 437 268 o | 17 724 o |

Les GLB sont de vrais maillages 3D texturés (de 5 376 à 7 598 sommets, de 10 110 à 14 582 triangles). Ils disposent de normales, UV et de la texture WebP originale incrustée via `EXT_texture_webp`. Le navigateur télécharge **une seule espèce à la fois**.

Les affiches sources et les textures ne contiennent pas de textes d'interface. La vidéo/animation n'est pas simulée : la rotation et le zoom manipulant les sommets sont réels.

## Limites essentielles — nature de la reconstruction

**Ces GLB sont des reliefs 3D de silhouettes, issus d'une seule image par animal.** Les pixels réels de la face illustrée sont appliqués sur une surface renflée selon une profondeur calculée depuis le contour. Le revers est généré par symétrie ; il n'a jamais été observé ni modélisé d'après des images anatomiques de dos.

Ne pas présenter ces maillages comme des modèles anatomiquement réalistes à 360°, des représentations morphométriques, des animaux vivants simulés, des scans ni des résultats d'étude. La fidélité du manteau texturé sur la face d'origine est élevée, mais la précision de volume, d'articulations et du revers n'est pas validée.

## Infrastructure GitHub

- `src/r07_photo3d.mjs` : lecteur natif WebGL sans bibliothèque 3D volumineuse, GLB glTF 2.0, texture WebP, rotation au pointeur/tactile, zoom molette, réinitialisation au double-clic, suspension hors écran ; fallback à R06 si le GLB n'est pas disponible.
- `src/r04_atlas.mjs` et `src/r04_app.mjs` : nouvelle intégration des textures et des modèles dans l'accueil, R01, R02, R03 et R04.
- `assets/animals-3d/manifest.json` : six identités, tailles, SHA-256 et état de disponibilité.
- `scripts/ingest_r07.py` et `.github/workflows/import-r07.yml` : workflow sécurisé, copie et vérifie douze fichiers depuis une seule archive ZIP, puis crée un commit sur `main`.
- `tests/r07.test.mjs` : contrôle des chemins, hashes, code WebGL, et décodage d'un véritable GLB synthétique avec texture intégrée.
- L'archive **`PRMR_R07_modeles_3D_textures_legers.zip`** a été remise dans la conversation. **Le dépôt des binaires reste nécessaire** : le connecteur GitHub actuellement disponible ne transmet que le contenu textuel et ne peut pas lire directement les fichiers produits dans le conteneur.

**État de déploiement au moment de l'écriture :** code de chargement poussé dans GitHub, fichiers GLB/WebP binaires créés mais **non encore importés dans le dépôt**. Le site affiche les anciennes sculptures R06 en attendant. Ne pas qualifier R07 de « 3D phototexturée publiée » tant que le dossier GitHub ne contient pas les six GLB et les six WebP.

## Import automatique à faire une seule fois

1. Télécharger l'archive depuis le lien de la conversation (ne pas renommer).
2. Sur GitHub, ouvrir le dossier `incoming/` du dépôt `Aqmar3070/prmr-virtual-lab`.
3. Faire **Add file → Upload files**, choisir **l'archive ZIP complète**, puis **Commit changes** sur la branche `main`.
4. Le workflow `import-r07.yml` lit l'archive et vérifie les SHA-256 ; il ajoute les six GLB et les six WebP. Après publication Pages, le navigateur utilisera automatiquement ces modèles sans autre configuration.

Les fichiers générés peuvent aussi être décompressés et déposés directement dans `assets/animals-3d` et `assets/animals-photo`, mais l'import du ZIP réduit le risque d'erreur.

## Supabase et traçabilité

Le registre permanent de la base de recherche `public.prmr_visual_assets` possède six lignes pour le projet PRMR `204460d3-91f3-4cbd-bfe3-af1b9128dd13`. Il consigne espèce, identifiants de fichiers, checksum GLB, volume des assets, origine du PNG et statut **`locally_generated_pending_upload`**. Ce statut doit passer à `published_verified` seulement après inspection et publication des fichiers binaires. Ce registre n'est pas exposé publiquement (RLS actif, pas de politique d'accès anonyme).

## Conservation du programme scientifique

Les résultats R01–R04, les associations moléculaires RDKit, les scénarios AUC, les contrôles âge/sexe/poids/état rénal, et les limitations de validité PK/PD ne sont pas modifiés. Aucune toxicité, guérison ou réponse animale ne peut être inférée de l'image ou de sa 3D.

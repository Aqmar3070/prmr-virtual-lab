# PRMR R07 — Dépôt du pack des modèles 3D

Le code R07 charge automatiquement `assets/animals-3d/<species>.glb` dans toutes les fiches animales.

Le transfert direct des fichiers binaires depuis la conversation vers le connecteur GitHub n'est pas disponible. L'archive `PRMR_R07_modeles_3D_textures_legers.zip` générée dans la conversation doit être déposée **une seule fois**, sans décompression, dans ce dossier `incoming/` via GitHub **Add file → Upload files → Commit changes** sur `main`.

Le workflow [import-r07.yml](../.github/workflows/import-r07.yml) vérifie les six signatures SHA256, extrait les six GLB et les six WebP, puis crée automatiquement un commit. Aucun collage de photos ni import un à un n'est nécessaire.

**Nature :** maillages 2.5D photo-texturés à partir d'une seule perspective; forme arrière estimée, non anatomique.

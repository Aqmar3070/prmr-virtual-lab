# PRMR-R09 — Atlas volumétrique et organes indépendants

**17 novembre 2026 — Projet PRMR, prolongement scientifique R01–R08.**

## Résultat technique

Un atlas animal volumétrique **3D véritable** a été ajouté : la version R08 dessinait un pseudo-volume en Canvas 2D et limitait les organes à quatre groupes de surfaces géométriques simples. La version R09 utilise désormais le moteur **Three.js 0.181.0** embarqué localement, une caméra PerspectiveCamera, les OrbitControls, du raycasting et des modèles 3D triangle par triangle.

Les six espèces disponibles sont souris, rat, porc/miniporc, chien, macaque-type (primate non humain) et lapin. Chacune possède sept ensembles organiques sélectionnables et pivotables indépendamment : appareil urinaire, cœur / gros vaisseaux, poumons / trachée, foie, encéphale, tube digestif et pancréas. Le corps externe est une enveloppe transparente en maillage, masquable sans masquer les organes. Les organes peuvent être isolés et inspectés en rotation 360° ; les liens physiologiques conceptuels peuvent être tracés entre les ensembles. L’interface partagée alimente l’accueil et les modules R01–R04.

La base **\`public.prmr_anatomy_assets\`** du projet Supabase privé contient les **42 associations espèce–organe**. Le registre public versionné \`research-data/r09_organ_registry.json\` décrit le niveau de fidélité, la provenance, la disponibilité réelle du GLB et les avertissements correspondants.

## Données réelles et limitations de fidélité

### Chien — première source anatomique structurée

Deux fichiers GLB sont intégrés dans \`assets/vet3d/\` :
- \`dog-visceral.glb\` (1 758 360 octets) : géométries anatomiques canines regroupant cerveau, cœur, gros vaisseaux, lobes pulmonaires, foie, pancréas, intestins, reins et vessie. Ensemble **hybride** : certaines surfaces proviennent de scans **CT**, d’autres sont **modélisées, complétées et recalées**, d’autres illustratives.
- \`dog-coat.glb\` (400 720 octets) : enveloppe de chien créée à partir d’une sculpture sous licence, anatomiquement alignée approximativement avec la source viscérale.

Source : <https://github.com/Ketbome/vet-atlas>, avec sources détaillées <https://github.com/Ketbome/vet-atlas/blob/main/content/sources.json>. Les contributeurs originaux incluent notamment **pixelbeaker** (modèles canins segmentés à partir de CT, licence CC BY 4.0), **Lova Dahn** (surface canine sculptée, licence CC BY 4.0), **Cornell / Johnson et Barry** (atlas cérébral canin, CC0) et **Vet Atlas contributors** (modifications et géométries illustratives). Consulter les licences de chaque source originale avant toute réutilisation commerciale ou redistribution ; certaines autres ressources du projet d’origine sont non commerciales, même si elles ne sont pas supposées utilisées par ces deux fichiers. Les fichiers exacts sont contrôlés par SHA Git et SHA256 dans \`assets/vet3d/manifest.json\`. Leurs positions et formes ne sont pas validées pour le diagnostic, la mesure ou la morphométrie.

Le modèle GLB de chien utilise l’extension \`EXT_meshopt_compression\`, décodée localement par \`meshopt_decoder.module.js\` (Meshoptimizer, MIT). Aucun service Web tiers n’est requis à l’exécution.

### Autres cinq espèces — maillages 3D distincts mais **non validés**

\`src/r09_organ_geometry.mjs\` génère des formes organiques avec surfaces triangulées, reliefs anatomiques indicatifs, lissages, volumes creusés, trajets de vaisseaux et tubules, matériaux PBR et couleurs différentes. Le cerveau est volontairement plus lisse chez les rongeurs et le lapin ; le gros côlon spiralé est représenté chez le porc ; le cæcum est plus volumineux chez le lapin et les rongeurs ; le rat n’a pas de vésicule biliaire. Ces distinctions sont **des schématisations**, pas des scans anatomiques individuels. Les organes ne sont **pas** des modèles photoréalistes médicaux validés et ne doivent pas être utilisés pour mesurer une lésion ou interpréter une étude expérimentale. Il n’a pas été affirmé que 35 scans animaux authentifiés auraient été importés.

### Aucun résultat physiopathologique inventé

Lorsque la maladie change, les organes concernés peuvent être mis en avant avec une coloration d’**intérêt théorique**. Cela ne signifie **pas** qu’une lésion a été observée, ni qu’une localisation réelle a été calculée. Les interactions affichées entre reins, cœur, foie, poumons ou pancréas sont des **liens physiologiques conceptuels**, sans coefficients de toxicité ou réponses pharmacologiques mesurées. La PK/PD R02–R04 conserve toutes ses limites et ses probabilités de guérison/toxicité restent \`null\`.

## Contrôles

- Sélection d’espèce dans les six cartes.
- Boutons : **Reins**, **Cœur**, **Poumons**, **Foie**, **Cerveau**, **Système digestif**, **Pancréas**, **Tous les organes**.
- **Corps transparent** : affiche/masque le corps filaire.
- **Isoler la sélection** : masque les organes non sélectionnés, avec recadrage automatique.
- **Afficher les liens d’organes** : affiche un réseau schématique de dépendances, sans interprétation causale.
- Les deux scènes, animal entier et organe isolé, sont manipulables indépendamment par rotation à la souris/tactile et zoom.
- Cliquer directement un organe dans la scène permet de le sélectionner ; le panneau physiologique affiche l’intérêt théorique et l’origine.

## Provenance des logiciels

Three.js 0.181.0 et Meshoptimizer sont distribués sous licence MIT, avec leurs mentions de copyright conservées dans \`vendor/three/\`.

Les scripts des tests sont dans \`tests/r09_anatomy.test.mjs\` et \`tests/r04_browser_smoke.cjs\` (Chromium 1440 px/390 px). L’import des modèles canins et la vérification des empreintes sont assurés par \`.github/workflows/import-r09-veterinary-models.yml\`.

## Prochain critère de progression scientifique

Remplacer progressivement les maillages pédagogiques de chacune des cinq espèces restantes par des organes segmentés depuis des acquisitions CT/MRI proprement attribuées, avec validation morphologique par anatomiste vétérinaire, métadonnées d’acquisition, fidélité, incertitude et contraintes éthiques. Ce travail est distinct de la finition de l’interface et ne se résout pas en changeant l’éclairage ou en recadrant des images de posters.

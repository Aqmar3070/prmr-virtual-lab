# PRMR-R04 — Laboratoire 3D et extension interespèces interactive

**16 novembre 2026 — version r04-v1.0 — statut : développement computationnel réellement exécuté, tests automatisés.**

## Objet, relation avec R01/R02/R03
R04 est le nouveau tableau de bord manipulable de PRMR. Il réutilise les trois groupes de molécules R02 (irbesartan + dapagliflozine seul en doublet / plus pirfénidone / plus pentoxifylline) et les données de référence PK humaines identifiées en R03. Il **n'invente aucune étude animale réellement exécutée**. L'objectif est d'enseigner les différences de physiologie, d'expliciter les lacunes des données et de préparer une vraie étude si elle est scientifiquement justifiée.

L'interface publique est **species-r04.html**, liée à l'accueil, au module R02, à R03 et aux études externes R01. Elle comporte des structures chimiques 2D issues de l'API graphique PubChem, des conformères RDKit locaux, deux visualisations anatomiques 3D **conceptuelles** manipulables (rein et organisme), des graphiques SVG recalculés et six espèces sélectionnables.

## Sources vérifiées / pertinence des espèces

| Espèce / modèle | Connaissance étayée | Limite concernant R02-A et R02-B |
|---|---|---|
| Souris / C57BL/6 | Nombreux modèles génétiques ; rein unipapillaire et unilobulaire ; puissance SGLT2 in vitro de la dapagliflozine connue (IC50 ≈ 2,3 nM). | Pas d'étude animale PRMR ni de mesure triple-combinaison. |
| Rat / Sprague–Dawley | Physiologie rénale et modèles de maladies ; rein unipapillaire ; IC50 ≈ 3,0 nM pour SGLT2. | Métabolites, doses et interactions des triples non mesurés. |
| Miniporc / modèle générique | Rein multiréniculé et multipapillaire comparable anatomiquement à l'humain ; mesures de débit et modèles rénaux translationnels. | Métabolisme et transporteurs parfois différents ; aucune PK du triple. |
| Chien / Beagle | Historiquement employé comme espèce non-rongeur de toxicologie ; architecture rénale unipapillaire différente de l'humain. | Aucune dose sécuritaire ou toxicité spécifique des triples renseignée. |
| Primate non humain / macaque cynomolgus | Certaines physiologies et cibles davantage transposables, mais non identiques ; une étude publiée UUO indique un profil de fibrose distinct des rongeurs. | Usage ne se justifie que si une question scientifique indispensable ne peut pas être résolue par des méthodes alternatives. |
| Lapin / Nouvelle-Zélande | Modèle alternatif pour certaines toxicités selon la cible. | Absence de données spécifiques sur ces triples, pertinence à justifier. |

Sources :
- <https://pmc.ncbi.nlm.nih.gov/articles/PMC8285645/> : caractéristiques physiologiques du rein porcin et distinction rongeurs/chiens.
- <https://pmc.ncbi.nlm.nih.gov/articles/PMC9232961/> : différences entre physiologie porcine et humaine, notamment sels et volume urinaire.
- <https://pmc.ncbi.nlm.nih.gov/articles/PMC6442373/> : modèle porcin de maladie rénale chronique.
- <https://pubmed.ncbi.nlm.nih.gov/32758521/> : sélection de modèles non-rongeurs, chien/miniporc/primate, enjeux éthiques.
- <https://pubmed.ncbi.nlm.nih.gov/34977487/> : modèle de fibrose rénale chez macaque différent du rongeur.
- <https://www.ncbi.nlm.nih.gov/books/NBK573735/> : limites des modèles animaux de maladies rénales.
- <https://pmc.ncbi.nlm.nih.gov/articles/PMC10309579/> : alternatives telles que rein-sur-puce, organoïdes et systèmes utilisant des cellules humaines.
- <https://www.medicines.org.uk/emc/product/13875/smpc> ; <https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b0d1d50f-9023-4e2f-889f-a5febba70fa5> ; <https://www.medicines.org.uk/emc/product/7607/smpc> : ancrages humains d'AUC.

## Ce qui a été calculé réellement

1. **Structures moléculaires réelles :** quatre conformères générés localement à partir des SMILES PubChem puis construits par RDKit 2025.09.4 (ETKDG, graine 437), minimisation MMFF sous réserve d'une force-field compatible, retrait des atomes H. Un unique conformère par molécule est affiché, sans exhaustivité conformationnelle ni validation cristallographique. Les coordonnées et liaisons résident dans \`research-data/r04_molecular_3d.json\`. Les images 2D sont récupérées directement depuis le rendu PubChem, avec gestion d'indisponibilité.
2. **3D pédagogique sans dépendance :** \`src/r04_visuals.mjs\` projette les coordonnées de 3 dimensions sur une toile HTML Canvas 2D, avec rotation au pointeur et modèle d'éclairage. Les organes sont des approximations graphiques géométriques : **aucun organe patient/animal n'a été scanné ni reconstruit**, aucun signal biologique n'est simulé dans ce moteur.
3. **Comparaison des six espèces :** base de savoir qualitative \`src/r04_engine.mjs\` avec noms scientifiques, masses *illustratives*, architecture du rein, domaine de pertinence et provenance.
4. **Scénarios configurables :** espèce, poids, âge catégoriel, sexe, constitution, fonction rénale, fonction hépatique, hydratation, maladie, combinaison et concentration libre illustratrice SGLT2. Le choix de l'espèce met à jour les fiches, anatomie conceptuelle et capacité de prédiction PD.
5. **Rapports AUC et incertitudes :** réutilisation de \`stress()\` R03 : transfert arbitraire depuis rapports d'AUC **humains**, sous exposition relative et poids. Ce n'est PAS un modèle PBPK calibré chez le porc, le chien, le macaque ou le lapin. Le graphique d'ancres humaines est explicitement étiqueté comme tel et n'est jamais modifié par une sélection d'espèce.
6. **Pharmacodynamie SGLT2 :** courbe Emax théorique avec IC50 2,3 nM souris et 3,0 nM rat, concentration libre *hypothétique*. Pour porc, chien, primate et lapin : **paramètre inconnu et courbe non calculée** (évite d'attribuer la puissance des rongeurs à une autre espèce).
7. **Âge / sexe / constitution :** donnent lieu à **résultats de validité et avertissements distincts**, mais PAS à une variation numérique d'AUC artificielle car aucun effet chiffré validé n'a été collecté dans les espèces, souche, âge et traitement en question. La fonction rénale/hépatique et le poids modifient les sorties chiffrées **exploratoires** conformément aux paramètres déclarés. L'effet de grossesse et d'autres comorbidités particulières n'est pas inféré.
8. **Balance risque–bénéfice :** inconnue faute de mesures dose–lésion et dose–efficacité par combinaison. Le tableau de bord n'utilise aucune barre artificielle « chance de guérison », et interdit toute probabilité de lésion, efficacité ou guérison numérique.

## Expérience interface R04

- Cliquer sur une carte animale actualise immédiatement masses de référence, identité, anatomie, cibles et source.
- Choisir âge, sexe, constitution, hydratation, fonction rénale, foie ou maladie modifie immédiatement les alertes et questions expérimentales. Quand un effet n'est pas quantifiable, la phrase *pas de coefficient disponible* est maintenue au lieu d'inventer des résultats.
- Les graphiques AUC sont recalculés quand les facteurs mathématiques réellement pris en charge changent. Le tableau des références humaines ne devient jamais une preuve animale.
- Cliquer sur une fiche chimique sélectionne son modèle 3D ; faire glisser l'image la fait pivoter. Rotation 3D des organes également.
- Export JSON côté navigateur de l'ensemble du scénario avec les avertissements, pour la traçabilité locale. Aucun compte privé n'est requis.
- Les graphiques, molécules et cartes ont des textes alternatifs ; pas d'upload ou stockage de données individuelles.

## Validation

Les tests \`tests/r04.test.mjs\` contrôlent les 6 espèces, les limites de poids, les 4 conformères (coordonnées et liaisons), les différences des modèles physiologiques, la disponibilité conditionnelle de la cible SGLT2, le comportement âge/sexe, l'absence de résultats de toxicité / guérison numérique, les liens et les contrôles de la plateforme.

Le pipeline GitHub Actions ajoute la vérification syntaxique \`node --check\` des modules R04 et l'ensemble des tests Node.

## Ce qui pourrait devenir une hypothèse de rémission

Dans un type de néphropathie biologiquement réversible, un traitement pourrait réduire durablement inflammation et fibrose, avec normalisation fonctionnelle à long terme et sans lésion hépatique. **Ce scénario est un objectif expérimental conditionnel et pas une prévision de guérison.** Même si un modèle porc traduit mieux certains aspects de l'anatomie humaine, son emploi ne rend pas le triple plus efficace.

Les étapes pertinentes avant des études in vivo sont les organoïdes et systèmes rein-sur-puce humains avec choix de maladie, mesures de concentration libre/tissulaire, enzymes de métabolisme par espèce, mesures de fibrose, inflammation, ALT/AST, KIM-1, NGAL, potassium, DFG, et dose–réponse en combinaison. Passage à l'animal uniquement avec autorisation éthique et critères 3R, randomisation et aveugle ; primates comme dernier recours scientifiquement justifié.

## Langage enfant

Nous avons dessiné en 3D des molécules qui existent et des dessins de reins. L'ordinateur montre ce qu'on sait des souris, rats, porcs, chiens, lapins et singes. Quand on change l'animal, la maladie ou son poids, l'écran change. Quand les chercheurs ne connaissent pas la réponse, l'écran l'écrit au lieu de la deviner. **Aucun animal n'a été guéri dans ce programme R04.**


## Enrichissement de l'atlas visuel par espèce — 17 novembre 2026

- Ajout de l'atlas illustré à la page publique \`species-r04.html\`, au-dessus des contrôles R04, avec une présentation graphique cohérente avec les maquettes discutées.
- Six portraits d'animaux tirés **de Wikimedia Commons** (et non les fichiers PNG des maquettes originales). Source, crédit et licence affichés dans l'interface et archivés dans \`research-data/r04_animal_portraits.json\`. Les URL des photographies sont externes et nécessitent un accès réseau du navigateur.
- La comparaison des reins a été **redessinée en SVG conceptuel** afin de demeurer manipulable par espèce. Elle ne représente ni un scan, ni une image médicale validée, ni l'exact visuel raster du poster produit auparavant.
- Déclinaison dynamique des bandeaux, portraits, données qualitatives d'anatomie et choix des espèces avec navigation vers les contrôles originaux : \`src/r04_atlas.mjs\` et \`r04-atlas.css\`.
- Les barres de représentation de l'atlas portent **des catégories qualitatives éditoriales**, aucune probabilité numérique ni note scientifique n'a été fabriquée. Une absence de mesure PK dans les groupes triples reste inscrite « Non mesurée ».
- Le changement de sexe, âge, constitution, maladie et état de santé conserve les graphiques réellement calculables et actualise les explications. En absence de coefficient d'espèce validé, aucune variation pharmacocinétique numérique n'est inventée.
- Les fichiers \`tests/r04_atlas.test.mjs\` et les vérifications syntaxiques exécutées par GitHub Actions protègent la traçabilité des six sources.

**Intégrité de la demande iconographique :** la maquette picturale d'illustration générée précédemment dans la conversation n'a pas été ajoutée *octet par octet* au dépôt ; les visuels web publiés sont une reconstruction interactive inspirée de ces maquettes, avec photographies sous licence et schémas SVG. Il ne faut pas prétendre autrement. Pour une copie exacte des affiches PNG, les fichiers binaires des quatre maquettes devront être transférés dans \`assets/\` par un outil de transfert binaire autorisé.

## Correction de provenance visuelle — 17 novembre 2026

Les six PNG originaux ont finalement été **importés par l'utilisateur dans GitHub** : `porc.png`, `chien.png`, `primate.png`, `lapin.png`, `comparaison-especes.png` et `tableau-pkpd.png` dans `assets/illustrations/r04/`. Les tests de SHA256 `tests/r04_original_images.test.mjs` ont réussi et les fichiers sont présents sur la branche principale.

Une nouvelle section de `species-r04.html` montre ces fichiers directement dans le HTML, sans attendre le module de calcul ni le chargement des fiches Wikimedia ; les six miniatures restent cliquables, et leur sélection synchronise le choix physiologique de l'espèce dans R04. L'affiche PK/PD de R03 est directement visible dans `risk-r03.html`.

La mention précédente « les fichiers binaires originaux ne sont pas encore ajoutés » décrit un état antérieur et est **désormais obsolète**. Les scores ou probabilités apparaissant dans les affiches restent exclusivement décoratifs et sont explicitement distingués des scénarios calculés et des observations biologiques.

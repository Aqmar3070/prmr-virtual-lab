# PRMR Virtual Lab

Laboratoire scientifique numérique consacré à la maladie rénale chronique : preuves
précliniques publiées, anatomie comparée en 3D, criblage moléculaire par RDKit et
stress-tests d'exposition pharmacocinétique.

**[Ouvrir le laboratoire](https://aqmar3070.github.io/prmr-virtual-lab/index.html)**

## Ce que ce laboratoire est, et ce qu'il n'est pas

Il réunit des résultats publiés, des calculs chimiques reproductibles et des
visualisations exploratoires. Il **ne démontre aucune efficacité thérapeutique**, ne
calcule aucune probabilité de guérison ou de toxicité, et aucun essai clinique PRMR
sur des personnes n'est autorisé. Les scores de priorisation qu'il affiche sont des
règles de classement choisies pour organiser un criblage, sans calibration sur une
quelconque mesure biologique.

Cette réserve n'est pas une formalité : elle est intégrée à l'interface. Chaque
valeur affichée porte son statut de provenance, et la forme de son marqueur distingue
une donnée mesurée d'une hypothèse, même en l'absence de couleur.

| Statut | Signification |
| --- | --- |
| **Mesuré** | Donnée expérimentale publiée, reprise d'une source externe identifiée. |
| **Calculé** | Sortie déterministe et reproductible : RDKit, modèle analytique. |
| **Hypothèse** | Paramètre, score ou scénario exploratoire, non calibré. |
| **Indisponible** | La donnée n'existe pas. Elle n'est pas remplacée par une estimation. |

## Le parcours en cinq phases

| Phase | Page | Contenu | Nature |
| --- | --- | --- | --- |
| 01 | [Preuves précliniques](preclinical.html) | Trois études animales externes, avec PMID, DOI et résultats mesurés | Mesuré |
| 02 | [Anatomie comparée 3D](species-r04.html) | Chien et chat, organes internes issus de CT, physiologie manipulable | Mesuré et modélisé, voir ci-dessous |
| 03 | [Criblage moléculaire](screening.html) | Dix molécules, 165 associations, descripteurs et similarités RDKit | Calculé |
| 04 | [Exposition et sensibilité](risk-r03.html) | Stress-test PK/PD sur 144 profils et 432 comparaisons | Hypothèse |
| 05 | [Conditions d'entrée en clinique](clinical.html) | Anatomie humaine, critères encore manquants | Mixte |
| — | [Explorateur d'expositions](exposures.html) | Dose, durée et repères publiés par substance | Mesuré et observé |

L'explorateur d'expositions est un outil de référence transversal plutôt qu'une phase :
pour une substance, une dose et une durée, il affiche les repères réellement publiés qui
sont franchis — seuils d'agence, doses toxiques établies, associations observées — et
l'endroit où les données s'arrêtent. Il ne prédit l'état d'aucun organe : aucun modèle
validé ne le permet, et son curseur de durée sert précisément à montrer où s'arrête la
littérature.

La vue [Symptômes](exposures.html?vue=symptomes) permet de consigner une observation
par région corporelle et de la sauvegarder explicitement sur le navigateur utilisé.
Les correspondances exploratoires sont définies dans `src/symptomes-registre.mjs`,
avec une source par fiche. Le seuil de deux signes communs sert à naviguer dans le
registre et ne possède aucune validation diagnostique. Les options étudiées,
leurs populations et leurs références proviennent des fiches Maladies existantes.

La navigation est servie par un module unique, `src/prmr_route.mjs`, qui nomme chaque
destination d'une seule façon sur toutes les pages.

## Origine des surfaces 3D

Le registre complet se trouve dans
[`research-data/r12_anatomy_provenance.json`](research-data/r12_anatomy_provenance.json)
et s'affiche dans la phase 02. Il a été établi en inspectant le dépôt source en amont,
et non en reprenant ses pages de présentation.

Le laboratoire conserve **deux espèces animales**, celles dont l'anatomie provient de
modèles réellement acquis : le chien et le chat.

| Organe | Chien | Chat |
| --- | --- | --- |
| Reins | Segmentation CT | Segmentation CT |
| Foie | Segmentation CT | Segmentation CT |
| Cœur | Segmentation CT | Schématique |
| Estomac | Modélisé | Segmentation CT |
| Rate | Schématique | Segmentation CT |
| Intestin grêle | Modélisé | Segmentation CT |
| Vessie | Modélisé | Segmentation CT |
| Poumons | Modélisés | Schématiques |
| Cerveau | Gabarit IRM de 30 chiens | Modélisé |
| Silhouette extérieure | Sculptée | Sculptée |

Pour la recherche rénale, le chat est le mieux couvert des deux : reins, foie, rate,
estomac, intestin grêle et vessie proviennent tous de scanners. La maladie rénale
chronique y est par ailleurs spontanée et fréquente, ce qui en fait un modèle observé
plutôt qu'induit.

Les cent structures canines du dépôt amont portent le statut `draft` : aucune n'a été
validée par une relecture anatomique, y compris celles issues de scans.

**Souris, rat, porc, lapin et primate ont été retirés de l'atlas 3D.** Aucune imagerie
anatomique sous licence utilisable n'existe pour ces espèces : leurs organes n'étaient
que des maillages construits par le laboratoire, affichés à côté d'un chien issu de
scanners, ce qui faussait toute comparaison entre espèces. Vache et cheval ont été
examinés puis écartés : leurs squelettes sont réels, mais leurs organes abdominaux sont
majoritairement schématiques.

Ce retrait ne concerne que l'atlas anatomique. **Souris et rats restent présents dans les
couches scientifiques qui reposent sur des publications réelles** : les études
précliniques de la phase 01 et le modèle pharmacocinétique de la phase 04.

**Obligations de licence** : attribution pour les sources CC BY et CC BY-SA, partage à
l'identique pour les organes modélisés, citation demandée pour l'atlas cérébral CC0.

## Reproduire les calculs

```bash
pip install -r requirements-r02.txt
python research-tools/prmr_r02_validate.py      # revalide structures, descripteurs, 165 associations
python research-tools/prmr_r02_sensitivity.py   # recalcule les 2 000 scénarios de pondération
node --test tests/*.test.mjs                    # 68 contrôles numériques et documentaires
```

La validation chimique rejoue les SMILES, formules, masses, cLogP, TPSA, empreintes de
Morgan et indices de priorité, et échoue si un seul chiffre publié diffère.

## Structure du dépôt

```
*.html                     Les pages du parcours
prmr-design-system.css     Jetons, styles de base, tableaux, statuts, contrôles
laboratory.css r04*.css    Styles des modules, bâtis sur les jetons
prmr-route.css             Barre de parcours et tableau de bord d'accueil
src/                       Modules applicatifs (moteurs, visualiseurs, navigation)
research-data/             Registres de référence en JSON
research-tools/            Scripts Python de revalidation
tests/                     Contrôles Node et fumée navigateur
docs/                      Journaux scientifiques et historique des versions
assets/ vendor/            Illustrations, modèles 3D, Three.js vendorisé
```

Une seule feuille définit les variables de couleur, de typographie et d'espacement ;
les autres les consomment. Toute page doit donc charger `prmr-design-system.css` en
premier.

## Modules de l'interface
- Cockpit de recherche et navigation modulaire.
- Analyse des structures SMILES et des descripteurs physicochimiques par **RDKit.js MinimalLib 2026.9.2** exécuté en WebAssembly dans le navigateur; la bibliothèque est chargée via un CDN externe. Le site signale explicitement son indisponibilité.
- Énumération déterministe de 16 structures aromatiques virtuelles **sans affirmation de nouveauté chimique, de synthétisabilité, de sécurité ou d'efficacité**. Ne pas confondre cette énumération avec une intelligence artificielle de conception de médicaments.
- Bibliothèque de session et export JSON; **aucun stockage sécurisé ni compte utilisateur**.
- Comparaison de structures par empreintes Morgan et indice de Tanimoto, **sans déduction d'interaction médicamenteuse ni synergie**.
- Modèle PK/PD simplifié existant, calculé indépendamment des structures moléculaires, avec analyse de scénarios.
- Atlas documentaire de douze systèmes du corps humain, sans simulation physiologique opérationnelle.
- Consultations ponctuelles PubChem (propriétés moléculaires) et ChEMBL (cibles biologiques). Les requêtes dépendent du réseau et des politiques d'accès/CORS des services.
- Statut explicite des moteurs externes : PK-Sim, MoBi et moteur rénal mécanistique **non intégrés**.

## Limites majeures
Aucune précision absolue n'est scientifiquement possible pour prévoir les effets d'une nouvelle molécule dans le corps humain. Les résultats de structure RDKit ne démontrent ni activité pharmacologique, ni toxicité, ni biodisponibilité, ni aptitude à la synthèse. Les paramètres PK/PD ne sont pas calibrés sur les molécules sélectionnées. Il n'existe pas de moteur de simulation clinique ou de recommandation de dosage.

## Feuille de route
1. Tests fonctionnels en navigateur et assurance qualité sur données de référence.
2. Ajout de recherche de bioactivité par cible documentée, traçabilité des jeux de données et filtrage d'applicabilité.
3. Backend dédié pour RDKit Python, simulations intensives et versions reproductibles des moteurs.
4. Intégration de PK-Sim/MoBi; module rénal mécanistique filtrage, transport tubulaire, inflammation, fibrose.
5. Modèles multi-organes uniquement après calibration et validation expérimentale par domaine.

---

## Journaux scientifiques

- [Phase 01 — recherche préclinique rénale](docs/PRMR_R01_RESEARCH_LOG.md)
- [Phase 03 — criblage computationnel](docs/PRMR_R02_RESEARCH_LOG.md)
- [Phase 04 — sensibilité PK/PD](docs/PRMR_R03_RESEARCH_LOG.md)
- [Phase 02 — physiologie comparée](docs/PRMR_R04_RESEARCH_LOG.md) · [atlas des organes](docs/PRMR_R09_ORGAN_ATLAS.md) · [anatomie transparente](docs/PRMR_R08_TRANSPARENT_ANATOMY.md)
- [Anatomie humaine : état et voie vers une anatomie réelle](docs/PRMR_R12_ANATOMIE_HUMAINE.md)
- [Espace de recherche privé Supabase](docs/SUPABASE_SETUP.md)
- [Historique des versions R01 à R09](docs/HISTORIQUE_VERSIONS.md)

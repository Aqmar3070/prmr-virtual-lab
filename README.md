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
| 02 | [Anatomie comparée 3D](species-r04.html) | Six espèces, organes internes, physiologie manipulable | Mixte, voir ci-dessous |
| 03 | [Criblage moléculaire](screening.html) | Dix molécules, 165 associations, descripteurs et similarités RDKit | Calculé |
| 04 | [Exposition et sensibilité](risk-r03.html) | Stress-test PK/PD sur 144 profils et 432 comparaisons | Hypothèse |
| 05 | [Conditions d'entrée en clinique](clinical.html) | Anatomie humaine, critères encore manquants | Mixte |

La navigation est servie par un module unique, `src/prmr_route.mjs`, qui nomme chaque
destination d'une seule façon sur toutes les pages.

## Origine des surfaces 3D

Le registre complet se trouve dans
[`research-data/r12_anatomy_provenance.json`](research-data/r12_anatomy_provenance.json)
et s'affiche dans la phase 02. Il a été établi en inspectant le dépôt source en amont,
et non en reprenant ses pages de présentation.

**Chien** — seule espèce partiellement issue d'imagerie réelle :

| Organe | Origine |
| --- | --- |
| Reins, foie, cœur | Segmentations CT d'un chien, CC BY 4.0 |
| Cerveau | Gabarit IRM de population de 30 chiens, CC0 |
| Poumons, estomac | Modélisés d'après des références, CC BY-SA 4.0 |
| Pancréas, rate | Formes schématiques, non exactes anatomiquement |
| Silhouette extérieure | Maillage sculpté à la main par un auteur tiers, CC BY 4.0 |

Les cent structures canines du dépôt amont portent le statut `draft` : aucune n'a été
validée par une relecture anatomique, y compris celles issues de scans.

**Souris, rat, porc, lapin, primate** — organes et silhouette construits par PRMR. Ce
sont des hypothèses anatomiques pédagogiques, ni scans ni segmentations. Aucune source
d'imagerie sous licence utilisable n'a été trouvée pour ces cinq espèces ; le modèle de
rat le plus proche est sous licence non commerciale. Une parité réelle avec le chien
exigerait, par espèce, un jeu d'imagerie sous licence permissive, sa segmentation par
organe et son recalage.

### Corps humain

La phase 5 affiche un atlas anatomique humain sous licence de **147 structures** —
squelette, organes, vaisseaux — assemblé à partir de BodyParts3D (© DBCLS, CC BY 4.0),
de HRA / HuBMAP (CC BY 4.0) et de MakeHuman (CC0). Ce sont des structures segmentées,
pas des formes sculptées.

Cet atlas ne s'affichait jamais : une variable déclarée après son premier usage
interrompait l'initialisation du module, et la zone d'anatomie restait vide sans
message visible. Le défaut est corrigé et couvert par un test.

Le modèle est encore téléchargé depuis un CDN ; si celui-ci est injoignable, la page
bascule sur une reconstruction procédurale de secours. Le workflow
`.github/workflows/import-r12-human-anatomy.yml` importe une anatomie segmentée dans
le dépôt — TotalSegmentator, CC BY 4.0 — pour supprimer cette dépendance réseau.
Détails et limites : [docs/PRMR_R12_ANATOMIE_HUMAINE.md](docs/PRMR_R12_ANATOMIE_HUMAINE.md).

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

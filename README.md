# PRMR Virtual Lab · Research Workspace 2.0

## PRMR-R02 — Criblage moléculaire original (16 novembre 2026)

- **[Ouvrir l'interface PRMR-R02](https://aqmar3070.github.io/prmr-virtual-lab/screening.html)** — calculs RDKit à partir de 10 molécules existantes, 165 combinaisons, 44 hypothèses ouvertes et 121 associations suspendues.
- [Registre complet des 165 combinaisons](research-data/prmr-r02-screen.json), calculs de chimie et statut scientifique explicites.
- [Journal de recherche et limites](docs/PRMR_R02_RESEARCH_LOG.md).
- [Reproduction chimique par RDKit](research-tools/prmr_r02_validate.py) et [2000 perturbations de sensibilité](research-tools/prmr_r02_sensitivity.py).
- Dossiers `R02-A`, `R02-B`, `R02-C` enregistrés dans Supabase, sous `evidence_type=calculated`. Les résultats publiés précédemment pour R01 sont sous `external_reference`.
- **Pas d'expérience animale, pas de culture cellulaire, pas de prédiction biologique validée, pas de traitement curatif démontré.** Les scores classent des hypothèses selon des règles exploratoires arbitraires.


## PRMR-R01 · Recherche préclinique rénale (16 novembre 2026)

- [Ouvrir le dossier interactif sur le site](https://aqmar3070.github.io/prmr-virtual-lab/preclinical.html) : résultats animaux publiés, comparaisons, filtres, explications simplifiées et export de données.
- [Consulter le journal scientifique](docs/PRMR_R01_RESEARCH_LOG.md) : méthode de sélection documentaire, provenance, protocoles et limites.
- Trois études animales externes archivées sous `external_reference` dans le projet privé Supabase PRMR-R01, sans revendication d'essai animal effectué par PRMR, ni de guérison.
- Contrôles automatiques dans `tests/preclinical.test.mjs`.


## Cloud Research Workspace — Supabase (intégration initiale)

- Module **Espace de recherche privé** dans la navigation GitHub Pages.
- Supabase Auth : inscription par e-mail/mot de passe, confirmation d'e-mail, session, déconnexion.
- Projets et travaux persistants dans `research_projects`, `molecules`, `experiments` et `simulation_runs`.
- Sauvegarde des structures **calculées** par RDKit.js et des prédictions PK/PD **hypothétiques**, sans prétendre à une validation clinique.
- Accès limité au propriétaire via RLS pour les 4 tables; clés `service_role` jamais publiées.
- **Vérification d'intégration requise** : les paramètres de redirection Auth du Dashboard et un vrai essai de confirmation d'e-mail/connexion/enregistrement doivent encore être effectués. Documentation : [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
- Limites du SMTP d'essai Supabase : adresse de membre de l'organisation uniquement, 2 messages/h tant qu'un SMTP personnalisé n'est pas configuré.


Site Web scientifique exploratoire accessible dans Chrome via GitHub Pages.

## Modules ajoutés à l'interface (version 2.0)
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

## Conventions de provenance
- **Base externe** : données effectivement retournées par PubChem ou ChEMBL avec identifiants et liens officiels.
- **Calcul** : résultats déterministes de RDKit.js et du modèle PK/PD analytique.
- **Hypothèse** : paramètres, candidats virtuels et scénarios exploratoires.
- **Non disponible** : modèle rénal mécanistique, PBPK multi-organes, activité biologique ou interaction médicamenteuse prédictive.

## Vérification
Les modules JavaScript ont été contrôlés syntaxiquement et huit vérifications ciblées sur la chimie et le modèle PK/PD ont été exécutées lors de cette évolution. Les tests GitHub Actions, le chargement effectif de RDKit.js sur Chrome et les réponses en direct des services externes doivent encore être confirmés; ne pas considérer les modules comme validés scientifiquement.

## Feuille de route
1. Tests fonctionnels en navigateur et assurance qualité sur données de référence.
2. Ajout de recherche de bioactivité par cible documentée, traçabilité des jeux de données et filtrage d'applicabilité.
3. Backend dédié pour RDKit Python, simulations intensives et versions reproductibles des moteurs.
4. Intégration de PK-Sim/MoBi; module rénal mécanistique filtrage, transport tubulaire, inflammation, fibrose.
5. Modèles multi-organes uniquement après calibration et validation expérimentale par domaine.

---
## Archive historique 1.1
# PRMR Virtual Lab · Version Web 1.1

Plateforme expérimentale de simulation pharmacocinétique à un compartiment, gratuite et exécutable entièrement dans un navigateur moderne. **Non clinique : aucune molécule, espèce ou population calibrée.**

## Fonctionnalités réelles
- Calcul concentration-temps après entrée fictive extravasculaire avec absorption de premier ordre et clairance linéaire.
- Cmax, Tmax, demi-vie, AUC, clairance, indice Emax illustratif.
- Contrôles modifiables, graphique SVG réactif, export JSON.
- Enveloppe déterministe de 27 scénarios (variations hypothétiques ±20 % de F, CLh, CLr); **pas un intervalle de confiance**.
- Tests numériques reproductibles avec Node.js : `node --test tests/*.test.mjs`.

## Modèle, unités et hypothèses

| Paramètre | Unité | Provenance |
| --- | --- | --- |
| Quantité fictive Dose | mg | hypothèse illustrative |
| Biodisponibilité F | fraction | hypothèse illustrative |
| Constante d'absorption ka | h⁻¹ | hypothèse illustrative |
| Volume apparent V | L | hypothèse illustrative |
| Clairance hépatique CLh | L/h | hypothèse illustrative |
| Clairance rénale CLr | L/h | hypothèse illustrative |
| Facteur rénal | sans unité | hypothèse illustrative (n'est pas DFG) |
| Inhibition hépatique | fraction | hypothèse illustrative |
| EC50 | mg/L | hypothèse illustrative |

CL = CLh × (1 − inhibition) + CLr × facteur rénal

kₑ = CL/V ; AUC₀–∞ = F × Dose / CL ; demi-vie = ln(2)/kₑ

C(t) = (F×Dose/V) × kₐ/(kₐ−kₑ) × [exp(−kₑt) − exp(−kₐt)].

Si kₐ ≈ kₑ, limite analytique : C(t) = (F×Dose/V) × kₐ×t×exp(−kₑt).

**Limites** : non PBPK, aucun compartiment tissulaire, aucune élimination saturable, aucune filtration glomérulaire mécanistique, aucun transporteur, aucune voie de fibrose/inflammation et aucune démonstration de régénération rénale. L'indice Emax n'est pas une efficacité clinique. Pas de protocole de dose humaine ou animale.

## Déploiement sur GitHub Pages (gratuit pour dépôt public)
Dans **Settings → Pages**, choisir **Deploy from a branch**, `main` et `/(root)`, puis **Save**. Une fois la publication terminée, l'URL habituelle est visible dans GitHub Settings → Pages. Le dépôt public est lisible par tous; ne jamais publier de données confidentielles.

## Étapes futures (non intégrées)
1. Régression et tests d'incertitude élargis; registre de provenance reproductible.
2. RDKit via service scientifique séparé.
3. PK-Sim/MoBi via moteur dédié.
4. Renal Engine mécanistique : filtration, sécrétion/réabsorption, transporteurs, inflammation, fibrose.

## Usage
Ouvrir `index.html` sur un serveur statique (GitHub Pages) ou un serveur local. Aucun backend, aucune dépendance front-end, aucun service externe requis.

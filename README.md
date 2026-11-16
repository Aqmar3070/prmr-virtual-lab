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

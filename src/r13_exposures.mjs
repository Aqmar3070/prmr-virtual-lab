/* PRMR — explorateur d'expositions documentées.
 *
 * On choisit une substance, une dose journalière et une durée. L'explorateur
 * affiche les repères publiés que ce régime franchit, les organes concernés,
 * et l'endroit où les données s'arrêtent.
 *
 * Ce qu'il ne fait pas, délibérément : il ne calcule pas l'état d'un organe au
 * bout d'un an. Aucun modèle validé ne prédit l'atteinte d'un organe individuel
 * à partir d'une dose et d'une durée. Un curseur qui afficherait « foie : 23 %
 * d'atteinte à deux ans » produirait une précision fabriquée, d'autant plus
 * crédible qu'elle serait bien rendue.
 *
 * Le curseur de durée enseigne donc l'inverse : il montre jusqu'où les études
 * vont, puis annonce franchement qu'au-delà rien n'est documenté.
 */

import { createBodyMap, organStates, ORGAN_FILL } from "./r13_body_map.mjs";
import { mountBodyViewer } from "./r19_body_viewer.mjs";
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const STATUS_CLASS = {
  reglementaire: "prmr-status-measured",
  toxique_etabli: "prmr-status-hypothesis",
  association_observee: "prmr-status-computed",
  non_documente: "prmr-status-unavailable"
};

const STATUS_LABEL = {
  reglementaire: "Seuil officiel",
  toxique_etabli: "Toxicité établie",
  association_observee: "Association observée",
  non_documente: "Non documenté"
};

const EVIDENCE_CLASS = {
  reglementaire: "prmr-evidence-measured",
  toxique_etabli: "prmr-evidence-vigilance",
  association_observee: "prmr-evidence-computed",
  non_documente: "prmr-evidence-unavailable"
};

/* Durées proposées. Ce sont des paliers nommés plutôt qu'un continuum : la
   littérature ne varie pas de façon continue avec le temps, elle couvre
   certaines durées et pas d'autres. */
const DURATIONS = [
  { days: 1, label: "1 jour" },
  { days: 3, label: "3 jours" },
  { days: 7, label: "1 semaine" },
  { days: 30, label: "1 mois" },
  { days: 90, label: "3 mois" },
  { days: 180, label: "6 mois" },
  { days: 365, label: "1 an" },
  { days: 730, label: "2 ans" },
  { days: 1825, label: "5 ans" },
  { days: 3650, label: "10 ans" }
];

function statusChip(status) {
  const chip = el("span", "prmr-status " + (STATUS_CLASS[status] || STATUS_CLASS.non_documente),
    STATUS_LABEL[status] || STATUS_LABEL.non_documente);
  return chip;
}

function findingBlock(item, { crossed = true } = {}) {
  const block = el("div", "prmr-evidence " + (EVIDENCE_CLASS[item.status] || ""));
  const head = el("div", "r13-finding-head");
  head.append(el("strong", null, item.title), statusChip(item.status));
  block.append(head);
  block.append(el("p", null, item.detail));
  if (item.source) {
    const cite = el("p", "prmr-small");
    cite.append(document.createTextNode("Source : "));
    if (item.url) {
      const link = el("a", null, item.source);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      cite.append(link);
    } else {
      cite.append(document.createTextNode(item.source));
    }
    block.append(cite);
  }
  if (!crossed) block.classList.add("r13-not-crossed");
  return block;
}

export function mountExposureExplorer(hostId, dataUrl = "./research-data/r13_exposures.json") {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.append(el("p", "prmr-small", "Chargement des repères documentés…"));

  fetch(dataUrl)
    .then(r => { if (!r.ok) throw new Error("registre indisponible"); return r.json(); })
    .then(data => build(host, data))
    .catch(() => {
      host.replaceChildren(el("p", "prmr-small",
        "Registre d'expositions momentanément illisible. Aucun repère n'est affiché : mieux vaut rien qu'un chiffre dont l'origine n'est pas vérifiable."));
    });
}

function build(host, data) {
  host.replaceChildren();
  let substance = data.substances[0];
  let dose = substance.typical_dose;
  let durationIndex = 3;
  let weight = 70;
  let dfg = 90;

  const layout = el("div", "r13-layout");
  const controls = el("div", "r13-controls");

  // Substance
  const substanceField = el("div", "r13-field");
  substanceField.append(el("label", null, "Substance"));
  const substanceSelect = el("select");
  substanceSelect.id = "r13-substance";
  for (const s of data.substances) {
    const option = el("option", null, s.label + " — " + s.family);
    option.value = s.id;
    substanceSelect.append(option);
  }
  substanceField.append(substanceSelect);
  controls.append(substanceField);

  // Dose
  const doseField = el("div", "r13-field");
  const doseLabel = el("label", null, "Dose journalière");
  doseLabel.htmlFor = "r13-dose";
  const doseRange = el("input");
  doseRange.type = "range";
  doseRange.id = "r13-dose";
  const doseValue = el("output", "r13-value");
  doseField.append(doseLabel, doseRange, doseValue);
  controls.append(doseField);

  /* Personne ne compte sa caféine en milligrammes : on compte des tasses.
     Chaque portion de référence ajoute sa teneur à la dose, et la dose
     choisie est reconvertie en portions. Les teneurs varient d'un café à
     l'autre — la conversion est un ordre de grandeur, et sa source est
     citée comme n'importe quel autre chiffre de ce registre. */
  const portionField = el("div", "r13-field r13-portions");
  const portionLabel = el("p", "r13-portions-label", "Compter en portions");
  const portionList = el("div", "r13-portion-buttons");
  const portionEcho = el("p", "prmr-small r13-portion-echo");
  const portionSources = el("p", "prmr-small r13-portion-sources");
  portionField.append(portionLabel, portionList, portionEcho, portionSources);
  controls.append(portionField);

  function renderPortions() {
    const portions = substance.portions || [];
    portionField.hidden = portions.length === 0;
    if (!portions.length) return;
    portionList.replaceChildren();
    for (const portion of portions) {
      const button = el("button", "r13-portion");
      button.type = "button";
      button.append(
        el("span", "r13-portion-name", portion.label),
        el("span", "r13-portion-mg", portion.mg + " " + substance.unit.split("/")[0])
      );
      button.title = portion.detail + " — " + portion.source;
      button.addEventListener("click", () => {
        /* Le curseur n'accepte que des multiples de son pas : sans cet
           arrondi, la valeur interne et la valeur affichée divergeaient
           silencieusement — deux cafés ajoutaient 90 mg et le curseur en
           montrait 100. */
        const pas = substance.dose_step;
        const brut = Math.min(substance.dose_range[1], dose + portion.mg);
        dose = Math.round(brut / pas) * pas;
        render();
      });
      portionList.append(button);
    }
    const repere = portions[0];
    const nombre = dose / repere.mg;
    /* L'accord se lit dans le registre : « 3,2 tasse » se voyait, et aucune
       règle générale ne met au pluriel « canette de boisson énergisante ». */
    const nom = nombre >= 2 ? (repere.plural || repere.label.toLowerCase()) : repere.label.toLowerCase();
    portionEcho.textContent = dose
      ? "La dose choisie équivaut à " +
        nombre.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
        " " + nom + " par jour."
      : "Ajoutez des portions ou déplacez le curseur.";
    portionSources.replaceChildren(
      document.createTextNode("Teneurs de référence : "));
    const vues = new Map();
    for (const portion of portions) if (!vues.has(portion.source)) vues.set(portion.source, portion.url);
    let premier = true;
    for (const [source, url] of vues) {
      if (!premier) portionSources.append(document.createTextNode(" · "));
      const lien = el("a", null, source);
      lien.href = url;
      lien.target = "_blank";
      lien.rel = "noopener noreferrer";
      portionSources.append(lien);
      premier = false;
    }
  }

  // Durée
  const durationField = el("div", "r13-field");
  const durationLabel = el("label", null, "Durée de la prise");
  durationLabel.htmlFor = "r13-duration";
  const durationRange = el("input");
  durationRange.type = "range";
  durationRange.id = "r13-duration";
  durationRange.min = "0";
  durationRange.max = String(DURATIONS.length - 1);
  durationRange.step = "1";
  const durationValue = el("output", "r13-value");
  durationField.append(durationLabel, durationRange, durationValue);
  controls.append(durationField);

  // Poids, pour les repères exprimés par kilogramme
  const weightField = el("div", "r13-field");
  const weightLabel = el("label", null, "Poids corporel");
  weightLabel.htmlFor = "r13-weight";
  const weightInput = el("input");
  weightInput.type = "number";
  weightInput.id = "r13-weight";
  weightInput.min = "3";
  weightInput.max = "200";
  weightInput.step = "1";
  weightInput.value = String(weight);
  weightField.append(weightLabel, weightInput);
  controls.append(weightField);

  /* Pour certaines substances, le repère opposé à la dose n'est pas un
     plafond unique : c'est une table indexée sur la fonction rénale. Le
     réglage n'apparaît que pour celles-là, pour ne pas suggérer qu'il
     change quelque chose là où aucune table n'est publiée. */
  const dfgField = el("div", "r13-field");
  const dfgLabel = el("label", null, "Débit de filtration glomérulaire");
  dfgLabel.htmlFor = "r13-dfg";
  const dfgRange = el("input");
  dfgRange.type = "range";
  dfgRange.id = "r13-dfg";
  dfgRange.min = "10";
  dfgRange.max = "120";
  dfgRange.step = "1";
  dfgRange.value = String(dfg);
  const dfgValue = el("output", "r13-value");
  dfgField.append(dfgLabel, dfgRange, dfgValue);
  controls.append(dfgField);

  /* La figure accompagne les repères : elle montre quels organes ils
     concernent, sans rien dire de leur état. */
  const bodyMap = createBodyMap();
  const bodyPanel = el("div", "r13-bodypanel");
  const bodyLegend = el("p", "prmr-small r13-bodylegend");
  /* Clé des couleurs : sans elle, un organe en rouge se lit comme un organe
     abîmé. Elle dit que la teinte qualifie le repère, pas l'organe. */
  const bodyKey = el("ul", "r13-bodykey");
  for (const status of ["toxique_etabli", "association_observee", "reglementaire"]) {
    const item = el("li");
    const puce = el("span", "r13-bodykey-dot");
    puce.style.background = ORGAN_FILL[status];
    item.append(puce, el("span", null, STATUS_LABEL[status]));
    bodyKey.append(item);
  }
  bodyPanel.append(bodyMap.svg, bodyKey, bodyLegend);

  /* Le corps passe au centre, en grand. Il était relégué au bas de la colonne
     des réglages, sous le poids et la fonction rénale : la figure que l'on
     vient voir se trouvait après les formulaires. */
  const stage = el("div", "r13-stage");
  const readouts = el("div", "r13-readouts");

  /* L'atlas réel prend la place du schéma. Celui-ci reste en réserve : si le
     modèle ne se charge pas — réseau, WebGL indisponible — la console garde
     une figure plutôt qu'un carré vide. */
  const canvas3d = el("canvas", "r13-canvas3d");
  canvas3d.setAttribute("aria-label",
    "Atlas anatomique humain en trois dimensions ; glisser pour tourner, molette pour agrandir");
  canvas3d.tabIndex = 0;
  const chargement = el("p", "prmr-small r13-chargement", "Chargement de l’atlas anatomique…");
  stage.append(readouts, canvas3d, chargement, bodyPanel);
  bodyPanel.hidden = true;

  /* Les couleurs sont définies en CSS ; WebGL ne sait pas lire var(). */
  const teinteDe = valeur => {
    const nom = String(valeur).match(/var\((--[\w-]+)\)/);
    if (!nom) return valeur;
    return getComputedStyle(document.documentElement).getPropertyValue(nom[1]).trim() || "#7ed6e9";
  };

  let atlas = null;
  let etatsCourants = {};
  mountBodyViewer(canvas3d, { onStatus: m => { chargement.textContent = m || ""; chargement.hidden = !m; } })
    .then(viewer => { atlas = viewer; viewer.setStates(etatsCourants); })
    .catch(erreur => {
      console.warn("[PRMR-R13] atlas 3D indisponible :", erreur);
      canvas3d.hidden = true;
      chargement.hidden = true;
      bodyPanel.hidden = false;
    });

  const results = el("div", "r13-results");
  const summary = el("div", "r13-summary");
  const findings = el("div", "r13-findings");
  results.append(summary, findings);
  layout.append(controls, stage, results);
  host.append(layout);

  function render() {
    doseRange.min = String(substance.dose_range[0]);
    doseRange.max = String(substance.dose_range[1]);
    doseRange.step = String(substance.dose_step);
    doseRange.value = String(dose);
    doseValue.textContent = dose.toLocaleString("fr-FR") + " " + substance.unit;

    const duration = DURATIONS[durationIndex];
    durationRange.value = String(durationIndex);
    durationValue.textContent = duration.label;

    /* Repères franchis, et repères qui restent au-dessus de la dose choisie :
       montrer les deux évite de laisser croire qu'il n'existe rien d'autre. */
    /* Le classement se fait ici, et non dans le registre : « le plus élevé »
       doit rester vrai quel que soit l'ordre dans lequel les repères ont été
       saisis. Un repère écrit en dernier était annoncé comme le plus élevé. */
    /* À valeur égale, deux repères ne se valent pas : un plafond officiel dit
       quelque chose de la dose, une observation rassurante non. Le second
       rang évite d'annoncer « le plus élevé est : seuil en deçà duquel le
       risque n'est pas augmenté ». */
    const gravite = { toxique_etabli: 3, reglementaire: 2, association_observee: 1 };
    const parValeur = (a, b) =>
      a.value - b.value || (gravite[a.status] || 0) - (gravite[b.status] || 0);
    const crossed = substance.thresholds.filter(t => dose >= t.value).sort(parValeur);
    const ahead = substance.thresholds.filter(t => dose < t.value).sort(parValeur);
    const perKg = (dose / weight);

    /* La figure ne montre que ce que le verdict compte : les repères
       réellement franchis à ce réglage, et l'avertissement de durée quand sa
       condition est remplie. Les mises en garde permanentes — fonction
       rénale, associations observées — restent dans le texte : les porter sur
       la figure laisserait croire qu'elles dépendent de la dose choisie. */
    const marques = crossed.slice();
    if (substance.chronic_warning && duration.days >= substance.chronic_warning.after_days && crossed.length) {
      marques.push(substance.chronic_warning);
    }
    renderPortions();

    /* Le plafond selon la fonction rénale, quand il existe. */
    const bands = substance.renal_bands;
    dfgField.hidden = !bands;
    let band = null;
    if (bands) {
      dfgValue.textContent = dfg + " mL/min";
      dfgRange.value = String(dfg);
      band = bands.find(b => dfg >= b.min && (b.max === null || dfg <= b.max)) || null;
    }
    const etats = organStates(marques);
    const concernes = bodyMap.update(etats);
    etatsCourants = Object.fromEntries(
      Object.entries(etats).map(([organe, statut]) => [organe, teinteDe(ORGAN_FILL[statut])]));
    atlas?.setStates(etatsCourants);

    /* Quatre chiffres lisibles de loin, qui résument le réglage en cours.
       Chacun est une donnée réelle du registre ou du réglage — jamais une
       constante vitale, que ce laboratoire n'a pas à inventer. */
    readouts.replaceChildren();
    const chiffres = [
      { valeur: dose.toLocaleString("fr-FR"), unite: substance.unit, titre: "Dose réglée" },
      { valeur: duration.label, unite: "de prise", titre: "Durée" },
      { valeur: String(crossed.length), unite: crossed.length > 1 ? "repères franchis" : "repère franchi", titre: "Repères publiés" },
      { valeur: String(concernes.length), unite: concernes.length > 1 ? "organes concernés" : "organe concerné", titre: "Organes" }
    ];
    for (const c of chiffres) {
      const bloc = el("div", "r13-readout");
      bloc.append(
        el("span", "r13-readout-title", c.titre),
        el("strong", "r13-readout-value", c.valeur),
        el("span", "r13-readout-unit", c.unite)
      );
      readouts.append(bloc);
    }
    bodyLegend.textContent = concernes.length
      ? "Organes concernés par les repères franchis : " + concernes.join(", ") + ". La couleur indique la nature du repère, jamais l\u2019état d\u2019un organe."
      : "Aucun repère franchi à ce réglage : aucun organe n\u2019est marqué.";

    summary.replaceChildren();
    const head = el("div", "r13-summary-head");
    head.append(el("strong", null, substance.label));
    head.append(el("span", "prmr-small",
      dose.toLocaleString("fr-FR") + " " + substance.unit +
      " pendant " + duration.label +
      " · " + perKg.toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1}) + " mg/kg pour " + weight + " kg"));
    summary.append(head);
    summary.append(el("p", "prmr-small", substance.reference_intake));

    const highest = crossed[crossed.length - 1];
    const verdict = el("div", "prmr-evidence " +
      (highest ? EVIDENCE_CLASS[highest.status] : "prmr-evidence-measured"));
    if (!crossed.length) {
      verdict.append(el("strong", null, "Aucun repère publié n’est franchi à cette dose"));
      verdict.append(el("p", null,
        "Cela ne veut pas dire que cette dose est sans effet : cela veut dire qu’aucun des seuils cités ici ne la concerne."));
    } else {
      verdict.append(el("strong", null,
        crossed.length + (crossed.length > 1 ? " repères franchis" : " repère franchi")));
      verdict.append(el("p", null,
        "Le plus élevé est : " + highest.title.toLowerCase() + "."));
    }
    summary.append(verdict);

    /* Le cœur du dispositif : dire où les données s'arrêtent. */
    const horizon = substance.evidence_horizon_days;
    const beyond = duration.days > horizon;
    const horizonBlock = el("div", "prmr-evidence " +
      (beyond ? "prmr-evidence-unavailable" : "prmr-evidence-measured"));
    const horizonHead = el("div", "r13-finding-head");
    horizonHead.append(
      el("strong", null, beyond ? "Au-delà de ce que les études couvrent" : "Durée couverte par les sources citées"),
      statusChip(beyond ? "non_documente" : "reglementaire")
    );
    horizonBlock.append(horizonHead);
    horizonBlock.append(el("p", null, beyond
      ? "À " + duration.label + ", aucune des sources citées ne décrit ce que devient un organe à cette dose. L’explorateur n’extrapole pas : il s’arrête là où les données s’arrêtent."
      : substance.horizon_note));
    summary.append(horizonBlock);

    findings.replaceChildren();
    if (crossed.length) {
      findings.append(el("h3", null, "Repères franchis"));
      for (const item of crossed.slice().reverse()) findings.append(findingBlock(item));
    }
    if (substance.chronic_warning && duration.days >= substance.chronic_warning.after_days && crossed.length) {
      findings.append(findingBlock(substance.chronic_warning));
    }
    if (band) {
      findings.append(el("h3", null, "Plafond selon la fonction rénale"));
      const contreIndique = band.max_daily === 0;
      const depasse = !contreIndique && dose > band.max_daily;
      const bloc = findingBlock({
        status: contreIndique || depasse ? "toxique_etabli" : "reglementaire",
        title: band.label + " — DFG " + band.min + (band.max === null ? " mL/min et plus" : " à " + band.max + " mL/min"),
        detail: (contreIndique
          ? "À ce débit, aucune dose n'est prévue par le résumé des caractéristiques du produit. "
          : "Dose journalière totale maximale à ce débit : " +
            band.max_daily.toLocaleString("fr-FR") + " mg, à répartir en 2 à 3 prises. " +
            (depasse
              ? "La dose réglée, " + dose.toLocaleString("fr-FR") + " mg, dépasse ce plafond. "
              : "La dose réglée ne dépasse pas ce plafond. ")) + band.note,
        source: substance.renal_bands_source.source,
        url: substance.renal_bands_source.url
      });
      findings.append(bloc);
    }
    if (substance.renal_note) {
      findings.append(el("h3", null, "Fonction rénale"));
      findings.append(findingBlock(substance.renal_note));
    }
    if (substance.observational && substance.observational.length) {
      findings.append(el("h3", null, "Associations observées"));
      for (const item of substance.observational) findings.append(findingBlock(item));
    }
    if (ahead.length) {
      findings.append(el("h3", null, "Repères non atteints à cette dose"));
      for (const item of ahead) findings.append(findingBlock(item, { crossed: false }));
    }

    const organs = el("p", "prmr-caveat",
      "Organes concernés par les repères de cette substance : " +
      substance.organs.map(o => ({
        liver: "foie", kidneys: "reins", brain: "cerveau", heart: "cœur"
      })[o] || o).join(", ") +
      ". " + data.what_this_is_not);
    findings.append(organs);
  }

  substanceSelect.addEventListener("change", () => {
    substance = data.substances.find(s => s.id === substanceSelect.value);
    dose = substance.typical_dose;
    render();
  });
  doseRange.addEventListener("input", () => { dose = Number(doseRange.value); render(); });
  dfgRange.addEventListener("input", () => { dfg = Number(dfgRange.value); render(); });
  durationRange.addEventListener("input", () => { durationIndex = Number(durationRange.value); render(); });
  weightInput.addEventListener("input", () => {
    const value = Number(weightInput.value);
    if (value >= 3 && value <= 200) { weight = value; render(); }
  });

  render();
}

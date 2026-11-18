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

  const results = el("div", "r13-results");
  const summary = el("div", "r13-summary");
  const findings = el("div", "r13-findings");
  results.append(summary, findings);
  layout.append(controls, results);
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
  durationRange.addEventListener("input", () => { durationIndex = Number(durationRange.value); render(); });
  weightInput.addEventListener("input", () => {
    const value = Number(weightInput.value);
    if (value >= 3 && value <= 200) { weight = value; render(); }
  });

  render();
}

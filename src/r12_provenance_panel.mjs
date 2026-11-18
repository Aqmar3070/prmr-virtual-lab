/* PRMR — panneau de provenance anatomique.
 *
 * Répond dans l'interface à la question que pose tout atlas 3D : ce que je
 * regarde vient-il d'une acquisition réelle ? La réponse diffère d'un organe à
 * l'autre, y compris chez le chien, qui est la seule espèce partiellement
 * issue d'imagerie. Les données proviennent de research-data/r12_anatomy_provenance.json,
 * établi en inspectant le dépôt source en amont.
 */

const STATUS = {
  scan: {
    label: "Acquisition réelle",
    cls: "prmr-status-measured",
    help: "Surface dérivée d'un examen d'imagerie sur un animal ou un spécimen."
  },
  modeled: {
    label: "Modélisé",
    cls: "prmr-status-computed",
    help: "Construit d'après des références anatomiques et recalé sur une structure réelle."
  },
  illustrative: {
    label: "Schématique",
    cls: "prmr-status-hypothesis",
    help: "Forme générée par script, non exacte anatomiquement."
  },
  "procedural-hypothesis": {
    label: "Hypothèse",
    cls: "prmr-status-hypothesis",
    help: "Maillage construit par PRMR. Jamais une segmentation."
  }
};

const ORGAN_LABELS = {
  kidneys: "Reins",
  heart: "Cœur",
  liver: "Foie",
  lungs: "Poumons",
  brain: "Cerveau",
  stomach: "Estomac",
  pancreas: "Pancréas",
  spleen: "Rate"
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function statusChip(kind) {
  const info = STATUS[kind] || STATUS["procedural-hypothesis"];
  const chip = el("span", "prmr-status " + info.cls, info.label);
  chip.title = info.help;
  return chip;
}

function dogTable(dog, label = "Chien") {
  const wrap = el("div", "prmr-table-wrap");
  const table = el("table", "prmr-table");
  const caption = el(
    "caption",
    null,
    label + " — origine de chaque organe affiché, relevée dans le dépôt source."
  );
  table.append(caption);

  const thead = el("thead");
  const headRow = el("tr");
  for (const [label, numeric] of [["Organe", false], ["Origine", false], ["Source", false], ["Licence", false]]) {
    const th = el("th", null, label);
    th.scope = "col";
    if (numeric) th.dataset.numeric = "true";
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = el("tbody");
  for (const [id, organ] of Object.entries(dog.organs)) {
    const row = el("tr");
    const name = el("th", null, ORGAN_LABELS[id] || id);
    name.scope = "row";
    const status = el("td", "prmr-col-status");
    status.append(statusChip(organ.fidelity));
    row.append(name, status, el("td", null, organ.origin), el("td", null, organ.license));
    tbody.append(row);
  }
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

export function mountProvenancePanel(hostId, dataUrl = "./research-data/r12_anatomy_provenance.json") {
  const host = document.getElementById(hostId);
  if (!host) return;

  host.append(el("p", "prmr-small", "Chargement du registre de provenance…"));

  fetch(dataUrl)
    .then(r => {
      if (!r.ok) throw new Error("registre indisponible");
      return r.json();
    })
    .then(data => {
      host.replaceChildren();

      const intro = el(
        "p",
        null,
        "Un atlas 3D peut donner à une forme inventée l'autorité d'un scanner. Ces tableaux disent, organe par organe, d'où vient ce qui est affiché."
      );
      host.append(intro);
      host.append(dogTable(data.species.dog, "Chien"));

      const cat = data.species.cat;
      if (cat && cat.organs) {
        host.append(dogTable(cat, "Chat"));
      }

      const removed = data.removed_species;
      if (removed) {
        const note = el("div", "prmr-evidence prmr-evidence-unavailable");
        note.append(el("strong", null, "Espèces retirées"));
        note.append(el("p", null, removed.reason));
        note.append(el("p", null, removed.kept_elsewhere));
        host.append(note);
      }

      const review = el("p", "prmr-caveat", data.upstream_review_status);
      host.append(review);
    })
    .catch(() => {
      host.replaceChildren(
        el(
          "p",
          "prmr-small",
          "Registre de provenance momentanément illisible. Par prudence, considérez toute surface affichée comme non vérifiée tant que ce tableau n'est pas accessible."
        )
      );
    });
}

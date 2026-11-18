/* PRMR — où se situent les organes concernés par les repères franchis.
 *
 * Le registre indique déjà, pour chaque repère, l'organe qu'il concerne.
 * L'information restait enfouie dans le texte : on lisait « rein », « foie »,
 * « estomac » au fil des blocs sans jamais voir de quoi on parlait.
 *
 * Cette figure marque ces organes, et rien de plus. Ce n'est pas une carte de
 * lésions : la couleur dit la nature du repère franchi — seuil officiel,
 * toxicité établie, association observée — jamais l'état d'un organe. Aucune
 * atteinte n'est prédite, aucune surface n'est proportionnelle à un risque.
 *
 * Le dessin est un schéma de repérage fait pour ce laboratoire, pas une
 * planche anatomique : il ne sert pas à situer une structure avec précision.
 */

const NS = "http://www.w3.org/2000/svg";

/* Les intitulés ne sont pas déduits de la clé : « kidneys » doit s'afficher
   « reins », au pluriel, et non « rein ». */
export const ORGAN_LABELS = Object.freeze({
  brain: "Cerveau",
  heart: "Cœur",
  liver: "Foie",
  stomach: "Estomac",
  kidneys: "Reins"
});

/* Rang de gravité : un organe concerné par plusieurs repères prend la couleur
   du plus grave, sinon une toxicité établie disparaîtrait derrière un simple
   plafond réglementaire. */
const RANK = { toxique_etabli: 3, association_observee: 2, reglementaire: 1 };

export const ORGAN_FILL = Object.freeze({
  toxique_etabli: "var(--prmr-vigilance)",
  association_observee: "var(--prmr-hypothesis)",
  reglementaire: "var(--prmr-signal)"
});

/* Schéma de repérage, vue de face, viewBox 120 × 260. Le corps est fait de
   formes simples plutôt que d'un tracé unique : une silhouette approximative
   suffit à situer un organe, et un tracé complexe mal maîtrisé donnait une
   figure que personne ne reconnaissait. Vue de face : le foie est donc à
   gauche de l'image, du côté droit de la personne. */
const BODY = [
  ["circle", { cx: 60, cy: 24, r: 15 }],
  ["rect", { x: 55, y: 36, width: 10, height: 10 }],
  ["path", { d: "M40 46h40c3 0 5 2 5 5l2 38c0 4-1 8-2 12l-2 32c0 4-2 7-5 7H42c-3 0-5-3-5-7l-2-32c-1-4-2-8-2-12l2-38c0-3 2-5 5-5z" }],
  ["rect", { x: 23, y: 50, width: 11, height: 80, rx: 5.5 }],
  ["rect", { x: 86, y: 50, width: 11, height: 80, rx: 5.5 }],
  ["rect", { x: 45, y: 136, width: 13, height: 100, rx: 6.5 }],
  ["rect", { x: 62, y: 136, width: 13, height: 100, rx: 6.5 }]
];

const SHAPES = {
  brain: "M51 22c0-5 4-9 9-9s9 4 9 9c0 3-1 5-3 6-1 1-3 2-6 2s-5-1-6-2c-2-1-3-3-3-6z",
  heart: "M55 64c-4-4-10-2-10 4 0 6 6 11 10 14 4-3 10-8 10-14 0-6-6-8-10-4z",
  liver: "M41 86c9-4 17-3 22 1 1 4-1 9-5 11-6 3-14 2-17-2-2-3-2-8 0-10z",
  stomach: "M68 85c5 0 9 4 9 9 0 6-4 11-8 12-3 1-5-1-4-4 2-4 3-8 2-10-2-3-3-7 1-7z",
  kidneys: "M50 105c3 0 5 4 5 9s-2 8-5 8-4-3-4-8 1-9 4-9zm20 0c3 0 4 4 4 9s-1 8-4 8-5-3-5-8 2-9 5-9z"
};

const node = (name, attrs) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

/* Retourne la figure et la fonction qui l'actualise. Rien n'est dessiné en
   fonction de la dose : seule la liste des organes concernés change. */
export function createBodyMap() {
  const svg = node("svg", {
    viewBox: "0 0 120 260",
    class: "r13-bodymap",
    role: "img",
    focusable: "false"
  });
  const title = node("title", {});
  svg.append(title);

  for (const [tag, attrs] of BODY) {
    svg.append(node(tag, { ...attrs, class: "r13-bodymap-silhouette" }));
  }

  const organs = new Map();
  for (const [key, d] of Object.entries(SHAPES)) {
    const shape = node("path", { d, class: "r13-bodymap-organ" });
    shape.dataset.organ = key;
    svg.append(shape);
    organs.set(key, shape);
  }

  function update(states) {
    const named = [];
    for (const [key, shape] of organs) {
      const status = states[key];
      /* La couleur passe par le style en ligne : un attribut de présentation
         SVG cède devant n'importe quelle règle CSS, et la règle de repos
         l'emportait silencieusement — aucun organe ne se colorait. */
      if (status && ORGAN_FILL[status]) {
        shape.style.fill = ORGAN_FILL[status];
        shape.dataset.status = status;
        named.push(ORGAN_LABELS[key] || key);
      } else {
        shape.style.fill = "";
        delete shape.dataset.status;
      }
    }
    title.textContent = named.length
      ? "Organes concernés par les repères franchis : " + named.join(", ") + "."
      : "Aucun organe n’est concerné par un repère franchi à cette dose.";
    return named;
  }

  return { svg, update };
}

/* Le statut le plus grave l'emporte, organe par organe. */
export function organStates(items) {
  const states = {};
  for (const item of items) {
    if (!item || !item.organ || !RANK[item.status]) continue;
    const current = states[item.organ];
    if (!current || RANK[item.status] > RANK[current]) states[item.organ] = item.status;
  }
  return states;
}

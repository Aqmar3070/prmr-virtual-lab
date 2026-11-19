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

/* Schéma de repérage, vue de face, viewBox 120 × 260.
 *
 * Première version : des rectangles arrondis pour les membres et un bloc pour
 * le torse. Lisible en vignette, mais une fois la figure mise au centre et
 * agrandie, elle faisait dessin d'enfant. Les contours sont donc tracés avec
 * des courbes — épaules, taille, hanches, membres fuselés — et une cage
 * thoracique et une colonne en filigrane situent les organes sans prétendre
 * à l'exactitude anatomique : c'est un repère, pas une planche.
 *
 * Vue de face : le foie est à gauche de l'image, du côté droit de la personne.
 */
const BODY = [
  ["ellipse", { cx: 60, cy: 22, rx: 11, ry: 14 }],
  ["path", { d: "M56 34q4 4 8 0l2 10q-10 3-12 0z" }],
  ["path", { d: "M60 43q13 0 18 6 3 4 3 10l-2 20q-1 8-3 14l-2 8q-1 5-1 10l1 18q0 4-4 4H50q-4 0-4-4l1-18q0-5-1-10l-2-8q-2-6-3-14l-2-20q0-6 3-10 5-6 18-6z" }],
  ["path", { d: "M43 49q-5 2-6 8l-5 30q-1 7 0 13l2 14q0 3-3 3t-3-3l-3-15q-1-7 0-14l5-30q1-7 7-9z" }],
  ["path", { d: "M77 49q5 2 6 8l5 30q1 7 0 13l-2 14q0 3 3 3t3-3l3-15q1-7 0-14l-5-30q-1-7-7-9z" }],
  ["path", { d: "M48 133h11l-1 34q0 9-1 17l-3 36q0 5 0 10 0 3-3.5 3T47 230q0-6 .5-12l2-33q1-10 .5-19z" }],
  ["path", { d: "M72 133H61l1 34q0 9 1 17l3 36q0 5 0 10 0 3 3.5 3t3.5-3q0-6-.5-12l-2-33q-1-10-.5-19z" }]
];

/* Cage thoracique et colonne : décor structurant, jamais cliquable. */
const REPERES = [
  ["path", { d: "M60 48v85" }],
  ["path", { d: "M60 57q-7 1-10 8" }], ["path", { d: "M60 57q7 1 10 8" }],
  ["path", { d: "M60 66q-8 1-12 9" }], ["path", { d: "M60 66q8 1 12 9" }],
  ["path", { d: "M60 76q-9 1-13 10" }], ["path", { d: "M60 76q9 1 13 10" }],
  ["path", { d: "M60 86q-8 1-12 9" }], ["path", { d: "M60 86q8 1 12 9" }],
  ["path", { d: "M48 129h24" }]
];

const SHAPES = {
  brain: "M52 20q0-6 8-6t8 6q0 4-3 5-2 1-5 1t-5-1q-3-1-3-5z",
  heart: "M57 62q-4-5-9-1-4 4 0 10 3 5 9 9 6-4 9-9 4-6 0-10-5-4-9 1z",
  liver: "M46 86q9-4 16 0 2 4 0 8-5 5-12 4-5-1-6-5t2-7z",
  stomach: "M68 85q5 1 6 6 1 6-3 10-3 3-5 1t0-5q2-4 1-7-2-4 1-5z",
  kidneys: "M52 103q3 0 3.5 7t-3 7-3.5-7 3-7zm16 0q3 0 3.5 7t-3 7-3.5-7 3-7z"
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
    viewBox: "0 0 120 250",
    class: "r13-bodymap",
    role: "img",
    focusable: "false"
  });
  const title = node("title", {});
  svg.append(title);

  for (const [tag, attrs] of BODY) {
    svg.append(node(tag, { ...attrs, class: "r13-bodymap-silhouette" }));
  }
  for (const [tag, attrs] of REPERES) {
    svg.append(node(tag, { ...attrs, class: "r13-bodymap-frame" }));
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

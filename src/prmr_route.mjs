/* PRMR — navigation unique du laboratoire.
 *
 * Avant ce module, chaque page portait sa propre barre de liens et nommait les
 * mêmes destinations différemment : screening.html s'appelait tour à tour
 * « Molécules », « Recherche computationnelle originale R02 », « R02 — 165
 * combinaisons » et « R02 · Molécules » selon la page d'où on venait. Une seule
 * source de vérité supprime cette confusion.
 *
 * Les cinq phases forment une séquence réelle — on part des preuves publiées et
 * on arrive aux conditions d'une recherche clinique — d'où la numérotation et le
 * balisage en liste ordonnée. Aucune donnée personnelle n'est lue ni stockée.
 */

const PHASES = [
  {
    file: "preclinical.html",
    phase: "01",
    name: "Preuves",
    full: "Preuves précliniques publiées",
    summary: "Études animales externes, mesurées et sourcées."
  },
  {
    file: "species-r04.html",
    phase: "02",
    name: "Anatomie",
    full: "Anatomie comparée 3D",
    summary: "Chien et chat, organes issus de CT, physiologie manipulable."
  },
  {
    file: "screening.html",
    phase: "03",
    name: "Molécules",
    full: "Criblage moléculaire",
    summary: "Dix molécules, 165 associations, calculs RDKit."
  },
  {
    file: "risk-r03.html",
    phase: "04",
    name: "Simulations",
    full: "Exposition et sensibilité",
    summary: "Stress-test PK/PD, hypothèses non calibrées."
  },
  {
    file: "clinical.html",
    phase: "05",
    name: "Clinique",
    full: "Conditions d'entrée en clinique",
    summary: "Anatomie humaine et critères encore manquants."
  }
];

const ASIDE = [
  { href: "./exposures.html", label: "Expositions" },
  { href: "./index.html?view=cloud", label: "Espace privé" },
  {
    href: "https://github.com/Aqmar3070/prmr-virtual-lab",
    label: "Code source",
    external: true
  }
];

const current = location.pathname.split("/").pop() || "index.html";
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const bar = el("nav", "prmr-routebar");
bar.setAttribute("aria-label", "Parcours de recherche PRMR");

const skip = el("a", "prmr-route-skip", "Aller au contenu principal");
skip.href = "#prmr-primary-content";
bar.append(skip);

const inner = el("div", "prmr-route-inner");

const brand = el("a", "prmr-route-brand");
brand.href = "./index.html";
brand.append(el("strong", null, "PRMR"), el("span", null, "Virtual Lab"));
if (current === "index.html") brand.setAttribute("aria-current", "page");
inner.append(brand);

/* La séquence est balisée en liste ordonnée : un lecteur d'écran annonce
   « 3 sur 5 » et la position dans le parcours devient audible. */
const list = el("ol", "prmr-route-steps");
for (const page of PHASES) {
  const item = el("li");
  const link = el("a", "prmr-route-step");
  link.href = "./" + page.file;
  link.title = page.full + " — " + page.summary;
  if (current === page.file) {
    link.setAttribute("aria-current", "page");
    item.className = "prmr-route-here";
  }
  link.append(
    el("small", "prmr-route-num", page.phase),
    el("span", "prmr-route-name", page.name)
  );
  item.append(link);
  list.append(item);
}
inner.append(list);

const aside = el("div", "prmr-route-aside");
for (const link of ASIDE) {
  const a = el("a", "prmr-route-aside-link", link.label);
  a.href = link.href;
  if (link.external) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  aside.append(a);
}
/* Rappel permanent du stade réel du programme. Il tenait sa propre bande
   pleine largeur sous la navigation : trois bandeaux se superposaient avant
   le premier contenu de chaque page. Le rappel est désormais une puce dans
   la même rangée, avec la phrase complète en infobulle et lisible par les
   lecteurs d'écran. */
const state = el("p", "prmr-route-state");
state.title = "Aucun essai clinique PRMR sur des personnes n’est autorisé.";
state.append(
  el("span", "prmr-status prmr-status-hypothesis", "Recherche exploratoire"),
  el(
    "span",
    "prmr-route-state-text",
    "Aucun essai clinique sur des personnes n’est autorisé."
  )
);
inner.append(aside);
bar.append(inner);
bar.append(state);

document.body.prepend(bar);

const main = document.querySelector("main");
if (main && !main.id) main.id = "prmr-primary-content";

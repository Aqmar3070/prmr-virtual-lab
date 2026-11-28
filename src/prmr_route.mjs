/* PRMR — navigation unique du laboratoire.
 *
 * Avant ce module, chaque page portait sa propre barre de liens et nommait les
 * mêmes destinations différemment : screening.html s'appelait tour à tour
 * « Molécules », « Recherche computationnelle originale R02 », « R02 — 165
 * combinaisons » et « R02 · Molécules » selon la page d'où on venait. Une seule
 * source de vérité supprime cette confusion.
 *
 * Depuis le 28/11/2026, le laboratoire tient en trois espaces : l'explorateur
 * préclinique (animal), l'explorateur clinique (humain) et les molécules. Les
 * anciennes pages (preuves, anatomie comparée, modélisation, recherche
 * clinique, criblage) restent en ligne mais ne sont plus au menu. Aucune
 * donnée personnelle n'est lue ni stockée.
 */

const PHASES = [
  {
    file: "preclinique.html",
    phase: "01",
    name: "Préclinique",
    full: "Explorateur préclinique",
    summary: "Animaux : substances, maladies et symptômes."
  },
  {
    file: "exposures.html",
    phase: "02",
    name: "Clinique",
    full: "Explorateur clinique",
    summary: "Humain : substances, maladies et symptômes."
  },
  {
    file: "molecules.html",
    phase: "03",
    name: "Molécules",
    full: "Molécules et plantes",
    summary: "Molécules, substances naturelles et combinaisons."
  }
];

const ASIDE = [
  { href: "./atelier.html?view=cloud", label: "Espace privé" },
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
  /* « Expositions » est un mot d'épidémiologiste. L'outil se cherche avec les
     mots de celui qui l'utilise : une substance, une dose, un effet. Et il ne
     peut pas rester le plus petit lien de la page, à côté du code source. */
  const a = el("a", "prmr-route-aside-link" + (link.primary ? " prmr-route-aside-primary" : ""), link.label);
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

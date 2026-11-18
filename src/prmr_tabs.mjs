/* PRMR — rubriques de page.
 *
 * Chaque page déroulait sept à onze sections à la suite : l'outil, les
 * registres détaillés, la méthode, les limites et les sources, tout ouvert en
 * même temps. On arrivait sur un mur de texte sans savoir où regarder.
 *
 * Ce module regroupe les sections en rubriques. Une seule est visible à la
 * fois, et les intitulés sont les mêmes d'une page à l'autre, de sorte qu'on
 * les apprend une fois :
 *
 *   Ce que ça montre → le résultat ou l'outil, ce pour quoi on est venu
 *   Les données      → les registres détaillés, pour qui veut vérifier
 *   La méthode       → comment c'est calculé, et ce que ça ne dit pas
 *   Les sources      → d'où vient chaque chiffre
 *
 * Une section se range dans une rubrique par son attribut data-prmr-tab. Les
 * sections sans attribut restent visibles en permanence, au-dessus des
 * rubriques : c'est la place de l'outil principal quand il doit rester sous
 * les yeux.
 *
 * Sans JavaScript, rien n'est masqué : toutes les sections restent lisibles.
 */

const ORDER = ["montre", "donnees", "methode", "sources"];

const LABELS = {
  montre: { label: "Ce que ça montre", hint: "Le résultat et l’outil" },
  donnees: { label: "Les données", hint: "Les registres détaillés" },
  methode: { label: "La méthode", hint: "Comment c’est calculé, et ses limites" },
  sources: { label: "Les sources", hint: "D’où vient chaque chiffre" }
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function mountTabs(root = document) {
  const sections = [...root.querySelectorAll("[data-prmr-tab]")];
  if (sections.length < 2) return null;

  const groups = new Map();
  for (const section of sections) {
    const key = section.dataset.prmrTab;
    if (!LABELS[key]) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(section);
  }
  const keys = ORDER.filter(k => groups.has(k));
  if (keys.length < 2) return null;

  const nav = el("nav", "prmr-tabs");
  nav.setAttribute("aria-label", "Rubriques de la page");
  const list = el("div", "prmr-tablist");
  list.setAttribute("role", "tablist");

  const buttons = new Map();
  for (const key of keys) {
    const button = el("button", "prmr-tab");
    button.type = "button";
    button.id = "prmr-tab-" + key;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "prmr-panel-" + key);
    button.append(
      el("span", "prmr-tab-label", LABELS[key].label),
      el("span", "prmr-tab-hint", LABELS[key].hint)
    );
    list.append(button);
    buttons.set(key, button);
  }
  nav.append(list);

  // Les sections ne sont pas déplacées : plusieurs d'entre elles sont les
  // enfants directs d'une grille CSS, et les envelopper dans un conteneur
  // détruisait leur placement — les vues 3D se retrouvaient larges de 26 px.
  // On se contente donc de masquer celles des rubriques inactives.
  keys.forEach((key, i) => {
    const ids = [];
    groups.get(key).forEach((section, j) => {
      if (!section.id) section.id = "prmr-section-" + key + "-" + j;
      ids.push(section.id);
      section.setAttribute("role", "tabpanel");
      section.setAttribute("aria-labelledby", "prmr-tab-" + key);
    });
    buttons.get(key).setAttribute("aria-controls", ids.join(" "));
  });

  /* La barre doit occuper toute la largeur de la page. Insérée juste avant sa
     section, elle se retrouvait à l'intérieur d'une grille — coincée dans une
     colonne, avec un grand vide à côté. On remonte donc jusqu'au bloc de
     premier niveau qui contient cette section, et on se place avant lui. */
  const firstSection = groups.get(keys[0])[0];
  const page = firstSection.closest("main") || document.body;
  let anchor = firstSection;
  while (anchor.parentNode && anchor.parentNode !== page) anchor = anchor.parentNode;
  anchor.parentNode.insertBefore(nav, anchor);

  let active = null;
  function show(key, { focus = false } = {}) {
    if (!groups.has(key) || key === active) return;
    active = key;
    for (const k of keys) {
      const on = k === key;
      for (const section of groups.get(k)) section.hidden = !on;
      const button = buttons.get(k);
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = on ? 0 : -1;
    }
    // Une vue 3D révélée a été mesurée alors qu'elle était masquée, donc à
    // taille nulle. Les visualiseurs écoutent le redimensionnement : on le
    // provoque pour qu'ils se remesurent.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    if (focus) {
      const target = groups.get(key)[0];
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    const url = new URL(location.href);
    url.hash = "rubrique-" + key;
    history.replaceState(null, "", url);
  }

  for (const [key, button] of buttons) {
    button.addEventListener("click", () => show(key, { focus: true }));
  }

  /* Flèches entre onglets, comme attendu d'une barre d'onglets. */
  list.addEventListener("keydown", event => {
    const index = keys.indexOf(active);
    let next = null;
    if (event.key === "ArrowRight") next = keys[(index + 1) % keys.length];
    else if (event.key === "ArrowLeft") next = keys[(index - 1 + keys.length) % keys.length];
    else if (event.key === "Home") next = keys[0];
    else if (event.key === "End") next = keys[keys.length - 1];
    if (!next) return;
    event.preventDefault();
    show(next, { focus: true });
    buttons.get(next).focus();
  });

  /* Un lien profond vers une section doit ouvrir la rubrique qui la contient,
     sinon la cible reste masquée et le lien paraît cassé. */
  function openFromHash() {
    const hash = decodeURIComponent(location.hash.replace("#", ""));
    if (!hash) return false;
    if (hash.startsWith("rubrique-") && groups.has(hash.slice(9))) {
      show(hash.slice(9));
      return true;
    }
    const target = document.getElementById(hash);
    if (!target) return false;
    for (const key of keys) {
      if (groups.get(key).some(section => section.contains(target))) {
        show(key);
        target.scrollIntoView({ block: "start" });
        return true;
      }
    }
    return false;
  }

  if (!openFromHash()) show(keys[0]);
  window.addEventListener("hashchange", openFromHash);

  // Un lien interne vers une section d'une autre rubrique doit l'ouvrir.
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    for (const key of keys) {
      if (key !== active && groups.get(key).some(section => section.contains(target))) {
        show(key);
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      }
    }
  });

  return { show, keys };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountTabs());
} else {
  mountTabs();
}

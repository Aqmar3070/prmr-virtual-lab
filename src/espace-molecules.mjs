// Espace Molécules : molécules (médicaments) et plantes (substances naturelles)
// tirées du registre des maladies, et combinaisons de 2 à 4 éléments.
// Aucun résultat chiffré n'est calculé pour une association : on montre ce qui
// est documenté (interactions de research-data/molecules.json, maladies et
// mécanismes de chaque élément), et on le dit quand rien ne l'est.
import { regrouper, combiner } from "./molecules.mjs";

const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const [registre, base] = await Promise.all([
  fetch("./research-data/maladies.json").then(r => r.json()),
  fetch("./research-data/molecules.json").then(r => r.json())
]);
const elements = regrouper(registre);
const FORCE = { forte: "Forte", moyenne: "Moyenne", faible: "Faible", cas: "Cas", preclinique: "Préclinique", theorique: "Théorique" };
let vue = new URLSearchParams(location.search).get("vue") === "plantes" ? "plantes" : "molecules";
let choix = [], fiche = null;
const sansAccent = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

for (const b of document.querySelectorAll("button[data-vue]")) b.onclick = () => { vue = b.dataset.vue; rendre(); };
$("mo-recherche").oninput = () => rendreListe();

function lien(cle, sources) {
  const s = sources?.[cle]; if (!s) return null;
  const a = el("a", null, s.source); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer"; return a;
}

function rendreListe() {
  const zone = $("mo-liste"); zone.replaceChildren();
  const q = sansAccent($("mo-recherche").value.trim());
  const liste = elements[vue].filter(x => !q || sansAccent(x.nom).includes(q));
  $("mo-compte").textContent = liste.length + " " + (vue === "plantes" ? "plantes et substances naturelles" : "molécules") + " du registre";
  for (const x of liste) {
    const ligne = el("div"); ligne.style.display = "flex"; ligne.style.gap = "4px";
    const b = el("button"); b.type = "button"; b.style.flex = "1"; b.setAttribute("aria-pressed", String(fiche === x));
    b.append(el("span", null, x.nom), el("small", null, x.maladies.length + " maladie" + (x.maladies.length > 1 ? "s" : "")));
    b.onclick = () => { fiche = x; rendreListe(); rendreFiche(); };
    const plus = el("button", null, "+"); plus.type = "button"; plus.title = "Ajouter à la combinaison"; plus.setAttribute("aria-label", "Ajouter " + x.nom + " à la combinaison");
    plus.disabled = choix.includes(x) || choix.length >= 4;
    plus.onclick = () => { choix.push(x); rendreListe(); rendreCombinaison(); };
    ligne.append(b, plus); zone.append(ligne);
  }
}

function rendreFiche() {
  const zone = $("mo-fiche"); zone.replaceChildren();
  if (!fiche) { zone.append(el("p", "es-etiq", "Choisissez un élément pour voir les maladies où il a été étudié.")); return; }
  zone.append(el("h3", null, fiche.nom));
  for (const u of fiche.maladies) {
    const d = el("details"); d.append(el("summary", null, u.maladie + " · " + (FORCE[u.force] || u.force)));
    const dl = el("dl");
    for (const [k, v] of [["Dose étudiée", u.dose], ["Résultat", u.effet], ["Mécanisme", u.mecanisme], ["Prudence", u.prudence]]) if (v) dl.append(el("dt", null, k), el("dd", null, v));
    d.append(dl);
    const a = lien(u.source, registre.sources); if (a) { const p = el("p", "es-etiq"); p.append(a); d.append(p); }
    zone.append(d);
  }
}

function rendreCombinaison() {
  const c = $("mo-choix"); c.replaceChildren();
  for (const x of choix) {
    const s = el("span", null, x.nom); const r = el("button", null, "×"); r.type = "button"; r.setAttribute("aria-label", "Retirer " + x.nom);
    r.onclick = () => { choix = choix.filter(y => y !== x); rendreListe(); rendreCombinaison(); };
    s.append(r); c.append(s);
  }
  const zone = $("mo-resultat"); zone.replaceChildren();
  if (choix.length < 2) { zone.append(el("p", "es-vide", "Ajoutez au moins deux éléments pour composer une association.")); return; }
  const r = combiner(choix, base.interactions);
  zone.append(el("h3", null, "Interactions documentées"));
  if (!r.interactions.length) zone.append(el("p", "es-vide", "Aucune interaction documentée dans la base PRMR pour ces éléments. Ce n’est pas une preuve d’absence : la base des interactions vient d’être créée."));
  for (const i of r.interactions) { const p = el("p", null, i.a + " + " + i.b + " : " + i.effet + " (" + i.nature + ")"); const a = lien(i.source, base.sources); if (a) p.append(" · ", a); zone.append(p); }
  zone.append(el("h3", null, "Maladies où ces éléments ont été étudiés"));
  const t = el("table"); const h = el("tr"); h.append(el("th", null, "Maladie"), ...choix.map(x => el("th", null, x.nom))); t.append(h);
  for (const ligne of r.maladies) {
    const tr = el("tr"); tr.append(el("td", null, ligne.maladie + (ligne.communs > 1 ? " · commun" : "")));
    for (const x of choix) { const u = ligne.par.get(x); tr.append(el("td", null, u ? (FORCE[u.force] || u.force) + (u.mecanisme ? " — " + u.mecanisme : "") : "—")); }
    t.append(tr);
  }
  zone.append(t);
  zone.append(el("p", "es-etiq", "Sauf mention dans une fiche, cette association n’a pas été étudiée ensemble dans le registre : son résultat est inconnu. Des mécanismes différents peuvent se compléter, des mécanismes identiques peuvent s’additionner ou se gêner — à vérifier."));
}

function rendre() {
  document.body.dataset.vue = vue;
  for (const b of document.querySelectorAll("button[data-vue]")) b.setAttribute("aria-pressed", String(b.dataset.vue === vue));
  $("mo-titre-liste").textContent = vue === "plantes" ? "Plantes et substances naturelles" : "Molécules";
  const u = new URL(location.href); u.searchParams.set("vue", vue); history.replaceState(null, "", u);
  fiche = null; rendreListe(); rendreFiche(); rendreCombinaison();
}
rendre();

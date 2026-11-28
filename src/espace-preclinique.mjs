// Explorateur préclinique : même organisation que l'explorateur clinique
// (Substances · Maladies · Symptômes), pour l'animal. La base est créée vide :
// rien n'est affiché qui ne soit dans research-data/preclinique.json.
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const VUES = { substances: "Substances", maladies: "Maladies", symptomes: "Symptômes" };

const base = await fetch("./research-data/preclinique.json").then(r => r.json());
const params = new URLSearchParams(location.search);
let vue = VUES[params.get("vue")] ? params.get("vue") : "substances";
let espece = base.especes.some(e => e.id === params.get("espece")) ? params.get("espece") : base.especes[0].id;
let choisi = null;

// Liste des espèces, groupées.
for (const [g, libelle] of Object.entries(base.groupes)) {
  const groupe = el("optgroup"); groupe.label = libelle;
  for (const e of base.especes.filter(x => x.groupe === g)) {
    const o = el("option", null, e.nom); o.value = e.id; groupe.append(o);
  }
  $("pc-espece").append(groupe);
}
$("pc-espece").value = espece;
$("pc-espece").onchange = () => { espece = $("pc-espece").value; choisi = null; rendre(); };
$("pc-recherche").oninput = () => rendreListe();
for (const b of document.querySelectorAll("[data-vue]")) if (b.tagName === "BUTTON") b.onclick = () => { vue = b.dataset.vue; choisi = null; rendre(); };

const concerne = x => !x.especes?.length || x.especes.includes(espece);
const sansAccent = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function rendreListe() {
  const zone = $("pc-liste"); zone.replaceChildren();
  const q = sansAccent($("pc-recherche").value.trim());
  const items = (base[vue] || []).filter(concerne).filter(x => !q || sansAccent(x.nom).includes(q));
  if (!items.length) {
    zone.append(el("p", "es-vide", (base[vue] || []).length
      ? "Aucune entrée pour cette recherche."
      : "Base créée, encore vide : aucune " + VUES[vue].toLowerCase().replace(/s$/, "") + " documentée pour le moment. Les entrées seront ajoutées une à une, chacune avec sa source."));
    return;
  }
  for (const x of items) {
    const b = el("button"); b.type = "button"; b.setAttribute("aria-pressed", String(choisi === x.id));
    b.append(el("span", null, x.nom));
    b.onclick = () => { choisi = x.id; rendre(); };
    zone.append(b);
  }
}

function rendreFigure() {
  const e = base.especes.find(x => x.id === espece);
  const f = $("pc-figure"); f.replaceChildren();
  const bloc = el("div");
  bloc.append(el("strong", null, e.nom), el("p", "es-etiq", e.nom_latin),
    el("p", "es-etiq", e.modele ? "" : "Modèle figé de l’espèce : emplacement réservé, ajouté plus tard."));
  f.append(bloc);
}

function rendreFiche() {
  const zone = $("pc-fiche"); zone.replaceChildren();
  const x = (base[vue] || []).find(y => y.id === choisi);
  if (!x) { zone.append(el("p", "es-etiq", "Choisissez une entrée dans la liste pour afficher sa fiche.")); return; }
  zone.append(el("h3", null, x.nom));
  const dl = el("dl");
  for (const [k, v] of Object.entries(x)) {
    if (["id", "nom"].includes(k) || v == null || typeof v === "object") continue;
    dl.append(el("dt", null, k.replace(/_/g, " ")), el("dd", null, String(v)));
  }
  zone.append(dl);
  const s = base.sources?.[x.source];
  if (s) { const a = el("a", null, s.source); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer"; const p = el("p", "es-etiq"); p.append(a); zone.append(p); }
}

function rendre() {
  document.body.dataset.vue = vue;
  for (const b of document.querySelectorAll("button[data-vue]")) b.setAttribute("aria-pressed", String(b.dataset.vue === vue));
  $("pc-titre-liste").textContent = VUES[vue];
  const u = new URL(location.href); u.searchParams.set("vue", vue); u.searchParams.set("espece", espece); history.replaceState(null, "", u);
  rendreListe(); rendreFigure(); rendreFiche();
}
rendre();

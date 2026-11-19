/* PRMR — étiquettes reliées à un point de la scène 3D.
 *
 * Écrites d'abord dans la console de doses, elles servent partout où un
 * rendu 3D doit nommer ce qu'il montre : l'anatomie humaine, l'animal, et
 * les consoles à venir. Ce module est leur seul exemplaire.
 *
 * Elles vivent en HTML au-dessus du canevas, jamais dans la scène : le texte
 * reste net à tout niveau de zoom, sélectionnable, et lisible par un lecteur
 * d'écran. Le calque laisse passer la souris pour que le modèle reste
 * saisissable dessous.
 */

const SVG = "http://www.w3.org/2000/svg";
const ECART = 8;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/* host doit être positionné (position:relative) et contenir le canevas. */
export function createCallouts(host, canvas) {
  const traits = document.createElementNS(SVG, "svg");
  traits.setAttribute("class", "prmr-callout-lines");
  traits.setAttribute("aria-hidden", "true");
  const calque = el("div", "prmr-callout-layer");
  host.append(traits, calque);

  let signature = "";

  /* items : [{ id, titre, detail, note, couleur, point:{x,y,visible} }]
     Les points sont en pixels du canevas — c'est à l'afficheur 3D de les
     fournir, lui seul connaît sa caméra. */
  function update(items) {
    const nouvelle = items.map(i => i.id).join("|");
    if (nouvelle !== signature) {
      signature = nouvelle;
      calque.replaceChildren();
      traits.replaceChildren();
      for (const item of items) {
        const boite = el("div", "prmr-callout");
        boite.dataset.id = item.id;
        boite.append(el("strong", null, item.titre));
        if (item.detail) boite.append(el("span", "prmr-callout-detail", item.detail));
        if (item.note) boite.append(el("span", "prmr-callout-note", item.note));
        boite.style.borderLeftColor = item.couleur || "";
        calque.append(boite);
        const trait = document.createElementNS(SVG, "polyline");
        trait.setAttribute("stroke", item.couleur || "currentColor");
        traits.append(trait);
      }
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    traits.setAttribute("viewBox", "0 0 " + rect.width + " " + rect.height);

    /* Posée chacune à la hauteur de son point, deux étiquettes voisines se
       recouvraient. On les répartit par côté, puis on les écarte. */
    const colonnes = { gauche: [], droite: [] };
    items.forEach((item, index) => {
      const boite = calque.children[index];
      const trait = traits.children[index];
      if (!boite) return;
      const point = item.point;
      if (!point || !point.visible) {
        boite.hidden = true;
        trait?.setAttribute("points", "");
        return;
      }
      boite.hidden = false;
      colonnes[point.x < rect.width / 2 ? "gauche" : "droite"].push({ point, boite, trait });
    });

    for (const [cote, membres] of Object.entries(colonnes)) {
      membres.sort((a, b) => a.point.y - b.point.y);
      let plancher = 4;
      for (const m of membres) {
        const h = m.boite.offsetHeight;
        m.y = Math.min(Math.max(m.point.y - h / 2, plancher), Math.max(4, rect.height - h - 4));
        plancher = m.y + h + ECART;
      }
      /* Une pile qui déborde est remontée, pas tronquée. */
      const derniere = membres[membres.length - 1];
      if (derniere) {
        const debord = derniere.y + derniere.boite.offsetHeight + 4 - rect.height;
        if (debord > 0) {
          let haut = 4;
          for (const m of membres) {
            m.y = Math.max(m.y - debord, haut);
            haut = m.y + m.boite.offsetHeight + ECART;
          }
        }
      }
      const aGauche = cote === "gauche";
      for (const m of membres) {
        const bx = aGauche ? 8 : rect.width - m.boite.offsetWidth - 8;
        m.boite.style.left = bx + "px";
        m.boite.style.top = m.y + "px";
        const ax = aGauche ? bx + m.boite.offsetWidth : bx;
        const ay = m.y + m.boite.offsetHeight / 2;
        const coude = aGauche ? ax + 18 : ax - 18;
        m.trait?.setAttribute("points", [ax, ay, coude, ay, m.point.x, m.point.y].join(" "));
      }
    }
  }

  return { update, dispose() { traits.remove(); calque.remove(); } };
}

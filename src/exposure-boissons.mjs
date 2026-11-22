// Bibliothèque de boissons courantes en Côte d'Ivoire, avec leur composition publiée.
// Teneurs par 100 mL : abv (% vol.), caf (mg de caféine), sug (g de sucres).
// Une teneur absente reste null : elle n'est pas estimée et se saisit depuis l'étiquette.
// Les jus et autres boissons de la base Ciqual (Anses) sont déjà dans le catalogue, avec leurs sucres.

const biere = (id, name, abv, source, url, note = "") => ({
  id, name, family: 4, unit: "mL",
  compo: { abv, caf: null, sug: null, label: name + " · " + (abv != null ? abv.toLocaleString("fr-FR") + " % vol. · " : "degré à lire sur l'étiquette · ") + source + (note ? " · " + note : ""), url },
});

export const BOISSONS = ([
  // Bières (Solibra, Abidjan)
  biere("biere-flag", "Flag Spéciale (bière, Solibra)", 5.2, "Untappd", "https://untappd.com/b/solibra-flag-speciale/997913"),
  biere("biere-castel", "Castel Beer (bière, Solibra)", 5.2, "Solibra", "https://www.solibra.ci/castel-beer-98.html", "formule allégée, auparavant 5,7 %"),
  biere("biere-bock", "Bock (bière, Solibra)", 4.8, "Wikipédia · Bock (bière)", "https://fr.wikipedia.org/wiki/Bock_(bi%C3%A8re)", "une autre source indique 6,5 % : vérifier l'étiquette"),
  biere("biere-guinness-fes", "Guinness Foreign Extra Stout", 7.5, "Guinness (version exportée)", "https://www.untappd.com/b/guinness-guinness-foreign-extra-stout/1199/variants", "version brassée sous licence : vérifier l'étiquette locale"),
  biere("biere-sombreros", "Sombreros (bière aromatisée, Solibra)", 5.5, "AIP", "https://www.aip.ci/cote-divoire-aip-solibra-reinvente-lexperience-festive-avec-sa-nouvelle-signature-sombreros-publireportage/?amp=1"),
  biere("biere-tuborg", "Tuborg (bière, Solibra)", null, "degré de la version ivoirienne non publié", "https://www.solibra.ci/"),
  // Boissons énergisantes
  { id: "energie-codys", name: "Cody's Energy (boisson énergisante)", family: 4, unit: "mL",
    compo: { abv: null, caf: 30, sug: null, label: "Cody's Energy · caféine 30 mg/100 mL (étiquette) · sucres non publiés", url: "https://fr.openfoodfacts.org/produit/4102610508115/cody-s" } },
  { id: "energie-monster", name: "Monster Energy (boisson énergisante)", family: 4, unit: "mL",
    compo: { abv: null, caf: 32, sug: null, label: "Monster Energy · caféine 32 mg/100 mL (étiquette) · glucides 12 g/100 mL, part des sucres à lire sur l'étiquette", url: "https://www.waitrose.com/ecom/products/monster-energy-drink-can/423832-59629-59630" } },
  // Café soluble préparé : 2 g de poudre pour 170 mL d'eau (Nestlé), 50 à 90 mg de caféine par 2 g → 70 mg retenus.
  { id: "cafe-nescafe", name: "Nescafé soluble préparé (2 g pour 170 mL)", family: 4, unit: "mL",
    compo: { abv: null, caf: 41, sug: 0, label: "Nescafé · 50 à 90 mg de caféine par 2 g (Nestlé) · calcul sur 70 mg par tasse de 170 mL, soit 41 mg/100 mL · sans sucre ajouté", url: "https://www.nescafe.com/faq" } },
]).map(b => ({ ...b, source: b.compo.label }));

// Substances naturelles locales absentes des tables officielles (100 g par jour par défaut, modifiable).
export const NATURELLES = [
  { id: "nat-kinkeliba", name: "Kinkéliba (feuilles, Combretum micranthum)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
  { id: "nat-papayer", name: "Papayer (feuilles, extrait)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
  { id: "nat-artemisia-annua", name: "Artemisia annua (feuilles en tisane)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
];
NATURELLES.push(
  { id: "nat-noni", name: "Noni (jus, Morinda citrifolia)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
  { id: "nat-neem", name: "Neem (feuilles, Azadirachta indica)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
  { id: "nat-kola-amer", name: "Kola amer (Garcinia kola)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
  { id: "nat-citronnelle", name: "Citronnelle (Cymbopogon citratus)", family: 2, unit: "g", source: "Fiche sourcée PRMR" },
);

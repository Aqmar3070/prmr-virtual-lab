// Logique de l'espace Molécules, sans interface (testée par tests/molecules.test.mjs).
// Molécules = substances de type « medicament » du registre des maladies ;
// plantes = substances de type « naturel ». Les régimes et les gestes n'y vont pas.
const CLASSE = { medicament: "molecules", naturel: "plantes" };

export function regrouper(registre) {
  const sortie = { molecules: new Map(), plantes: new Map() };
  for (const m of registre.maladies) for (const s of m.substances) {
    const classe = CLASSE[s.type]; if (!classe) continue;
    // Une association (« A + B ») n'est pas un élément : elle reste dans la fiche de la maladie.
    if (/ \+ /.test(s.nom)) continue;
    // « Metformine (antidiabétique) » et « Metformine (prévention) » sont la même molécule.
    const nom = s.nom.split(/ \(| — /)[0].trim();
    const table = sortie[classe];
    if (!table.has(nom)) table.set(nom, { nom, classe, maladies: [] });
    table.get(nom).maladies.push({ maladie: m.nom, maladieId: m.id, force: s.force, dose: s.dose, effet: s.effet, mecanisme: s.mecanisme, prudence: s.prudence, source: s.source });
  }
  const tri = t => [...t.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  return { molecules: tri(sortie.molecules), plantes: tri(sortie.plantes) };
}

// Pour 2 à 4 éléments : interactions documentées entre deux d'entre eux, et
// tableau des maladies où au moins un a été étudié (les maladies communes d'abord).
export function combiner(choix, interactions = []) {
  const noms = new Set(choix.map(x => x.nom));
  const inter = interactions.filter(i => noms.has(i.a) && noms.has(i.b) && i.a !== i.b);
  const lignes = new Map();
  for (const x of choix) for (const u of x.maladies) {
    if (!lignes.has(u.maladieId)) lignes.set(u.maladieId, { maladie: u.maladie, par: new Map(), communs: 0 });
    const l = lignes.get(u.maladieId);
    if (!l.par.has(x)) { l.par.set(x, u); l.communs++; }
  }
  const maladies = [...lignes.values()].sort((a, b) => b.communs - a.communs || a.maladie.localeCompare(b.maladie, "fr"));
  return { interactions: inter, maladies };
}

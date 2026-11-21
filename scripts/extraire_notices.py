#!/usr/bin/env python3
"""Extraction de la rubrique 4.8 (effets indésirables) des notices de la BDPM.

Pour chaque combinaison de substances actives commercialisée du catalogue, une
spécialité représentative est lue sur base-donnees-publique.medicaments.gouv.fr.
Chaque effet est relevé avec sa classe de systèmes d'organes et sa classe de
fréquence telles que la notice les écrit. Rien n'est inventé : un effet sans
fréquence lisible est gardé avec la fréquence « non précisée ».

Usage : python3 scripts/extraire_notices.py [--limite N] [--budget-minutes M] [--echantillons DOSSIER]
Reprise : les combinaisons déjà présentes dans le fichier de sortie sont sautées.
"""
import argparse, gzip, html, json, re, sys, time, unicodedata, urllib.request
from html.parser import HTMLParser

SORTIE = "research-data/notices-bdpm.json.gz"
CATALOGUE = "research-data/exposure-catalog.json.gz"
URL = "https://base-donnees-publique.medicaments.gouv.fr/affichageDoc.php?specid={}&typedoc=R"

FREQUENCES = [  # ordre : du plus long au plus court pour la reconnaissance
    ("frequence indeterminee", "indeterminee"), ("indeterminee", "indeterminee"),
    ("frequence inconnue", "indeterminee"), ("tres frequent", "tres_frequent"),
    ("peu frequent", "peu_frequent"), ("tres rare", "tres_rare"),
    ("frequent", "frequent"), ("rare", "rare"),
]


def plier(texte):
    t = unicodedata.normalize("NFD", texte)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t.lower()).strip()


def frequence_de(texte):
    """Classe de fréquence si le texte COMMENCE par un libellé de fréquence."""
    t = plier(texte).lstrip("·•-–* ")
    for libelle, code in FREQUENCES:
        if t.startswith(libelle) and (len(t) == len(libelle) or not t[len(libelle)].isalpha()):
            return code, texte[len(texte) - len(texte.lstrip("·•-–* ")) + len(libelle):].lstrip(" s:(")
    return None, texte


def est_classe(texte):
    t = plier(texte)
    return bool(re.match(r"^(affections?|troubles?|infections?|tumeurs?|lesions?|investigations?|caracteristiques|grossesse|actes medicaux|problemes)\b", t)) and len(t) < 140


class Lecteur(HTMLParser):
    """Transforme le HTML en blocs : paragraphes et tableaux (lignes de cellules)."""

    def __init__(self):
        super().__init__()
        self.blocs, self.tableau, self.ligne, self.cellule, self.texte = [], None, None, None, []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.vider(); self.tableau = []
        elif tag == "tr" and self.tableau is not None:
            self.ligne = []
        elif tag in ("td", "th") and self.ligne is not None:
            self.cellule = []
        elif tag in ("p", "br", "li", "div") and self.cellule is not None:
            self.cellule.append("\n")
        elif tag in ("p", "li", "br", "div", "h1", "h2", "h3", "h4"):
            self.vider()

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cellule is not None and self.ligne is not None:
            self.ligne.append("".join(self.cellule)); self.cellule = None
        elif tag == "tr" and self.ligne is not None and self.tableau is not None:
            self.tableau.append(self.ligne); self.ligne = None
        elif tag == "table" and self.tableau is not None:
            self.blocs.append(("tableau", self.tableau)); self.tableau = None
        elif tag in ("p", "li", "div") and self.tableau is None:
            self.vider()

    def handle_data(self, data):
        if self.cellule is not None:
            self.cellule.append(data)
        elif self.tableau is None:
            self.texte.append(data)

    def vider(self):
        t = re.sub(r"\s+", " ", "".join(self.texte)).strip()
        if t:
            self.blocs.append(("texte", t))
        self.texte = []


def section_48(page):
    debut = re.search(r"4\.8\.?\s*(?:<[^>]+>\s*)*Effets ind", page)
    if not debut:
        return None
    fin = re.search(r"4\.9\.?\s*(?:<[^>]+>\s*)*Surdosage|>\s*4\.9\b", page[debut.end():])
    return page[debut.start(): debut.end() + (fin.start() if fin else 60000)]


def effets_de_texte(texte):
    return [e.strip(" .;,") for e in re.split(r"[;,](?![^()]*\))", texte) if len(e.strip(" .;,")) > 2]


def analyser(section_html):
    lecteur = Lecteur()
    lecteur.feed(section_html)
    lecteur.vider()
    effets, classe = [], None

    def ajouter(cls, freq, texte):
        for e in effets_de_texte(texte):
            if plier(e).startswith(("classe de systeme", "frequence")):
                continue
            effets.append({"classe": cls, "frequence": freq or "non_precisee", "effet": e[:220]})

    for nature, contenu in lecteur.blocs:
        if nature == "texte":
            if est_classe(contenu) and not frequence_de(contenu)[0]:
                classe = contenu.rstrip(" :")
                continue
            freq, reste = frequence_de(contenu)
            if freq and classe and reste:
                ajouter(classe, freq, reste)
            elif ":" in contenu and est_classe(contenu.split(":", 1)[0]):
                cls, reste = contenu.split(":", 1)
                freq, reste2 = frequence_de(reste.strip())
                ajouter(cls.strip(), freq, reste2 if freq else reste)
        else:  # tableau
            lignes = [[re.sub(r"[ \t]+", " ", c).strip() for c in l] for l in contenu]
            if not lignes:
                continue
            entete = [frequence_de(c.split("\n")[0].strip())[0] if c else None for c in lignes[0]]
            colonnes = any(entete)
            for l in (lignes[1:] if colonnes else lignes):
                if not l:
                    continue
                cls = l[0].replace("\n", " ").strip()
                if colonnes and est_classe(cls):
                    for i, c in enumerate(l[1:], start=1):
                        if i < len(entete) and entete[i] and c.strip():
                            ajouter(cls, entete[i], c.replace("\n", " "))
                else:
                    # tableau « classe | fréquence | effet » ou « classe | effet avec fréquence en tête »
                    cellules = [c.replace("\n", " ").strip() for c in l if c.strip()]
                    if len(cellules) >= 3 and frequence_de(cellules[1])[0]:
                        ajouter(cellules[0] if est_classe(cellules[0]) else classe, frequence_de(cellules[1])[0], " ".join(cellules[2:]))
                        if est_classe(cellules[0]):
                            classe = cellules[0]
                    elif len(cellules) >= 2 and est_classe(cellules[0]):
                        classe = cellules[0]
                        for morceau in re.split(r"\n+", "\n".join(l[1:])):
                            f, r = frequence_de(morceau.strip())
                            if r.strip():
                                ajouter(classe, f, r)
                    elif len(cellules) == 2 and frequence_de(cellules[0])[0] and classe:
                        ajouter(classe, frequence_de(cellules[0])[0], cellules[1])
    # Dédoublonnage
    vus, uniques = set(), []
    for e in effets:
        cle = (plier(e["classe"] or ""), e["frequence"], plier(e["effet"]))
        if cle not in vus:
            vus.add(cle); uniques.append(e)
    return uniques


def texte_brut(section_html, limite=6000):
    t = re.sub(r"<[^>]+>", " ", section_html)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()[:limite]


def representants():
    cat = json.load(gzip.open(CATALOGUE))
    groupes = {}
    for e in cat:
        if not e[0].startswith("cis"):
            continue
        source = e[4]
        if "Non commercialis" in source or "Commercialis" not in source:
            continue
        cle = "+".join(sorted(set(e[5] or [])))
        if not cle:
            continue
        orale = "orale" in plier(source.split(" · ")[0])
        rang = (0 if orale else 1, len(e[1]))
        if cle not in groupes or rang < groupes[cle][0]:
            groupes[cle] = (rang, e[0][3:], e[1])
    return {cle: (cis, nom) for cle, (_, cis, nom) in groupes.items()}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--limite", type=int, default=0)
    p.add_argument("--budget-minutes", type=float, default=330)
    p.add_argument("--echantillons", default="")
    p.add_argument("--pause", type=float, default=0.6)
    a = p.parse_args()
    try:
        donnees = json.load(gzip.open(SORTIE))
    except FileNotFoundError:
        donnees = {"schema": "prmr-notices-bdpm-v1", "source": "Base de données publique des médicaments (ANSM), rubrique 4.8 des RCP",
                   "url_modele": URL, "notices": {}}
    reps = representants()
    a_faire = [k for k in reps if k not in donnees["notices"]]
    if a.limite:
        a_faire = a_faire[: a.limite]
    print(f"{len(reps)} combinaisons, {len(a_faire)} à lire", flush=True)
    t0, lus = time.time(), 0
    for cle in a_faire:
        if time.time() - t0 > a.budget_minutes * 60:
            print("Budget de temps atteint, reprise au prochain passage.", flush=True)
            break
        cis, nom = reps[cle]
        try:
            req = urllib.request.Request(URL.format(cis), headers={"User-Agent": "PRMR-Virtual-Lab/1.0 (recherche biomedicale)"})
            page = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
        except Exception as err:  # reprise possible au passage suivant
            print("échec", cis, err, flush=True); time.sleep(3); continue
        sec = section_48(page)
        enreg = {"cis": cis, "nom": nom, "url": URL.format(cis), "lu": time.strftime("%Y-%m-%d")}
        if sec:
            enreg["effets"] = analyser(sec)
            enreg["texte"] = texte_brut(sec)
        else:
            enreg["effets"], enreg["texte"] = [], ""
            enreg["remarque"] = "Rubrique 4.8 introuvable dans la notice"
        donnees["notices"][cle] = enreg
        if a.echantillons and lus < 25:
            open(f"{a.echantillons}/{cis}.html", "w", encoding="utf-8").write(sec or page[:20000])
        lus += 1
        if lus % 100 == 0:
            json.dump(donnees, gzip.open(SORTIE, "wt", encoding="utf-8"), ensure_ascii=False)
            print(f"{lus} lues", flush=True)
        time.sleep(a.pause)
    json.dump(donnees, gzip.open(SORTIE, "wt", encoding="utf-8"), ensure_ascii=False)
    total = len(donnees["notices"])
    avec = sum(1 for n in donnees["notices"].values() if n["effets"])
    print(f"Terminé : {total} notices, {avec} avec des effets structurés", flush=True)


if __name__ == "__main__":
    main()

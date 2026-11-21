#!/usr/bin/env python3
"""Affinage des notices extraites et production du fichier léger chargé par la page.

1. Relit le texte de la rubrique 4.8 dans l'ordre (classe d'organes → fréquence → effets),
   ce qui rattrape les mises en forme « Fréquent : » suivies de puces.
2. Garde, pour chaque notice, la lecture qui attribue une fréquence au plus grand nombre d'effets.
3. Nettoie les effets (retours chariot, renvois de notes, fragments).
4. Écrit research-data/notices-effets.json.gz sans le texte brut.
"""
import gzip, json, re, sys, unicodedata

ENTREE = sys.argv[1] if len(sys.argv) > 1 else "research-data/notices-bdpm.json.gz"
SORTIE = "research-data/notices-effets.json.gz"

# Classes de systèmes d'organes MedDRA, telles qu'écrites dans les RCP français.
CLASSES = [
    "Infections et infestations", "Tumeurs bénignes, malignes et non précisées", "Tumeurs bénignes, malignes et non précisées (incl kystes et polypes)",
    "Affections hématologiques et du système lymphatique", "Troubles du système sanguin et lymphatique", "Troubles hématologiques et du système lymphatique",
    "Affections du système immunitaire", "Troubles du système immunitaire", "Affections endocriniennes", "Troubles endocriniens",
    "Troubles du métabolisme et de la nutrition", "Affections psychiatriques", "Troubles psychiatriques",
    "Affections du système nerveux", "Troubles du système nerveux", "Affections oculaires", "Troubles oculaires",
    "Affections de l'oreille et du labyrinthe", "Affections cardiaques", "Troubles cardiaques", "Affections vasculaires", "Troubles vasculaires",
    "Affections respiratoires, thoraciques et médiastinales", "Troubles respiratoires, thoraciques et médiastinaux",
    "Affections gastro-intestinales", "Troubles gastro-intestinaux", "Affections hépatobiliaires", "Troubles hépatobiliaires",
    "Affections de la peau et du tissu sous-cutané", "Affections de la peau et des tissus sous-cutanés", "Troubles cutanés et des tissus sous-cutanés",
    "Affections musculo-squelettiques et du tissu conjonctif", "Affections musculo-squelettiques et systémiques", "Troubles musculo-squelettiques et du tissu conjonctif",
    "Affections du rein et des voies urinaires", "Troubles rénaux et urinaires", "Affections des organes de reproduction et du sein", "Troubles des organes de reproduction et du sein",
    "Affections congénitales, familiales et génétiques", "Troubles généraux et anomalies au site d'administration",
    "Investigations", "Lésions, intoxications et complications liées aux procédures", "Affections gravidiques, puerpérales et périnatales",
    "Grossesse, puerpéralité et conditions périnatales",
]
FREQ = [("frequence indeterminee", "indeterminee"), ("frequence inconnue", "indeterminee"), ("indeterminee", "indeterminee"),
        ("tres frequents", "tres_frequent"), ("tres frequent", "tres_frequent"), ("peu frequents", "peu_frequent"), ("peu frequent", "peu_frequent"),
        ("tres rares", "tres_rare"), ("tres rare", "tres_rare"), ("frequents", "frequent"), ("frequent", "frequent"), ("rares", "rare"), ("rare", "rare")]


def plier(t):
    t = unicodedata.normalize("NFD", t.replace("’", "'"))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower()


def lire_texte(texte):
    """Lecture séquentielle du texte brut (positions identiques dans le texte plié)."""
    plie = plier(texte)
    assert len(plie) == len(texte.replace("’", "'"))
    texte = texte.replace("’", "'")
    reperes = []
    for c in sorted(CLASSES, key=len, reverse=True):
        for m in re.finditer(re.escape(plier(c)), plie):
            if not any(a <= m.start() < b for a, b, *_ in reperes):
                reperes.append((m.start(), m.end(), "classe", texte[m.start():m.end()]))
    # Fréquence : libellé en début de segment, avec majuscule dans le texte d'origine, suivi de « : », « ( » ou d'une majuscule.
    for lib, code in FREQ:
        for m in re.finditer(r"(?<![a-z])" + re.escape(lib) + r"(?![a-z])", plie):
            if not texte[m.start()].isupper():
                continue
            suite = texte[m.end():m.end() + 30].lstrip()
            if suite.startswith((":", "(")) or (suite[:1].isupper() and not suite.startswith(("Affections", "Troubles"))) or suite.startswith("·"):
                if not any(a <= m.start() < b for a, b, *_ in reperes):
                    fin = m.end()
                    p = re.match(r"\s*\([^)]{0,40}\)", texte[fin:])
                    if p: fin += p.end()
                    p = re.match(r"\s*:", texte[fin:])
                    if p: fin += p.end()
                    reperes.append((m.start(), fin, "freq", code))
    reperes.sort()
    effets, classe, freq = [], None, None
    for i, (a, b, nature, val) in enumerate(reperes):
        fin = reperes[i + 1][0] if i + 1 < len(reperes) else min(len(texte), b + 600)
        contenu = texte[b:fin]
        if nature == "classe":
            classe, freq = val, None
        else:
            freq = val
        if classe and freq and nature == "freq":
            contenu = re.split(r"\b(Déclaration des effets|Population pédiatrique|Description d|Personnes âgées|Autres populations|\* |Les fréquences)", contenu)[0]
            for e in decouper(contenu):
                effets.append({"classe": classe, "frequence": freq, "effet": e})
    return effets


def nettoyer(e):
    e = re.sub(r"[\r\n\t]+", " ", e)
    e = re.sub(r"\s+", " ", e).strip(" ·•-–*;:,.")
    e = re.sub(r"(?<=[a-zé\)])\d{1,2}$", "", e).strip()  # renvoi de note collé : « hypersensibilité1 »
    return e


LIENS = ("de ", "du ", "des ", "d'", "et ", "ou ", "avec ", "incluant", "dont ", "comprenant", "notamment", "en particulier", "y compris", "a ", "à ", "chez ", "en ", "par ", "sur ")


def decouper(texte):
    morceaux = [m for m in re.split(r"·|•|;|\n|,(?![^()]*\))", texte)]
    sortie = []
    for m in morceaux:
        m = nettoyer(m)
        if len(m) < 3 or len(m) > 220:
            continue
        if sortie and (m[:1].islower() and plier(m).startswith(LIENS)):
            sortie[-1] = sortie[-1] + ", " + m
        else:
            sortie.append(m)
    return sortie


def qualite(effets):
    return sum(1 for e in effets if e["frequence"] not in ("non_precisee",))


def main():
    donnees = json.load(gzip.open(ENTREE))
    sortie = {"schema": "prmr-notices-effets-v1", "source": donnees.get("source"), "notices": {}}
    gagnes = 0
    for cle, n in donnees["notices"].items():
        html_effets = []
        for e in n.get("effets", []):
            for morceau in decouper(e["effet"]):
                html_effets.append({**e, "effet": morceau})
        # Rattacher les fragments du HTML (« de la langue et du larynx »)
        texte_effets = lire_texte(n.get("texte", "")) if n.get("texte") else []
        choix = texte_effets if qualite(texte_effets) > qualite(html_effets) else html_effets
        if choix is texte_effets and texte_effets:
            gagnes += 1
        # Tableaux « effet | fréquence » : la fréquence suit l'effet.
        fin_freq = re.compile(r"\s+(Très fréquents?|Fréquents?|Peu fréquents?|Rares?|Très rares?|Fréquence (?:indéterminée|inconnue)|Indéterminée)\s*$")
        if choix:
            corriges = []
            for e in choix:
                m = fin_freq.search(e["effet"])
                if m:
                    code = next(c for lib, c in FREQ if plier(m.group(1)) in (lib, lib + "s"))
                    corriges.append({**e, "effet": e["effet"][:m.start()].strip(), "frequence": code})
                else:
                    corriges.append(e)
            choix = corriges
        recolles = []
        for e in choix:
            if recolles and recolles[-1]["classe"] == e["classe"] and recolles[-1]["frequence"] == e["frequence"] \
                    and e["effet"][:1].islower() and plier(e["effet"]).startswith(LIENS):
                recolles[-1] = {**recolles[-1], "effet": recolles[-1]["effet"] + ", " + e["effet"]}
            else:
                recolles.append(dict(e))
        vus, uniques = set(), []
        for e in recolles:
            k = (plier(e["classe"] or ""), e["frequence"], plier(e["effet"]))
            if k not in vus:
                vus.add(k); uniques.append({"classe": (e["classe"] or "Autres").strip(" :"), "frequence": e["frequence"], "effet": e["effet"]})
        enreg = {"cis": n["cis"], "nom": n["nom"], "url": n["url"], "lu": n["lu"], "effets": uniques}
        if not uniques:
            nom = n["nom"].upper()
            enreg["remarque"] = n.get("remarque") or ("Préparation homéopathique : la notice ne liste pas d'effets indésirables" if any(w in nom for w in ("BOIRON", "LEHNING", "WELEDA", "DILUTION")) else "La rubrique 4.8 ne présente pas d'effets sous une forme lisible automatiquement")
            if "BOIRON" in nom or "DILUTION" in nom:
                enreg["remarque"] = "Préparation homéopathique : la notice ne liste pas d'effets indésirables"
        sortie["notices"][cle] = enreg
    json.dump(sortie, gzip.open(SORTIE, "wt", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    tot = sortie["notices"].values()
    print(f"{len(sortie['notices'])} notices · {sum(1 for n in tot if n['effets'])} avec effets · "
          f"{sum(len(n['effets']) for n in tot)} effets · {sum(qualite(n['effets']) for n in tot)} avec fréquence · lecture du texte retenue {gagnes} fois")


if __name__ == "__main__":
    main()

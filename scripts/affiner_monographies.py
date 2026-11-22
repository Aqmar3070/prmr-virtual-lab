#!/usr/bin/env python3
"""Nettoyage des monographies EMA extraites et traduction des formules usuelles.

Le texte PDF en deux colonnes (usage bien établi / usage traditionnel) se lit en doublon : les
répétitions immédiates sont supprimées. Les formules réglementaires récurrentes sont traduites
en français ; le reste du texte officiel reste en anglais, sans résumé.
"""
import gzip, json, re, sys

ENTREE = sys.argv[1] if len(sys.argv) > 1 else "research-data/monographies-ema.json.gz"
SORTIE = sys.argv[2] if len(sys.argv) > 2 else "research-data/monographies-ema.json.gz"
SECTIONS = ["posologie", "contre_indications", "mises_en_garde", "interactions", "grossesse", "conduite", "effets_indesirables", "surdosage"]

DEBUTS = [r"^and method of administration", r"^with other medicinal products and other forms of interaction", r"^and precautions for use",
          r"^lactation", r"^and use machines", r"^Pregnancy and lactation"]
BRUIT = [r"Well-established use", r"Traditional use", r"European Union herbal monograph on [^.]*?(?=\s[A-Z]|$)",
         r"EMA/HMPC/\S+", r"Page \d+/\d+", r"5\.\s*Pharmacological properties.*$", r"© European Medicines Agency.*$"]

TRADUCTIONS = [
 ("None known.", "Aucune connue."), ("None reported.", "Aucune rapportée."), ("None known", "Aucune connue"),
 ("Not applicable.", "Sans objet."), ("Hypersensitivity to the active substance.", "Hypersensibilité à la substance active."),
 ("Hypersensitivity to the active substance", "Hypersensibilité à la substance active"),
 ("No case of overdose has been reported.", "Aucun cas de surdosage n’a été rapporté."),
 ("No studies on the effect on the ability to drive and use machines have been performed.", "Aucune étude sur l’aptitude à conduire et à utiliser des machines."),
 ("If adverse reactions occur, a doctor or a qualified health care practitioner should be consulted.", "En cas d’effet indésirable, consulter un médecin ou un professionnel de santé qualifié."),
 ("If other adverse reactions not mentioned above occur, a doctor or a qualified health care practitioner should be consulted.", "En cas d’autre effet indésirable non mentionné, consulter un médecin ou un professionnel de santé qualifié."),
 ("The frequency is not known.", "Fréquence inconnue."), ("The frequency is unknown.", "Fréquence inconnue."), ("Frequency not known", "Fréquence inconnue"),
 ("Frequency: not known", "Fréquence : inconnue"), ("Frequency: common", "Fréquence : fréquent"), ("Frequency: uncommon", "Fréquence : peu fréquent"),
 ("Frequency: rare", "Fréquence : rare"), ("Frequency: very rare", "Fréquence : très rare"), ("Frequency: very common", "Fréquence : très fréquent"),
 ("Safety during pregnancy and lactation has not been established.", "La sécurité pendant la grossesse et l’allaitement n’a pas été établie."),
 ("In the absence of sufficient data, the use during pregnancy and lactation is not recommended.", "Faute de données suffisantes, l’usage pendant la grossesse et l’allaitement est déconseillé."),
 ("No fertility data available.", "Aucune donnée sur la fertilité."),
 ("The use in children under 12 years of age is not recommended", "Usage déconseillé chez l’enfant de moins de 12 ans"),
 ("The use in children and adolescents under 18 years of age is not recommended", "Usage déconseillé avant 18 ans"),
 ("due to lack of adequate data", "faute de données suffisantes"), ("because of lack of adequate data", "faute de données suffisantes"),
 ("Duration of use", "Durée d’usage"), ("Method of administration", "Mode d’administration"), ("Oral use", "Voie orale"), ("Cutaneous use", "Voie cutanée"),
 ("Adolescents, adults and elderly", "Adolescents, adultes et personnes âgées"), ("Adults and elderly", "Adultes et personnes âgées"),
 ("Herbal tea", "Tisane"), ("Single dose", "Dose unitaire"), ("Daily dose", "Dose journalière"), ("times daily", "fois par jour"),
 ("Hypersensitivity reactions", "Réactions d’hypersensibilité"), ("allergic reactions", "réactions allergiques"),
 ("Gastrointestinal disorders", "Affections gastro-intestinales"), ("Skin and subcutaneous tissue disorders", "Affections de la peau"),
 ("Immune system disorders", "Affections du système immunitaire"), ("Nervous system disorders", "Affections du système nerveux"),
 ("Hepatobiliary disorders", "Affections hépatobiliaires"), ("Renal and urinary disorders", "Affections du rein et des voies urinaires"),
 ("Cardiac disorders", "Affections cardiaques"), ("Vascular disorders", "Affections vasculaires"),
 ("Respiratory, thoracic and mediastinal disorders", "Affections respiratoires"), ("Psychiatric disorders", "Affections psychiatriques"),
 ("nausea", "nausées"), ("vomiting", "vomissements"), ("diarrhoea", "diarrhée"), ("abdominal pain", "douleurs abdominales"), ("heartburn", "brûlures d’estomac"),
 ("dyspepsia", "dyspepsie"), ("Stomach upset", "Troubles de l’estomac"), ("eructation", "éructations"), ("headache", "maux de tête"), ("dizziness", "vertiges"),
 ("rash", "éruption cutanée"), ("pruritus", "démangeaisons"), ("urticaria", "urticaire"), ("photosensitivity", "photosensibilité"),
]


def nettoyer(t):
    t = " ".join(t.split())
    for d in DEBUTS: t = re.sub(d, "", t, flags=re.I).strip()
    for b in BRUIT: t = re.sub(b, " ", t)
    t = re.sub(r"\s+", " ", t).strip(" .;:")
    # Répétition immédiate d'un passage (colonnes lues côte à côte).
    for _ in range(6):
        t2 = re.sub(r"(\b[^\s].{8,400}?[.,:;])\s+\1", r"\1", t)
        if t2 == t: break
        t = t2
    phrases, vues = [], set()
    for p in re.split(r"(?<=[.!?])\s+", t):
        k = p.strip().lower()
        if k and k not in vues: vues.add(k); phrases.append(p.strip())
    t = " ".join(phrases)
    for en, fr in sorted(TRADUCTIONS, key=lambda x: -len(x[0])): t = re.sub(re.escape(en.rstrip(".")), fr.rstrip("."), t, flags=re.I)
    if t and not t.endswith((".", ")")): t += "."
    t = re.sub(r"\b(Posology)\s+\1\b", r"\1", t)
    phrases, vues = [], set()
    for p in re.split(r"(?<=[.!?])\s+", t):
        k = p.strip().lower()
        if k and k not in vues: vues.add(k); phrases.append(p.strip())
    t = " ".join(phrases)
    return t


def main():
    d = json.load(gzip.open(ENTREE))
    sortie = {"schema": "prmr-monographies-ema-v2", "source": d.get("source"), "lu": d.get("lu"), "plantes": []}
    for p in d["plantes"]:
        e = {"latin": p.get("latin"), "commun": p.get("commun"), "page": p.get("page"),
             "issue": p.get("ligne", {}).get("Outcome of European assessment", ""), "botanique": p.get("ligne", {}).get("Botanical name", "")[:200]}
        if p.get("monographie"): e["monographie"] = p["monographie"]
        for k in SECTIONS:
            if p.get(k):
                v = nettoyer(p[k])
                if v: e[k] = v[:3000]
        sortie["plantes"].append(e)
    with gzip.open(SORTIE, "wt", encoding="utf-8") as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(",", ":"))
    print(len(sortie["plantes"]), "plantes ·", sum(1 for p in sortie["plantes"] if p.get("effets_indesirables")), "avec effets indésirables")


if __name__ == "__main__":
    main()

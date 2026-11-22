#!/usr/bin/env python3
"""Monographies de plantes de l'Agence européenne du médicament (EMA, comité HMPC).

1. Lit le tableau « Herbal medicines » de la page de téléchargement de l'EMA.
2. Pour chaque plante, ouvre sa page et télécharge la monographie de l'Union européenne (PDF, anglais).
3. Extrait les rubriques : 4.2 posologie, 4.3 contre-indications, 4.4 mises en garde, 4.5 interactions,
   4.6 grossesse, 4.8 effets indésirables, 4.9 surdosage, et le nom latin et commun.
4. Écrit research-data/monographies-ema.json.gz. Toutes les URL sont conservées pour la traçabilité.
"""
import gzip, io, json, re, subprocess, sys, tempfile, time, urllib.request
from html.parser import HTMLParser

BASE = "https://www.ema.europa.eu"
UA = {"User-Agent": "Mozilla/5.0 (PRMR Virtual Lab; recherche non commerciale)"}
SORTIE = "research-data/monographies-ema.json.gz"


def lire(url, binaire=False, essais=3):
    for i in range(essais):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                data = r.read()
                return data if binaire else data.decode("utf-8", "replace")
        except Exception as e:
            if i == essais - 1:
                print("échec", url, e, file=sys.stderr)
                return None
            time.sleep(3 * (i + 1))


class Liens(HTMLParser):
    def __init__(self):
        super().__init__(); self.liens = []; self._href = None; self._texte = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href = dict(attrs).get("href"); self._texte = []
    def handle_data(self, d):
        if self._href is not None: self._texte.append(d)
    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            self.liens.append((self._href, " ".join("".join(self._texte).split())))
            self._href = None


def liens(html):
    p = Liens(); p.feed(html or ""); return [(h if h.startswith("http") else BASE + h, t) for h, t in p.liens]


def tableau_plantes():
    page = lire(BASE + "/en/medicines/download-medicine-data")
    cible = [h for h, t in liens(page) if re.search(r"herbal", h + t, re.I) and re.search(r"\.xlsx", h, re.I)]
    print("tableaux trouvés :", cible[:5])
    import openpyxl
    for url in cible:
        data = lire(url, binaire=True)
        if not data: continue
        wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
        ws = wb.active
        lignes = [[(c if c is not None else "") for c in row] for row in ws.iter_rows(values_only=True)]
        entete = next(i for i, l in enumerate(lignes) if any(re.search(r"latin|herbal substance|name", str(c), re.I) for c in l))
        cols = [str(c).strip() for c in lignes[entete]]
        return url, [dict(zip(cols, l)) for l in lignes[entete + 1:] if any(l)]
    return None, []


SECTIONS = [("posologie", r"4\.2\.?\s+Posology"), ("contre_indications", r"4\.3\.?\s+Contraindications"),
            ("mises_en_garde", r"4\.4\.?\s+Special warnings"), ("interactions", r"4\.5\.?\s+Interactions"),
            ("grossesse", r"4\.6\.?\s+Fertility|4\.6\.?\s+Pregnancy"), ("conduite", r"4\.7\.?\s+Effects on ability"),
            ("effets_indesirables", r"4\.8\.?\s+Undesirable effects"), ("surdosage", r"4\.9\.?\s+Overdose"),
            ("fin", r"5\.\s+Pharmacological properties|5\.1\.?\s+Pharmacodynamic")]


def sections(texte):
    pos = []
    for nom, motif in SECTIONS:
        m = list(re.finditer(motif, texte))
        if m: pos.append((m[-1].start() if nom == "fin" else m[0].start(), m[0].end() if nom != "fin" else m[-1].start(), nom))
    pos.sort()
    res = {}
    for i, (a, b, nom) in enumerate(pos):
        if nom == "fin": continue
        fin = pos[i + 1][0] if i + 1 < len(pos) else len(texte)
        res[nom] = " ".join(texte[b:fin].split())[:6000]
    return res


def pdf_texte(data):
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(data); f.flush()
        return subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True).stdout


def main():
    source, plantes = tableau_plantes()
    print(len(plantes), "lignes dans le tableau")
    sortie = {"schema": "prmr-monographies-ema-v1", "source": source, "lu": time.strftime("%Y-%m-%d"), "plantes": []}
    debut = time.time()
    for ligne in plantes:
        if time.time() - debut > 300 * 60: break
        url_page = next((str(v) for v in ligne.values() if str(v).startswith("http")), None)
        nom = next((str(ligne[k]) for k in ligne if re.search(r"latin|substance", k, re.I) and ligne[k]), "")
        commun = next((str(ligne[k]) for k in ligne if re.search(r"common|english", k, re.I) and ligne[k]), "")
        statut = next((str(ligne[k]) for k in ligne if re.search(r"status|outcome", k, re.I) and ligne[k]), "")
        enreg = {"latin": nom, "commun": commun, "statut": statut, "page": url_page, "ligne": {k: str(v) for k, v in ligne.items() if v}}
        if url_page:
            page = lire(url_page)
            pdfs = [h for h, t in liens(page) if h.lower().endswith(".pdf") and re.search(r"monograph", h + t, re.I)
                    and not re.search(r"draft|assessment|list-references|overview|comments|translation|call|periodic-review|public-statement", h + t, re.I)]
            pdfs = [h for h in pdfs if "_en.pdf" in h] or pdfs
            # La monographie finale de l'Union européenne passe avant toute autre pièce.
            pdfs.sort(key=lambda h: (0 if "final-european-union-herbal-monograph" in h else 1 if "european-union-herbal-monograph" in h else 2, -len(re.findall(r"revision-(\d+)", h))))
            if pdfs:
                data = lire(pdfs[0], binaire=True)
                if data:
                    texte = pdf_texte(data)
                    enreg.update({"monographie": pdfs[0], **sections(texte)})
        sortie["plantes"].append(enreg)
        time.sleep(0.5)
    with gzip.open(SORTIE, "wt", encoding="utf-8") as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(",", ":"))
    n = sum(1 for p in sortie["plantes"] if p.get("effets_indesirables"))
    print(len(sortie["plantes"]), "plantes ·", n, "avec rubrique 4.8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Reproduction des calculs PRMR-R02 avec RDKit. Ne prédit aucune efficacité.
Exécution: python research-tools/prmr_r02_validate.py
Dépendance validée: RDKit 2025.09.4, Python >=3.11.
Les SMILES sont sourcés PubChem et les 45 empreintes sont archivées sous JSON.
"""
import itertools
import json
import math
from pathlib import Path
from rdkit import Chem, DataStructs, rdBase
from rdkit.Chem import Descriptors, Crippen, rdMolDescriptors, rdFingerprintGenerator

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/"research-data"/"prmr-r02-screen.json").read_text(encoding="utf-8"))
M=DATA["molecules"]
W=DATA["chemical_method"]["weights"]
P=DATA["chemical_method"]["penalties"]
assert rdBase.rdkitVersion == DATA["rdkit_version"], ("Version RDKit non reproduite",rdBase.rdkitVersion,DATA["rdkit_version"])
assert len(M)==10 and len(DATA["combinations"])==165
FPG=rdFingerprintGenerator.GetMorganGenerator(radius=2,fpSize=2048)
fps=[]

def almost(a,b,eps=0.012):
    assert abs(a-b)<=eps,(a,b,eps)

for d in M:
    mol=Chem.MolFromSmiles(d["smiles"])
    assert mol is not None, d["name"]
    assert rdMolDescriptors.CalcMolFormula(mol)==d["formula"],d["name"]
    almost(Descriptors.MolWt(mol),d["mass_g_mol"])
    almost(Crippen.MolLogP(mol),d["clogp"])
    almost(rdMolDescriptors.CalcTPSA(mol),d["tpsa_A2"])
    assert rdMolDescriptors.CalcNumHBD(mol)==d["hbd"],d["name"]
    assert rdMolDescriptors.CalcNumHBA(mol)==d["hba"],d["name"]
    assert rdMolDescriptors.CalcNumRotatableBonds(mol)==d["rotatable"],d["name"]
    fps.append(FPG.GetFingerprint(mol))

seen=set()
for c in DATA["combinations"]:
    idx=c["indices"]
    assert tuple(idx)==tuple(sorted(idx)) and tuple(idx) not in seen
    seen.add(tuple(idx))
    assert 2<=len(idx)<=3
    drugs=[M[i] for i in idx]
    assert [d["name"] for d in drugs]==c["agents"]
    sims=[DataStructs.TanimotoSimilarity(fps[a],fps[b]) for a,b in itertools.combinations(idx,2)]
    mean=sum(sims)/len(sims)
    almost(mean,c["tanimoto_mean"],0.00011)
    diversity=round(1-mean,4)
    almost(diversity,c["structural_diversity"],0.00011)
    axes={d["axis"] for d in drugs}
    cov=sum(W[x] for x in axes)
    score=round(cov+0.2*diversity-sum(P.get(d["name"],0) for d in drugs)-0.4*(len(drugs)-2),3)
    almost(score,c["priority_index"],0.0011)
    excluded=(len({d["class_code"] for d in drugs})!=len(drugs)
            or any(d["name"] in ["Allopurinol","Paricalcitol","Éplérénone"] for d in drugs))
    assert (c["status"]=="suspendue")==excluded,c["agents"]
    assert not c["experimental_efficacy_measured"] and not c["synergy_predicted"] and not c["cure_predicted"]

for i,j in itertools.combinations(range(10),2):
    similarity=DataStructs.TanimotoSimilarity(fps[i],fps[j])
    almost(similarity,DATA["pairwise_tanimoto_upper"][i][j-i-1],0.00006)

active=[x for x in DATA["combinations"] if x["status"]=="hypothese_in_silico"]
excluded=[x for x in DATA["combinations"] if x["status"]=="suspendue"]
assert len(active)==44 and len(excluded)==121
expected={
    ("Irbesartan","Dapagliflozine","Pirfénidone"):4.829,
    ("Irbesartan","Dapagliflozine","Pentoxifylline"):4.780,
}
for names,score in expected.items():
    c=next(x for x in active if tuple(x["agents"])==names)
    almost(c["priority_index"],score,0.000001)
print(f"PRMR-R02 / {len(M)} molécules RDKit {rdBase.rdkitVersion}; {len(seen)} associations contrôlées; {len(active)} hypothèses, {len(excluded)} suspendues")
print("Validation chimique réussie. Aucune prédiction de guérison ni expérience animale.")

#!/usr/bin/env python3
"""Sensitivity analysis for PRMR-R02 policy weights, not biological variability."""
import json
from pathlib import Path
from random import Random
from itertools import combinations

DATA=json.loads((Path(__file__).resolve().parents[1]/"research-data"/"prmr-r02-screen.json").read_text(encoding="utf-8"))
weights=DATA["chemical_method"]["weights"]
penalties=DATA["chemical_method"]["penalties"]
selected={"Irbesartan","Dapagliflozine","Pirfénidone","Pentoxifylline","Linagliptine"}
candidates=[c for c in DATA["combinations"] if c["status"]=="hypothese_in_silico"
  and c["n_agents"]==3 and set(c["agents"]).issubset(selected)]
assert len(candidates)==10
wins={tuple(x["agents"]):0 for x in candidates}
rng=Random(260116)
for _ in range(2000):
  w={a:v*(rng.uniform(0.8,1.2) if a in ["Fibrose","Inflammation","DPP4"] else 1) for a,v in weights.items()}
  p={a:v*rng.uniform(0.8,1.2) for a,v in penalties.items()}
  ranked=[]
  for c in candidates:
    coverage=sum(w[a] for a in set(c["axes"]))
    penalty=sum(p.get(n,0) for n in c["agents"])
    priority=round(coverage+0.2*c["structural_diversity"]-penalty-0.4*(len(c["agents"])-2),3)
    ranked.append((priority,tuple(c["agents"])))
  wins[max(ranked)[1]]+=1
for k,n in sorted(wins.items(),key=lambda x:-x[1]):
  if n:print(" + ".join(k),f"{n}/2000 = {100*n/2000:.2f}%")
expected1=("Irbesartan","Dapagliflozine","Pirfénidone")
expected2=("Irbesartan","Dapagliflozine","Pentoxifylline")
assert wins[expected1]==1161 and wins[expected2]==839,(wins[expected1],wins[expected2])
print("Aucun de ces pourcentages ne prédit une réponse biologique.")

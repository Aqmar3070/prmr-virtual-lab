#!/usr/bin/env python3
"""One-archive import of six PRMR R07 GLB models + six low-bandwidth WebP previews.
Only whitelisted paths can be extracted. Model SHA256 and declared byte sizes are checked.
"""
from pathlib import Path
import hashlib,json,sys,zipfile
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/"assets/animals-3d/manifest.json"
ZIP=ROOT/"incoming/PRMR_R07_modeles_3D_textures_legers.zip"
def fatal(message): raise SystemExit("PRMR R07: "+message)
def main():
 if not ZIP.is_file():fatal("Archive ZIP non téléversée : "+str(ZIP))
 catalog=json.loads(MANIFEST.read_text(encoding="utf-8"))
 entries=catalog["assets"]
 if len(entries)!=6:fatal("Six espèces exactement attendues")
 installed=[]
 with zipfile.ZipFile(ZIP) as z:
  for entry in entries:
   id=entry["species_id"]
   if id not in {"mouse","rat","pig","dog","nhp","rabbit"}:fatal("Espèce non reconnue")
   for kind,relative in (("glb",entry["asset"]),("webp",entry["poster"])):
    if Path(relative).is_absolute() or ".." in Path(relative).parts:fatal("Chemin suspect")
    zipname="prmr_3d_pack/"+relative
    if zipname not in z.namelist():fatal("Membre manquant : "+zipname)
    data=z.read(zipname)
    if kind=="glb":
     if len(data)!=entry["size_bytes"] or hashlib.sha256(data).hexdigest()!=entry["sha256"]:fatal("Empreinte GLB incorrecte : "+id)
     if not data.startswith(b"glTF"):fatal("En-tête GLB absent")
    else:
     if len(data)!=entry["poster_bytes"]:fatal("Taille WebP incorrecte : "+id)
     if data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":fatal("En-tête WebP absent")
    target=ROOT/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(data)
    installed.append(str(relative))
 catalog["status"]="Binaries imported and verified in repository"
 catalog["package_zip_sha256"]=hashlib.sha256(ZIP.read_bytes()).hexdigest()
 catalog["deployment"]="The binary files are committed to the repository; verify GitHub Pages separately"
 MANIFEST.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 for p in installed:print("IMPORTED",p,(ROOT/p).stat().st_size)
 print("SUCCESS:",len(installed),"verified binary assets")
if __name__=="__main__":main()

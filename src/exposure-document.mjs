// Les bibliothèques et le modèle français se téléchargent à la première lecture.
// Les octets du document sont traités dans le navigateur.
const pdfBase="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/";
const ocrBase="https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/";
export async function lireDocument(fichier,progression){
 if(fichier.size>20*1024*1024)throw Error("Le fichier dépasse 20 Mo.");
 let lecteur,document;
 async function ocr(image){
  progression("Reconnaissance du texte en français…");
  if(!lecteur){
   const {default:Tesseract}=await import(ocrBase+"tesseract.esm.min.js");
   lecteur=await Tesseract.createWorker("fra",1,{workerPath:ocrBase+"worker.min.js",corePath:"https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",langPath:"https://cdn.jsdelivr.net/npm/@tesseract.js-data/fra@1.0.0/4.0.0_best_int"});
  }
  return (await lecteur.recognize(image)).data.text;
 }
 try{
  if(fichier.type==="text/plain"||/\.txt$/i.test(fichier.name))return await fichier.text();
  if(/^image\/(png|jpeg|webp)$/.test(fichier.type))return await ocr(fichier);
  if(!/\.pdf$/i.test(fichier.name)&&fichier.type!=="application/pdf")throw Error("Formats acceptés : PDF, texte, JPEG, PNG ou WebP.");
  const pdf=await import(pdfBase+"pdf.min.mjs");pdf.GlobalWorkerOptions.workerSrc=pdfBase+"pdf.worker.min.mjs";
  document=await pdf.getDocument({data:await fichier.arrayBuffer(),isEvalSupported:false}).promise;
  if(document.numPages>50)throw Error("Sélectionnez un extrait de 50 pages au maximum.");
  const pages=[];
  for(let i=1;i<=document.numPages;i++){
   progression("Lecture de la page "+i+" sur "+document.numPages+"…");
   const page=await document.getPage(i),contenu=await page.getTextContent();
   let texte=contenu.items.map(x=>(x.str||"")+(x.hasEOL?"\n":" ")).join("");
   if(!texte.trim()){
    const taille=page.getViewport({scale:1}),vue=page.getViewport({scale:Math.min(2,1900/Math.max(taille.width,taille.height))});
    const canvas=window.document.createElement("canvas");canvas.width=Math.ceil(vue.width);canvas.height=Math.ceil(vue.height);
    await page.render({canvasContext:canvas.getContext("2d"),viewport:vue}).promise;
    texte=await ocr(canvas);canvas.width=canvas.height=0;
   }
   pages.push(texte);page.cleanup();
  }
  return pages.join("\n");
 }finally{if(lecteur)await lecteur.terminate();if(document)await document.destroy();}
}

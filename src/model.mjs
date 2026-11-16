// PRMR Virtual Lab 1.1 — modèle PK/PD exploratoire, sans calibration clinique.
export const DEFAULT_PARAMS = Object.freeze({
  dose:100, F:0.8, ka:1.2, V:40, CLh:3, CLr:1, renal:1, inhibition:0, EC50:1
});
export const PARAMS = Object.freeze({
  dose: {label:"Quantité fictive", unit:"mg", min:10,max:500,step:10},
  F: {label:"Biodisponibilité F", unit:"fraction", min:0.05,max:1,step:0.05},
  ka: {label:"Absorption kₐ", unit:"h⁻¹", min:0.1,max:3,step:0.05},
  V: {label:"Volume apparent V", unit:"L", min:10,max:150,step:5},
  CLh: {label:"Clairance hépatique CLh", unit:"L/h", min:0,max:10,step:0.25},
  CLr: {label:"Clairance rénale CLr", unit:"L/h", min:0,max:8,step:0.25},
  renal: {label:"Facteur rénal abstrait", unit:"sans unité", min:0,max:1.5,step:0.05},
  inhibition: {label:"Inhibition hépatique", unit:"fraction", min:0,max:0.9,step:0.05},
  EC50: {label:"EC50 théorique", unit:"mg/L", min:0.1,max:10,step:0.1}
});
export function validate(p) {
  for (const k of Object.keys(DEFAULT_PARAMS)) {
    if (!Number.isFinite(p[k])) throw new Error("Paramètre non numérique : " + k);
    const {min,max} = PARAMS[k];
    if (p[k] < min || p[k] > max) throw new Error("Hors limites : " + k);
  }
  if (p.V <= 0 || p.ka <= 0 || p.EC50 <= 0) throw new Error("Valeur positive requise");
  if (p.CLh * (1-p.inhibition) + p.CLr*p.renal <= 0) throw new Error("La clairance totale doit être supérieure à zéro");
  return true;
}
export function concentrationAt(p,t) {
  const cl = p.CLh*(1-p.inhibition)+p.CLr*p.renal;
  const ke=cl/p.V, diff=p.ka-ke;
  if (t===0 || p.F===0) return 0;
  const base=p.F*p.dose/p.V;
  if (Math.abs(diff)<1e-8) return base*p.ka*t*Math.exp(-ke*t);
  // expm1 améliore la stabilité numérique lorsque kₐ est proche de kₑ.
  return Math.max(0, base*p.ka*Math.exp(-ke*t)*(-Math.expm1(-diff*t))/diff);
}
export function evaluate(p) {
  validate(p);
  const CLhEff=p.CLh*(1-p.inhibition), CLrEff=p.CLr*p.renal;
  const CL=CLhEff+CLrEff, ke=CL/p.V;
  const diff=p.ka-ke;
  const Tmax=Math.abs(diff)<1e-8 ? 1/ke : Math.log(p.ka/ke)/diff;
  const Cmax=concentrationAt(p,Tmax);
  const AUC=p.F*p.dose/CL;
  const halfLife=Math.LN2/ke;
  const effect=100*Cmax/(p.EC50+Cmax);
  const horizon=Math.min(168,Math.max(24,Math.ceil(6/ke/12)*12));
  const times=Array.from({length:121},(_,i)=>horizon*i/120);
  const profile=times.map(t=>({t,c:concentrationAt(p,t)}));
  return {CLhEff,CLrEff,CL,ke,Tmax,Cmax,AUC,halfLife,effect,horizon,profile};
}
export function scenarioEnvelope(p) {
  validate(p);
  // Plan factoriel déterministe ±20 %: scénarios hypothétiques, PAS intervalles de confiance.
  const bounds=[];
  for (const f of [0.8,1,1.2])
    for (const h of [0.8,1,1.2])
      for (const r of [0.8,1,1.2]) {
        const q={...p,F:Math.min(1,p.F*f),CLh:p.CLh*h,CLr:p.CLr*r};
        // Validation ici distincte des limites des curseurs : le scénario peut dépasser leurs plages.
        const CL=q.CLh*(1-q.inhibition)+q.CLr*q.renal;
        const ke=CL/q.V, diff=q.ka-ke;
        const Tmax=Math.abs(diff)<1e-8?1/ke:Math.log(q.ka/ke)/diff;
        const Cmax=concentrationAt(q,Tmax);
        bounds.push({Cmax,AUC:q.F*q.dose/CL});
      }
  const min=k=>Math.min(...bounds.map(x=>x[k])), max=k=>Math.max(...bounds.map(x=>x[k]));
  return {Cmax:[min("Cmax"),max("Cmax")],AUC:[min("AUC"),max("AUC")], count:bounds.length};
}

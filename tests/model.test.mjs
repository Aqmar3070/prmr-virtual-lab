import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PARAMS, evaluate, concentrationAt, validate, scenarioEnvelope } from "../src/model.mjs";
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps, `${a} != ${b}`);
test("paramètres par défaut et unités AUC",()=>{
 const p={...DEFAULT_PARAMS}, r=evaluate(p);
 close(r.CL,4);close(r.ke,0.1);close(r.halfLife,Math.LN2/0.1);close(r.AUC,20);
});
test("C(0)=0, pic positif et concentration monotone après Tmax",()=>{
 const p={...DEFAULT_PARAMS}, r=evaluate(p);
 close(concentrationAt(p,0),0);
 assert.ok(r.Cmax>0);assert.ok(concentrationAt(p,r.Tmax+1)<r.Cmax);
});
test("limite analytique ka=ke",()=>{
 const p={...DEFAULT_PARAMS,ka:0.1},r=evaluate(p);
 close(r.Tmax,10);close(r.Cmax,p.F*p.dose/p.V*Math.exp(-1));
});
test("continuité près de ka=ke",()=>{
 const p={...DEFAULT_PARAMS,ka:0.1+1e-10},r=evaluate(p);
 assert.ok(Number.isFinite(r.Cmax));assert.ok(r.Cmax>0);
});
test("linéarité en quantité fictive",()=>{
 const a=evaluate(DEFAULT_PARAMS),b=evaluate({...DEFAULT_PARAMS,dose:200});
 close(b.Cmax/a.Cmax,2);close(b.AUC/a.AUC,2);
});
test("facteur rénal nul n'est pas un DFG",()=>{
 const r=evaluate({...DEFAULT_PARAMS,renal:0});
 close(r.CL,3);
});
test("rejet de clairance totale nulle",()=>{
 assert.throws(()=>validate({...DEFAULT_PARAMS,CLh:0,CLr:0}));
});
test("scénarios disponibles",()=>{
 const s=scenarioEnvelope({...DEFAULT_PARAMS});
 assert.equal(s.count,27);assert.ok(s.Cmax[0]<=s.Cmax[1]);assert.ok(s.AUC[0]<=s.AUC[1]);
});

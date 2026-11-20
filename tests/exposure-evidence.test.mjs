import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDay} from '../src/exposure-evidence.mjs';
const rows=[{id:'boisson',start:0,reduce:3,end:6,qty:500,after:250,caf:32,bed:true}];
const product=id=>({id,unit:'mL'});
test('Composition déclarée, réduction et arrêt',()=>{
 const at=t=>evaluateDay(rows,t,45,product);
 assert.equal(at(0).totals.caffeineMg,160);
 assert.equal(at(0).signals[0].zone,'brain');
 assert.equal(at(3).totals.caffeineMg,80);
 assert.equal(at(3).signals.length,0);
 assert.equal(at(6).available.size,0);
 assert.equal(at(0).available.has('sugarG'),false);
});
test('Caféine sans horaire et profil hors domaine',()=>{
 assert.equal(evaluateDay([{...rows[0],bed:false}],0,45,product).signals.length,0);
 assert.equal(evaluateDay(rows,0,16,product).signals.length,0);
});
test('Association rénale uniquement durant le chevauchement oral',()=>{
 const entries=['furosemide','losartan','ibuprofene'].map((name,i)=>({id:'cis'+i,start:i,reduce:5,end:6,qty:1,after:1}));
 const lookup=id=>id.startsWith('cis')?{id,unit:'unité',source:'orale · test',active:[id.slice(3)]}:{id,name:['furosémide','losartan','ibuprofène'][Number(id.slice(2))]};
 assert.equal(evaluateDay(entries,1,40,lookup).signals.length,0);
 assert.equal(evaluateDay(entries,2,40,lookup).signals[0].zone,'kidney_l');
});

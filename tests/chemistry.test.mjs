import test from "node:test";
import assert from "node:assert/strict";
import {enumerateStructures,similarity,normalizeDescriptor,EXAMPLES,SYSTEMS} from "../src/chemistry.mjs";
test("catalogue moléculaire non vide",()=>{assert.ok(EXAMPLES.length>=5);assert.ok(SYSTEMS.length>=10)});
test("énumération bornée et structures distinctes",()=>{const a=enumerateStructures(16);assert.equal(a.length,16);assert.equal(new Set(a.map(x=>x.smiles)).size,a.length)});
test("similarité identique = 1, disjointe = 0",()=>{assert.equal(similarity("10101","10101"),1);assert.equal(similarity("10100","01011"),0)});
test("similarité indéfinie si empreintes absentes",()=>{assert.equal(similarity("1","00"),null);assert.equal(similarity("",""),null)});
test("descripteurs manquants restent absents",()=>{const d=normalizeDescriptor('{"amw":180.15,"CrippenClogP":1.2,"tpsa":54.1}');assert.equal(d.mass,180.15);assert.equal(d.logp,1.2);assert.equal(d.hba,null)});
test("descripteurs alternatifs reconnus",()=>{const d=normalizeDescriptor({MolWt:100,TPSA:40,NumHDonors:1});assert.equal(d.mass,100);assert.equal(d.tpsa,40);assert.equal(d.hbd,1)});

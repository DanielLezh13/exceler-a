// Independent verification of trusted authored answers only. Never runs learner submissions.
// Run with CISC_JAVA_BIN=/path/to/jdk/bin when Java is not on PATH.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classroomValidationFixtures, mathPracticeAdditions, mathReviewAdditions, textPracticeAdditions, textReviewAdditions, synthesisQuestions, midtermMixedQuestions, xorPracticeQuestions } from "../app/data/cisc1115MidtermMaterial.ts";

const bin=process.env.CISC_JAVA_BIN;
const javac=bin?join(bin,"javac"):"javac",java=bin?join(bin,"java"):"java";
execFileSync(javac,["-version"],{stdio:"pipe"});
const questions=[...mathPracticeAdditions,...mathReviewAdditions,...textPracticeAdditions,...textReviewAdditions,...synthesisQuestions,...midtermMixedQuestions,...xorPracticeQuestions];
const normalize=s=>s.replace(/\r/g,"").replace(/\n$/,"");
const root=await mkdtemp(join(tmpdir(),"exceler-authored-java-"));
let runs=0,compiled=0;
try{
  for(const q of questions){
    const fixture=classroomValidationFixtures.get(q.id);if(!fixture)continue;
    const {spec,samples}=fixture,name=spec.className??"AuthoredCheck";
    const folder=join(root,q.id);await mkdir(folder);
    for(const [index,sample] of samples.entries()){
      let body=q.answer,random=0;
      body=body.replace(/Math\.random\(\)/g,()=>String(sample.random?.[random++]??.37));
      if(!spec.className){
        const inputs=Object.entries(spec.types??{}).map(([key,type])=>{
          const value=sample.values[key];
          const literal=type==="char"?`(char) ${typeof value==="string"?value.charCodeAt(0):value}`:type==="String"?JSON.stringify(value):type==="double"&&Number.isInteger(value)?`${value}.0`:String(value);
          return `${type} ${key} = ${literal};`;
        }).join("\n");
        const result=spec.resultVariable?`System.out.println(${new RegExp(`\\bchar\\s+${spec.resultVariable}\\b`).test(body)?"(int) ":""}${spec.resultVariable});`:"";
        body=`import java.util.*; import java.io.*; public class ${name} { public static void main(String[] args) throws Exception { ${inputs}\n${body}\n${result}\n}}`;
      }
      await writeFile(join(folder,`${name}.java`),body);
      execFileSync(javac,[`${name}.java`],{cwd:folder,stdio:"pipe",timeout:10000});compiled++;
      for(const [path,content] of Object.entries(sample.files??{}))await writeFile(join(folder,path),content);
      const actual=normalize(execFileSync(java,["-cp",folder,name],{cwd:folder,input:sample.input??"",encoding:"utf8",timeout:3000}));runs++;
      const expected=sample.output??sample.result;
      if(expected!==undefined){
        if(typeof expected==="number")assert.ok(Math.abs(Number(actual)-expected)<=1e-8*Math.max(1,Math.abs(expected)),`${q.id}/${index}: ${actual} vs ${expected}`);
        else if(spec.numericOutput){const a=actual.split("\n").map(Number),b=String(expected).split("\n").map(Number);assert.equal(a.length,b.length);a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<=(spec.numericTolerance??1e-8)*Math.max(1,Math.abs(b[i])),`${q.id}/${index}`));}
        else assert.equal(actual,normalize(String(expected)),`${q.id}/${index}`);
      }
      for(const [path,expected] of Object.entries(sample.outputFiles??{}))assert.equal(normalize(await readFile(join(folder,path),"utf8")),normalize(expected),`${q.id}/${index}/${path}`);
    }
  }
  console.log(`Independent JDK verification passed: ${compiled} compiled answers, ${runs} program runs across the authored input, file, and random fixtures.`);
}finally{await rm(root,{recursive:true,force:true});}

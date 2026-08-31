import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { degreeCourses, degreeAuditCourses } from "../app/data/curriculum.ts";
import { readMathRecords } from "../app/math/progress.ts";

const command=await readFile(new URL("../app/CommandCenter.tsx",import.meta.url),"utf8");
const component=await readFile(new URL("../app/DegreeElectives.tsx",import.meta.url),"utf8");
const modules={"react/jsx-runtime":jsx,"lucide-react":icons,"./data/curriculum":{degreeCourses,degreeAuditCourses}};
function compile(source,dependencies={}){
  dependencies={degreeAuditCourses,...dependencies};
  const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const result={};
  new Function("require","exports",...Object.keys(dependencies),js)(name=>{assert.ok(modules[name],name);return modules[name];},result,...Object.values(dependencies));
  return result;
}
const DegreePrerequisites=compile(await readFile(new URL("../app/DegreePrerequisites.tsx",import.meta.url),"utf8")).default;
modules["./DegreePrerequisites"]={default:DegreePrerequisites};
const DegreeElectives=compile(component).default;
const slice=(start,end)=>command.slice(command.indexOf(start),command.indexOf(end));
const definitions=compile(`${slice("const degreePathLevels:","const degreeWorksSnapshot:")}\n${slice("const degreeWorksSnapshot:","// Retained only")}\nexport {degreePathLevels,degreeWorksSnapshot,initialDegreeRecords};`,{degreeCourses});
const credits=compile(`${slice("function requirementKey(","function ProgressBar(")}\nexport {verifiedDegreeCredits};`,{degreeCourses}).verifiedDegreeCredits;
const parseAudit=compile(`${slice("function parseAuditText(","function parseAuditSnapshot(")}\nexport {parseAuditText};`,{degreeCourses}).parseAuditText;

function elements(node){
  if(Array.isArray(node))return node.flatMap(elements);
  if(!node?.props)return [];
  if(typeof node.type==="function"&&["DegreeElectives","DegreeCourseDrawer","DegreePrerequisites"].includes(node.type.name))return [node,...elements(node.type(node.props))];
  return [node,...elements(node.props.children)];
}
function text(node){if(Array.isArray(node))return node.map(text).join("");if(typeof node==="string"||typeof node==="number")return String(node);return node?.props?text(node.props.children):"";}
function button(tree,label){const found=elements(tree).find(n=>n.type==="button"&&(n.props["aria-label"]===label||text(n).trim()===label));assert.ok(found,label);return found;}

test("AI, ML and Software Engineering fill three elective slots, not an either-or/core requirement",()=>{
  let opened;
  const tree=DegreeElectives({records:{},onOpenCourse:c=>{opened=c;}}),nodes=elements(tree);
  const list=nodes.find(n=>n.type==="ol");
  assert.equal(React.Children.toArray(list.props.children).length,3);
  assert.match(text(tree),/3 additional classes required/);
  assert.match(text(tree),/Your elective plan/);
  assert.match(text(tree),/Elective 3CISC 3171Introduction to Software Engineering/);
  assert.match(text(tree),/do not replace Architecture, Algorithms\/Theory, Statistics, Ethics/);
  assert.match(text(tree),/not mandatory for everyone/);
  assert.equal(nodes.filter(n=>n.props.className==="or-label").length,0);
  for(const code of ["CISC 3410","CISC 3440","CISC 3171"]){
    const course=degreeCourses.find(c=>c.code===code);
    button(tree,`View ${code}: ${course.title}`).props.onClick();assert.equal(opened,course);
    assert.equal(course.stage,3);assert.equal(course.credits,3);assert.equal(course.choiceLabel,undefined);
    assert.equal(definitions.initialDegreeRecords[code],"unknown");
    assert.match(course.catalogUrl,/^https:\/\/websql\.brooklyn\.cuny\.edu/);
  }
  assert.equal(nodes.filter(n=>n.type===DegreePrerequisites).length,3);
  const advanced=definitions.degreePathLevels.find(l=>l.label==="Advanced branches");
  assert.ok(advanced.nodes.some(n=>n.kind==="electives"));
  for(const node of definitions.degreePathLevels.flatMap(l=>l.nodes))assert.ok(!node.codes?.some(code=>["CISC 3410","CISC 3440","CISC 3171"].includes(code)),"do not insert electives into required or OR lists");
  for(const [id,expected] of [["architecture-choice",["CISC 3310","CISC 3305"]],["theory-choice",["CISC 3220","CISC 3230"]],["probability-choice",["MATH 2501","MATH 3501"]],["ethics-choice",["CISC 2820W","PHIL 3318W"]]])assert.deepEqual(advanced.nodes.find(n=>n.id===id).codes,expected);
});

test("map course buttons use the real drawer and preserve unrelated official records",()=>{
  let selected=null,records={"CISC 2210":"in_progress","MATH 1201":"complete"};
  const {Check,Play,LockKeyhole,GitBranch,Upload,GraduationCap,ArrowRight,ArrowUpRight,X}=icons;
  const deps={Check,Play,LockKeyhole,GitBranch,Upload,GraduationCap,ArrowRight,ArrowUpRight,X,...definitions,degreeCourses,DegreeElectives,DegreePrerequisites,Fragment:React.Fragment,useState:()=>[selected,c=>{selected=c;}],titleCase:s=>s,mathCourses:[]};
  const {DegreeMap}=compile(`${slice("function pathNodeStatus(","function parseAuditText(")}\nexport {DegreeMap};`,deps);
  const render=()=>DegreeMap({records,setRecords:r=>{records=r;},snapshot:definitions.degreeWorksSnapshot,onImport(){}});
  let tree=render();
  assert.equal(selected,null);
  button(tree,"View CISC 3171: Introduction to Software Engineering").props.onClick();tree=render();
  const drawer=elements(tree).find(n=>n.props.className==="degree-drawer");
  assert.match(text(drawer),/CISC 3171Introduction to Software Engineering/);
  assert.ok(elements(drawer).find(n=>n.type==="a"&&n.props.href.includes("crs_num=3171")));
  assert.ok(elements(drawer).find(n=>n.props["aria-label"]==="CISC 3171 prerequisites"));
  const complete=elements(drawer).find(n=>n.type==="button"&&text(n).trim().startsWith("CompleteCredit earned"));
  assert.ok(complete,"official Complete status control is present");
  complete.props.onClick();tree=render();
  assert.deepEqual(records,{"CISC 2210":"in_progress","MATH 1201":"complete","CISC 3171":"complete"});
  const electiveBubble=elements(tree).find(n=>String(n.props.className).startsWith("degree-branch-bubble electives"));
  assert.ok(!electiveBubble.props.className.includes("complete"),"one completed example must not clear the three-elective requirement");
});

test("three completed electives count independently and prerequisite alternatives survive backups",()=>{
  const records={"CISC 3410":"complete","CISC 3440":"complete","CISC 3171":"complete","CISC 3310":"complete","CISC 3305":"complete","CISC 3225":"complete"};
  assert.equal(credits(records),13,"9 elective credits plus one 4-credit architecture choice; prerequisite-only alternatives do not add another required slot");
  const {readProgressBackup}=compile(`${slice("const objectValue =", "function ProgressBackupDialog(")}\nexport {readProgressBackup};`,{...definitions,degreeCourses,readMathRecords,learningChapters:[],practiceQuestions:{},unitMasteryTests:[],legacyReadingCheckpointId:id=>id});
  const backup=JSON.parse(JSON.stringify({app:"Exceler A",version:1,data:{completed:[],practice:{},degreeRecords:records,auditSnapshot:definitions.degreeWorksSnapshot}}));
  const restored=readProgressBackup(backup);
  for(const [code,status] of Object.entries(records))assert.equal(restored.degreeRecords[code],status);
  const old=readProgressBackup({app:"Exceler A",version:1,data:{degreeRecords:{"CISC 2210":"complete"}}});
  assert.equal(old.degreeRecords["CISC 2210"],"complete");
  assert.equal(old.degreeRecords["CISC 3410"],"unknown");assert.equal(old.degreeRecords["CISC 3440"],"unknown");
  assert.equal(old.degreeRecords["CISC 3171"],"unknown");assert.equal(old.degreeRecords["CISC 3225"],"unknown");
});

test("audit parsing recognizes named elective courses without inventing their completion",()=>{
  assert.equal(parseAudit("CISC 3410 Artificial Intelligence A 3")["CISC 3410"],"complete");
  assert.equal(parseAudit("CISC 3440 Machine Learning IP (3)")["CISC 3440"],"in_progress");
  assert.equal(parseAudit("Still needed: CISC 3410")["CISC 3410"],"not_started");
  assert.equal(parseAudit("MATH 3410 A 3")["CISC 3410"],undefined);
  assert.equal(parseAudit("CISC 3171 Introduction to Software Engineering A 3")["CISC 3171"],"complete");
  assert.equal(parseAudit("CISC 3225 Data Tools and Algorithms B 3")["CISC 3225"],"complete");
});

const prereqs=(code,records)=>DegreePrerequisites({course:degreeCourses.find(c=>c.code===code),records});
const statusRows=tree=>elements(tree).filter(n=>String(n.props.className).startsWith("prerequisite-course "));

test("Software Engineering checks only an officially completed prerequisite, not in-progress or absent data",()=>{
  for(const [status,label] of [["complete","Complete"],["in_progress","In progress"],["not_started","Still needed"],["unknown","Not confirmed"]]){
    const records=Object.freeze({"CISC 3130":status,"CISC 3171":"unknown"});
    const rows=statusRows(prereqs("CISC 3171",records));
    assert.equal(rows.length,1);assert.match(text(rows[0]),new RegExp(label));
    assert.equal(rows[0].props.className.includes(" complete"),status==="complete");
    assert.equal(records["CISC 3171"],"unknown","prerequisite completion must not complete the course");
  }
  assert.match(text(prereqs("CISC 3171",{})),/Not confirmed/);
  assert.match(text(prereqs("CISC 3410",{})),/legacy CIS 21/);
});

test("Machine Learning requires one completed option from BOTH groups",()=>{
  const met=records=>elements(prereqs("CISC 3440",records)).filter(n=>n.props.className==="prerequisite-group met").length;
  assert.equal(met({"CISC 3130":"complete"}),1);
  assert.equal(met({"MATH 2501":"complete","MATH 3501":"complete"}),1);
  assert.equal(met({"CISC 3130":"complete","CISC 2210":"in_progress"}),1);
  assert.equal(met({"CISC 3130":"complete","CISC 2210":"complete"}),2);
  assert.equal(met({"CISC 3225":"complete","MATH 3501":"complete"}),2);
  assert.match(text(prereqs("CISC 3440",{})),/AND · Choose one route/);
});

test("reviewed audit statuses drive prerequisite checkmarks without borrowing another course's grade",()=>{
  const records=parseAudit("CISC 3130 Data Structures A 3\nCISC 2210 Discrete Structures B 3\nStill needed: CISC 3171\nStill needed: CISC 3440");
  assert.equal(records["CISC 3130"],"complete");
  assert.equal(records["CISC 3171"],"not_started");
  assert.equal(statusRows(prereqs("CISC 3171",JSON.parse(JSON.stringify(records))))[0].props.className,"prerequisite-course complete");
  const wrongNeighbor=parseAudit("Still needed: CISC 3130\nCISC 3171 Introduction to Software Engineering A 3");
  assert.equal(wrongNeighbor["CISC 3130"],"not_started");
  assert.equal(wrongNeighbor["CISC 3171"],"complete");
  assert.equal(statusRows(prereqs("CISC 3171",wrongNeighbor))[0].props.className,"prerequisite-course not_started");
});

test("every First Unlocks, Core and Advanced course option shows its own prerequisites",()=>{
  const {Check,Play,LockKeyhole,GitBranch,Upload,GraduationCap,ArrowRight,ArrowUpRight,X}=icons;
  const deps={Check,Play,LockKeyhole,GitBranch,Upload,GraduationCap,ArrowRight,ArrowUpRight,X,...definitions,degreeCourses,DegreeElectives,DegreePrerequisites,Fragment:React.Fragment,useState:()=>[null,()=>{}],titleCase:s=>s,mathCourses:[]};
  const {DegreeMap}=compile(`${slice("function pathNodeStatus(","function parseAuditText(")}\nexport {DegreeMap};`,deps);
  const records=Object.freeze({"MATH 1201":"complete","CISC 1115":"in_progress"});
  const tree=DegreeMap({records,setRecords(){throw new Error("render must not update saved records");},snapshot:definitions.degreeWorksSnapshot,onImport(){}});
  const nodes=elements(tree);
  assert.match(text(tree),/You do not need to finish a whole row/);
  assert.doesNotMatch(text(tree),/Start at the top|Design & implementation II/);
  const levels=definitions.degreePathLevels.filter(l=>["First unlocks","Core construction","Advanced branches"].includes(l.label));
  for(const code of levels.flatMap(l=>l.nodes.flatMap(n=>n.codes??[]))){
    const course=degreeCourses.find(c=>c.code===code);
    assert.ok(course.prerequisites?.length,code);
    assert.ok(course.catalogUrl?.includes("websql.brooklyn.cuny.edu"),code);
    const wrap=nodes.find(n=>n.props.className==="bubble-option-wrap"&&React.Children.toArray(n.props.children).some(c=>c.type==="button"&&text(c).startsWith(code)));
    assert.ok(wrap,code);
    assert.ok(elements(wrap).some(n=>n.props["aria-label"]===`${code} prerequisites`),code);
    const courseButton=elements(wrap).find(n=>n.type==="button");
    assert.ok(!elements(courseButton).some(n=>n.type==="details"),"disclosures must not be nested in a button");
  }
  assert.equal(degreeCourses.find(c=>c.code==="CISC 3140").title,"Design and Implementation of Large-Scale Applications");
  assert.match(degreeCourses.find(c=>c.code==="CISC 3140").prerequisiteText,/does not require a separate/);
});

const metGroups=(code,records)=>elements(prereqs(code,records)).filter(n=>n.props.className==="prerequisite-group met").length;
test("alternate two-course routes require BOTH courses, never just one",()=>{
  assert.equal(metGroups("CISC 3115",{"CISC 1113":"complete"}),0);
  assert.equal(metGroups("CISC 3115",{"CISC 1113":"complete","CISC 1114":"in_progress"}),0);
  assert.equal(metGroups("CISC 3115",{"CISC 1113":"complete","CISC 1114":"complete"}),1);
  assert.equal(metGroups("CISC 3115",{"CISC 1115":"complete"}),1);
  assert.equal(metGroups("CISC 3130",{"CISC 3110":"complete"}),0);
  assert.equal(metGroups("CISC 3130",{"CISC 3110":"complete","CISC 1170":"complete"}),1);
  assert.equal(metGroups("CISC 3130",{"CISC 3115":"complete"}),1);
  assert.match(text(prereqs("CISC 3130",{})),/Other accepted routes/);
  assert.match(text(prereqs("CISC 3130",{})),/AND · both courses/);
});

test("advanced branches follow actual dependencies, not a universal previous-row gate",()=>{
  const records=Object.freeze({"CISC 1115":"complete","CISC 2210":"complete"});
  assert.equal(metGroups("CISC 3310",records),2,"architecture does not need Data Structures or Calculus II");
  assert.equal(metGroups("CISC 3142",{...records,"CISC 3130":"complete","CISC 3305":"complete"}),2,"3305 is not silently substituted for 3310 in C++ Paradigms");
  assert.equal(metGroups("CISC 3142",{...records,"CISC 3130":"complete","CISC 3310":"complete"}),3);
  assert.equal(metGroups("CISC 3320",{"CISC 3130":"complete","CISC 3305":"complete"}),2);
  for(const code of ["CISC 3220","CISC 3230"])assert.equal(metGroups(code,{...records,"CISC 3130":"complete","MATH 1201":"complete"}),3);
  assert.equal(metGroups("MATH 3501",{"MATH 1206":"complete"}),0);
  assert.equal(metGroups("MATH 3501",{"MATH 2201":"complete"}),1);
  assert.equal(metGroups("MATH 2501",{"MATH 1206":"complete"}),1);
  for(const code of ["CISC 2820W","PHIL 3318W"]){
    assert.equal(metGroups(code,records),1);
    assert.equal(metGroups(code,{...records,"ENGL 1012":"complete"}),2);
  }
});

test("grade, placement and equivalency conditions remain unconfirmed by completion alone",()=>{
  const calculus=prereqs("MATH 1201",{});
  assert.match(text(calculus),/placement-test scores or departmental permission/);
  assert.match(text(calculus),/C− or higher/);
  assert.equal(metGroups("MATH 1201",{}),0);
  assert.equal(metGroups("CISC 2210",{"CISC 1115":"complete","MATH 1201":"complete"}),1,"later math completion does not fabricate a placement record");
  const gradeNote=prereqs("MATH 1206",{"MATH 1201":"complete"});
  assert.match(text(gradeNote),/completion alone does not verify the grade/);
  assert.doesNotMatch(text(gradeNote),/eligible|satisfied/i);
  assert.match(text(prereqs("CISC 3142",{})),/Not open to students who completed CISC 3110/);
});

test("additional prerequisite-only audit courses do not become required credit or borrow neighboring grades",()=>{
  const records=parseAudit("Still needed: CISC 3130\nENGL 1012 English Composition II A 3\nMATH 2201 Multivariable Calculus B 4\nStill needed: CISC 1000\nCORC 1312 Core A 3");
  assert.equal(records["CISC 3130"],"not_started");
  assert.equal(records["CISC 1000"],"not_started");
  assert.equal(records["ENGL 1012"],"complete");
  assert.equal(records["MATH 2201"],"complete");
  assert.equal(records["CORC 1312"],"complete");
  assert.equal(credits(records),0,"prerequisite-only course credits do not inflate mapped degree requirements");
  assert.equal(parseAudit("MATH 1012 Precalculus C 3")["ENGL 1012"],undefined);
  assert.equal(parseAudit("ENGL 1012 Composition B 3")["MATH 1012"],undefined);
  for(const course of degreeCourses){
    for(const group of course.prerequisites??[]){
      for(const code of group.anyOf.flat())assert.ok(degreeAuditCourses.some(c=>c.code===code),`${code} must survive imports/backups`);
    }
  }
});

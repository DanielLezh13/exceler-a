import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { midtermStudyGuideChapter as chapter, studyGuideGroups, studyGuideRehearsal, studyGuideValidationFixtures, studyGuideTraceFixtures } from "../app/data/cisc1115MidtermStudyGuide.ts";
import { cisc1115ProfessorTrack, cisc1115ProfessorAddedChapters } from "../app/data/cisc1115ProfessorTrack.ts";
import { mathPracticeAdditions } from "../app/data/cisc1115MidtermMaterial.ts";
import { validateClassroomJava } from "../app/classroomJavaValidation.ts";
import { loadCourseModel } from "../scripts/lib/course-model.mjs";

const q=key=>chapter.reviewQuestions.find(q=>q.id===`study-guide-${key}`);
const mutate=(question,from,to)=>{assert.ok(question.answer.includes(from));return question.answer.replaceAll(from,to);};

test("the dedicated study guide is last in Java and keeps the original midterm and every earlier chapter",async()=>{
  const route=cisc1115ProfessorTrack.flatMap(g=>g.entries);
  assert.equal(route.at(-1).id,"midterm-study-guide");
  assert.equal(route.at(-2).id,"final-assessment");
  assert.equal(route.filter(e=>e.id==="midterm-practice").length,1);
  assert.equal(chapter.sections.length,8);
  const model=await loadCourseModel(),plan=model.chapterPracticePlan(chapter.id);
  assert.deepEqual(plan.review,studyGuideRehearsal.map(q=>q.id));
  const ids=[...Object.values(plan.checkpoints).flat(),...plan.review];
  assert.deepEqual([...ids].sort(),chapter.reviewQuestions.map(q=>q.id).sort());
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(chapter.reviewQuestions.length,106);
  const all=cisc1115ProfessorAddedChapters.flatMap(c=>c.reviewQuestions.map(q=>q.id));
  assert.equal(new Set(all).size,all.length,"old and new saved question identities cannot collide");
  for(const group of studyGuideGroups){assert.ok(group.questions.length>0);assert.ok(group.section.lead);assert.ok(group.section.examples?.length);}
  for(const question of chapter.reviewQuestions.filter(q=>!q.options))assert.equal(model.questionUsesJavaEditor(question),Boolean(question.productionStage),`${question.id}: result questions must use result inputs, production questions the Java editor`);
});

test("all seven guide families include recognizable anchors and progressively independent practice",()=>{
  for(const key of ["guide-history","guide-conversion","binary-guide","hex-guide","decimal-binary-guide","decimal-hex-guide","binary-add-guide","guide-books","guide-formula","guide-files","string-guide-concat","string-guide-substring","string-guide-char","string-guide-bounds","string-guide-order","string-guide-case"])assert.ok(q(key),key);
  assert.equal(studyGuideGroups.slice(1).length,7);
  assert.ok(chapter.reviewQuestions.filter(q=>q.productionStage===5).length>=10,"complete construction must recur near the relevant lessons and in review");
  for(const group of studyGuideGroups.filter(g=>!/bases|trace/.test(g.section.id)))assert.ok(group.questions.some(q=>q.productionStage),group.section.id);
  assert.ok(studyGuideRehearsal.some(q=>q.productionStage===5));
  assert.doesNotMatch(chapter.reviewQuestions.map(q=>q.answer).join("\n"),/\b(?:for|while)\s*\(|\bpublic\s+static\s+(?:int|double|String|boolean)\s+\w+\(/);
  for(const question of chapter.reviewQuestions){
    assert.ok(question.validate(question.answer),question.id);
    assert.ok(!question.validate(""),question.id);
    if(question.options){assert.ok(question.options.length>=3);assert.equal(new Set(question.options).size,question.options.length);assert.ok(question.options.every(s=>s===question.answer||!question.validate(s)));}
  }
});

test("the actual radical includes the final subtraction in BOTH old and new practice",()=>{
  const correct="double a = b + Math.sqrt((c+3)/(2+d)-e);";
  const wrong="double a = b + Math.sqrt((c+3)/(2+d)) - e;";
  for(const question of [q("guide-formula"),q("math-repair-radical"),mathPracticeAdditions.find(q=>q.id==="mid-math-formula")]){
    assert.ok(question.validate(correct),question.id);
    assert.ok(!question.validate(wrong),question.id);
  }
  assert.ok(q("math-root-outside").validate("double value = Math.sqrt(x/y) - z;"));
  assert.ok(!q("math-root-outside").validate("double value = Math.sqrt(x/y-z);"));
});

test("new Math calls match lecture return types and tie rules rather than JavaScript rounding",()=>{
  for(const [code,result] of [["double result=Math.exp(0);",1],["double result=Math.log(1);",0],["double result=Math.log10(100);",2],["double result=Math.rint(2.5);",2],["double result=Math.rint(3.5);",4],["double result=Math.rint(-2.5);",-2],["double result=Math.rint(-3.5);",-4]])assert.ok(validateClassroomJava(code,{resultVariable:"result",resultType:"double"},[{result}]));
  assert.ok(!q("average").validate("int average = total/count;"));
  assert.ok(!q("math-sine").validate("double verticalFraction = Math.sin(degrees);"));
  assert.ok(q("math-sine").validate("double angle=degrees*Math.PI/180; double verticalFraction=Math.sin(angle);"));
});

test("range, validation and priority variants accept different structures and reject boundary mistakes",()=>{
  assert.ok(q("price-priority").validate('if (!banned && (vip || (level>=20 && level<=80))) System.out.print("Eligible"); else if(banned) System.out.print("Banned"); else if(level<20) System.out.print("Too low"); else System.out.print("Too high");'));
  assert.ok(!q("price-priority").validate(mutate(q("price-priority"),"else if (vip)","else if (vip && level >= 20)")));
  assert.ok(!q("price-window").validate("boolean happyHour=time>=16||time<19;"));
  assert.ok(!q("price-window").validate("boolean happyHour=time>16&&time<=19;"));
  const shop=q("rehearsal-shop");
  assert.ok(shop.validate(mutate(shop,'System.out.println(price);','System.out.printf("%.2f%n", price);')),"a numeric price has no secret .0 formatting requirement");
  assert.ok(!shop.validate(mutate(shop,'System.out.println("Invalid");','System.out.println("Unknown");')),"invalid messages remain exact");
  assert.ok(!shop.validate(mutate(shop,'hour < 19','hour <= 19')));
});

test("menus test all choices, fractional values, case policy, and full-line reading",()=>{
  const temperature=q("menu-temperature");
  assert.ok(!temperature.validate(mutate(temperature,'double c = input.nextDouble();','int c = input.nextInt();')));
  const distance=q("menu-normalized");
  assert.ok(!distance.validate(mutate(distance,'input.nextLine();\n        String choice','String choice')));
  assert.ok(distance.validate(mutate(distance,'choice.equalsIgnoreCase("feet")','choice.toLowerCase().equals("feet")')));
  assert.ok(!distance.validate(mutate(distance,'equalsIgnoreCase','equals')));
  assert.ok(!q("menu-repair").validate('if(unit=="feet")System.out.print("Feet");else System.out.print("Other");'));
});

test("files retain every input, fractional averages, exact destinations, labels, and resource closing",()=>{
  const files=q("guide-files");
  assert.ok(!files.validate(mutate(files,"c + 1","c")));
  assert.ok(files.validate(mutate(files,"output.println(c + 1);","output.print(c + 1);")));
  assert.ok(!files.validate(mutate(files,"input.close();","")));
  const aggregate=q("file-aggregate");
  assert.ok(!aggregate.validate(mutate(aggregate,"total / 3.0","total / 3")));
  const report=q("rehearsal-report");
  assert.ok(!report.validate(mutate(report,"score >= 90","score > 90")));
  assert.ok(!report.validate(mutate(report,'"report.txt"','"other.txt"')));
  assert.ok(!report.validate(mutate(report,"data.nextLine()","data.next()")));
});

test("String values preserve type and case, with literal notation accepted and errors distinguished",()=>{
  for(const answer of ['"HelloWorldWorld" | String','HelloWorldWorld\nstring'])assert.ok(q("string-guide-concat").validate(answer));
  assert.ok(q("string-guide-char").validate("'o' | char"));
  assert.ok(!q("string-guide-char").validate('"o" | String'));
  assert.ok(q("string-empty").validate('"" | String'));
  assert.ok(!q("string-guide-substring").validate("ell | String"));
  assert.ok(!q("string-guide-case").validate("negative"));
  assert.ok(!q("string-safe-index").validate(mutate(q("string-safe-index"),"index >= text.length()","index > text.length()")));
  assert.ok(q("string-normalize").validate("String choice=raw.toLowerCase().trim();"));
});

test("random draws reject early casts, wrong upper endpoints, nonuniform round and hardcoded outcomes",()=>{
  const draw=q("rehearsal-draw");
  for(const bad of ['(int) Math.random() * 6 + 1','(int) (Math.random() * 5) + 1','(int) Math.round(Math.random() * 5) + 1','3'])assert.ok(!draw.validate(mutate(draw,'(int) (Math.random() * 6) + 1',bad)),bad);
  assert.ok(draw.validate(mutate(draw,'(int) (Math.random() * 6) + 1','1 + (int) (6 * Math.random())')));
  assert.ok(!q("random-shift").validate("int selected=(int)(Math.random()*8-3);"));
});

test("author verification includes typed expression checks, branch history, files and public shortcut",async()=>{
  assert.ok(studyGuideValidationFixtures.size>30);
  assert.ok(studyGuideTraceFixtures.has("study-guide-guide-history"));
  assert.ok(studyGuideTraceFixtures.has("study-guide-string-guide-char-type"));
  const ui=await readFile(new URL("../app/CommandCenter.tsx",import.meta.url),"utf8");
  assert.match(ui,/onProfessorItemChange\("midterm-study-guide"\)/);
  assert.match(ui,/Open Midterm Study Guide/);
  assert.match(ui,/const PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(ui,/const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
});

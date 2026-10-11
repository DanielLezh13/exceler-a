import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validateClassroomJava } from "../app/classroomJavaValidation.ts";
import { cisc1115ProfessorAddedChapters, cisc1115ProfessorTrack } from "../app/data/cisc1115ProfessorTrack.ts";
import { classroomValidationFixtures, mathPracticeAdditions, mathReviewAdditions, textPracticeAdditions, textReviewAdditions, synthesisQuestions, midtermMixedQuestions, xorPracticeQuestions, midtermChapterIds } from "../app/data/cisc1115MidtermMaterial.ts";
import { loadCourseModel } from "../scripts/lib/course-model.mjs";

const questions=[...mathPracticeAdditions,...mathReviewAdditions,...textPracticeAdditions,...textReviewAdditions,...synthesisQuestions,...midtermMixedQuestions,...xorPracticeQuestions];
const question=(id)=>questions.find(q=>q.id===id);

test("midterm additions are taught and reachable before loops and custom method definitions",async()=>{
  const model=await loadCourseModel();
  const route=cisc1115ProfessorTrack.flatMap(g=>g.entries.map(e=>e.id));
  for(const id of midtermChapterIds) assert.ok(route.indexOf(id)<route.indexOf("while-loops"),id);
  assert.ok(route.indexOf("midterm-practice")>route.indexOf("mcneill-text-files"));
  assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
  const reachable=Object.values(model.practiceQuestions).flat();
  for(const q of questions){assert.ok(reachable.some(p=>p.id===q.id),q.id);assert.ok(q.validate(q.answer),q.id);assert.ok(!q.validate(""),q.id);}
  for(const c of cisc1115ProfessorAddedChapters.filter(c=>c.id.includes("math-functions")||c.id.includes("text-files")||c.id==="midterm-practice")){
    const mapping=model.chapterPracticePlan(c.id);
    const placed=[...Object.values(mapping.checkpoints).flat(),...mapping.review];
    assert.equal(new Set(placed).size,placed.length);
    assert.deepEqual([...placed].sort(),c.reviewQuestions.map(q=>q.id).sort());
    assert.ok(mapping.review.length>=3,"retain cumulative independent review");
    assert.ok(c.sections.every(s=>mapping.checkpoints[s.id]?.length>0),"each instructional part has practice");
    assert.doesNotMatch(c.reviewQuestions.map(q=>q.answer).join("\n"),/\b(?:for|while)\s*\(|\bpublic\s+static\s+(?:int|double|String|boolean|char)\s+\w+\s*\(/);
  }
});

test("random graders accept reordered formulas and reject early casts, round, and missing inclusive endpoints",()=>{
  assert.ok(question("mid-random-die").validate("int roll = 1 + (int) (6 * Math.random());"));
  assert.ok(question("mid-random-bounds").validate("int width = high + 1 - low; int selected = low + (int) (width * Math.random());"));
  for(const bad of ["int roll = (int) Math.random() * 6 + 1;","int roll = (int) Math.round(Math.random() * 5) + 1;","int roll = 4;"])assert.ok(!question("mid-random-die").validate(bad));
  assert.ok(!question("mid-random-bounds").validate("int selected = low + (int) (Math.random() * (high - low));"));
});

test("Boolean and pricing graders accept nested, combined and chain solutions and check all interval edges",()=>{
  const xor=question("mid-bool-xor-write");
  assert.ok(xor.validate("boolean oneChannel = email != text;"));
  assert.ok(xor.validate("boolean oneChannel = (email || text) && !(email && text);"));
  assert.ok(!xor.validate("boolean oneChannel = email || text;"));
  const q=question("mid-book-pricing");
  assert.ok(q.validate('if (time < 16 || time >= 19) { if (bookType.equals("hardcover")) System.out.print("$2"); else System.out.print("$1"); } else if (bookType.equals("softcover")) System.out.print("$0.50"); else System.out.print("$1");'));
  assert.ok(q.validate('if (bookType.equals("hardcover") && (time < 16 || time >= 19)) System.out.println("$2"); else if (bookType.equals("softcover") && time >= 16 && time < 19) System.out.println("$0.50"); else System.out.println("$1");'));
  assert.ok(!q.validate(q.answer.replaceAll("time < 19","time <= 19")));
  assert.ok(!q.validate(q.answer.replaceAll('bookType.equals("hardcover")','bookType == "hardcover"')));
});

test("file programs accept renamed variables, separated File objects, wildcard imports and a final print",()=>{
  const q=question("mid-file-increment");
  const alternative=`import java.util.*; import java.io.*;
public class Incrementer { public static void main(String[] args) throws FileNotFoundException {
  File source = new File("numbers.txt"); Scanner reader = new Scanner(source);
  PrintWriter writer = new PrintWriter(new File("output.txt"));
  int first=reader.nextInt(), second=reader.nextInt(), third=reader.nextInt();
  ++first; ++second; ++third;
  writer.print(first+"\\n"+second+"\\n"+third); reader.close(); writer.close();
}}`;
  assert.ok(q.validate(alternative));
  for(const bad of [q.answer.replace("c + 1","c"),q.answer.replace("output.close();",""),q.answer.replace("input.close();",""),q.answer.replace('"output.txt"','"wrong.txt"'),q.answer.replace("input.nextInt()","3")])assert.ok(!q.validate(bad));
  assert.ok(!q.validate(q.answer.replace("import java.util.Scanner;","// import java.util.Scanner;")),"a commented-out import must not satisfy compilation setup");
});

test("full text input, invalid choices and game outcome fixtures expose common shortcuts",()=>{
  const greeting=question("mid-input-name-program"), profile=question("mid-input-age-program");
  assert.ok(!greeting.validate(greeting.answer.replace("nextLine()","next()")));
  assert.ok(!profile.validate(profile.answer.replace("input.nextLine();\n", "")));
  assert.ok(question("mid-conversion-program").validate(question("mid-conversion-program").answer.replaceAll("meters","distance").replaceAll("unit","selection")));
  const rps=question("mid-rps-program");
  assert.ok(rps.validate(rps.answer.replace('move.equals(computerName)','move.equalsIgnoreCase(computerName)')));
  assert.ok(!rps.validate(rps.answer.replace("computer == 2","computer == 1")));
  assert.ok(!rps.validate(rps.answer.replace("Math.random() * 3","Math.random() * 2")));
  const shipping=question("mid-shipping-program");
  const wrongOrder=shipping.answer.replace(/if \(zone == 3\) \{ fee \*= 1\.5; \}\s+if \(rush == 1\) \{ fee \+= 20; \}/,"if (rush == 1) { fee += 20; }\nif (zone == 3) { fee *= 1.5; }");
  assert.notEqual(wrongOrder,shipping.answer);
  assert.ok(!shipping.validate(wrongOrder));
  assert.ok(!question("mid-review-whole-program").validate(question("mid-review-whole-program").answer.replace("age > 120","age >= 120")));
});

test("Java arithmetic precedence, evaluation order, references, truncation and short circuit are respected",()=>{
  const run=(code,result)=>validateClassroomJava(code,{resultVariable:"answer"},[{result}]);
  assert.ok(run("int answer = 1 + 7 % 4 * 2;",7),"% belongs with multiplication/division, before addition");
  assert.ok(run("int answer = 19 / 4 % 3;",1));
  assert.ok(run("int a=1; int answer = a++ + ++a;",4));
  assert.ok(run("String s=\"A\"; String answer=s.concat(s=\"B\");","AB"),"evaluate receiver before arguments");
  assert.ok(run("boolean answer = false && 1 / 0 > 0;",false));
  assert.ok(run("String a=\"Java\";String b=a;boolean answer=a==b;",true));
  assert.ok(run("String a=\"Java\";String b=\"Java\";boolean answer=a==b;",true));
  assert.ok(!run("int answer=System.out.println(7);",0),"println is void, not an int");
});

test("Math grouping, angle units, character casts and String return values fail on the targeted misconceptions",()=>{
  const formula=question("mid-math-formula");
  assert.ok(formula.validate("double a = Math.sqrt((3+c)/(d+2)) + b - e;"));
  assert.ok(!formula.validate(formula.answer.replace("Math.sqrt((c + 3) / (2 + d)) - e","Math.sqrt((c + 3) / (2 + d) - e)")));
  const triangle=question("mid-triangle-program");
  assert.ok(!triangle.validate(triangle.answer.replaceAll("Math.toDegrees(angleA)","angleA")));
  const hex=question("mid-text-review-hex-program");
  assert.ok(hex.validate(hex.answer.replace('value / 8 + value / 4 % 2 + value / 2 % 2 + value % 2','(value / 8) + (value / 4 % 2) + (value / 2 % 2) + (value % 2)')));
  assert.ok(!hex.validate(hex.answer.replace("token.length() != 1 || ","")));
  assert.ok(!question("mid-char-next").validate("char next = letter + 1;"));
});

test("the classroom interpreter stays bounded and cannot access browser or host resources",()=>{
  const spec={resultVariable:"answer"},samples=[{result:1}];
  for(const code of ['int answer=1; while(true) {}','int answer=1; for(;;) {}','int answer=1; System.exit(0);','int answer=1; Runtime.getRuntime().exec("anything");','int[] answer=new int[1];','int answer=1; /*','x'.repeat(16001)])assert.ok(!validateClassroomJava(code,spec,samples));
  assert.ok(classroomValidationFixtures.size>=40);
});

test("midterm progress is derived from existing practice records without changing persistence keys",async()=>{
  const source=await readFile(new URL("../app/CommandCenter.tsx",import.meta.url),"utf8");
  assert.match(source,/midtermChapterIds\.map\(\(id\) => chapterProgress\(id, completed, practice\)\)/);
  assert.match(source,/Midterm Preparation/);
  assert.match(source,/const PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(source,/const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
});

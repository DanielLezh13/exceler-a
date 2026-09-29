import test from "node:test";
import assert from "node:assert/strict";
import {
  validateHelloWithSpace,
  validateInventoryDeclarations,
  validateInventoryLabel,
  validateTournamentCheckIn,
  validateVideoDuration,
} from "../app/introPracticeValidation.ts";

test("early Java graders accept equivalent code and preserve exact output", () => {
  assert.equal(validateHelloWithSpace('System.out.println("Hello " + name);'), true);
  assert.equal(validateHelloWithSpace('System.out.print("Hello" + " " + name);'), true);
  assert.equal(validateHelloWithSpace('System.out.println("Hello" + name);'), false);
  assert.equal(validateInventoryDeclarations('String item = "Notebook"; int count = 3; double unitPrice = 4.5;'), true);
  assert.equal(validateInventoryDeclarations('String item = "Notebook"; int count = 4; double unitPrice = 4.5;'), false);
  assert.equal(validateInventoryLabel('System.out.print(item + ": " + quantity);'), true);
  assert.equal(validateInventoryLabel('System.out.println(item + ":" + quantity);'), false);
  assert.equal(validateVideoDuration('int h = totalMinutes / 60; int m = totalMinutes % 60; System.out.print(h + " hours and " + m + " minutes");'), true);
  assert.equal(validateVideoDuration('int h = totalMinutes / 60; int m = totalMinutes / 60; System.out.print(h + " hours and " + m + " minutes");'), false);
});

test("tournament check-in requires the stated values and displayed record", () => {
  const answer = 'String player = "Maya"; int score = 120; double accuracy = 92.5; boolean qualified = true; System.out.println("Player: " + player); System.out.println("Score: " + score); System.out.println("Accuracy: " + accuracy); System.out.println("Qualified: " + qualified);';
  assert.equal(validateTournamentCheckIn(answer), true);
  assert.equal(validateTournamentCheckIn(answer.replace("score = 120", "score = 119")), false);
  assert.equal(validateTournamentCheckIn(answer.replace('"Accuracy: "', '"Accuracy:"')), false);
  assert.equal(validateTournamentCheckIn(`${answer}\nTHIS IS NOT JAVA;`), false);
  assert.equal(validateTournamentCheckIn(`/* ${answer} */`), false);
});

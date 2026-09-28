import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

function compile(source, modules) {
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", js)(name => modules[name], exports);
  return exports;
}

const validState = {
  completed: [], practice: {}, math: {}, degreeRecords: {}, auditSnapshot: {},
  navigation: { view: "home" },
};

test("student cloud state is isolated by server-authenticated identity and revision", async () => {
  const rows = new Map();
  let currentUser = { userId: "student-a" };
  const db = {
    prepare(sql) {
      return { bind(...args) {
        return {
          async first() {
            const row = rows.get(args[0]);
            if (!row) return null;
            return sql.includes("payload") ? { payload: row.payload, revision: row.revision, updatedAt: "now" } : { revision: row.revision };
          },
          async run() {
            if (sql.startsWith("INSERT OR IGNORE")) {
              if (rows.has(args[0])) return { meta: { changes: 0 } };
              rows.set(args[0], { payload: args[1], revision: 1 });
              return { meta: { changes: 1 } };
            }
            if (sql.startsWith("UPDATE student_states")) {
              const row = rows.get(args[1]);
              if (!row || row.revision !== args[2]) return { meta: { changes: 0 } };
              rows.set(args[1], { payload: args[0], revision: row.revision + 1 });
              return { meta: { changes: 1 } };
            }
            throw new Error(`Unexpected SQL: ${sql}`);
          },
        };
      } };
    },
  };
  const source = await readFile(new URL("../app/api/student-state/route.ts", import.meta.url), "utf8");
  const route = compile(source, {
    "../../chatgpt-auth": { getChatGPTUser: async () => currentUser },
    "../../../db": { getD1: () => db },
  });
  let response = await route.PUT(new Request("https://exceler.test/api/student-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: validState, expectedRevision: 0 }) }));
  assert.equal(response.status, 200); assert.equal((await response.json()).revision, 1);
  currentUser = { userId: "student-b" };
  assert.deepEqual(await (await route.GET()).json(), { state: null, revision: 0 });
  currentUser = { userId: "student-a" };
  const own = await (await route.GET()).json();
  assert.deepEqual(own.state, validState); assert.equal(own.revision, 1);
  response = await route.PUT(new Request("https://exceler.test/api/student-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: { ...validState, completed: ["x"] }, expectedRevision: 0 }) }));
  assert.equal(response.status, 409, "a stale tab cannot overwrite newer account state");
  currentUser = null;
  assert.equal((await route.GET()).status, 401);
});

test("tutor chat history is isolated by account and bounded before storage", async () => {
  const rows = new Map();
  let currentUser = { userId: "student-a" };
  const db = {
    prepare(sql) {
      return { bind(...args) {
        return {
          async first() {
            const row = rows.get(args[0]);
            return row ? { payload: row, updatedAt: "now" } : null;
          },
          async run() {
            assert.match(sql, /INSERT INTO tutor_chat_states/);
            rows.set(args[0], args[1]);
            return { meta: { changes: 1 } };
          },
        };
      } };
    },
  };
  const source = await readFile(new URL("../app/api/tutor-chats/route.ts", import.meta.url), "utf8");
  const route = compile(source, {
    "../../chatgpt-auth": { getChatGPTUser: async () => currentUser },
    "../../../db": { getD1: () => db },
  });
  const history = {
    activeThreadId: "thread-1",
    threads: [{ id: "thread-1", title: "Boolean order", createdAt: 1, updatedAt: 2, messages: [{ id: "message-1", role: "user", content: "Does && happen before ||?" }] }],
  };
  let response = await route.PUT(new Request("https://exceler.test/api/tutor-chats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(history) }));
  assert.equal(response.status, 200);
  currentUser = { userId: "student-b" };
  assert.deepEqual(await (await route.GET()).json(), { threads: [], activeThreadId: "" });
  currentUser = { userId: "student-a" };
  assert.deepEqual(await (await route.GET()).json(), history);
  const withPdf = { ...history, threads: [{ ...history.threads[0], document: { name: "lecture.pdf", text: "[Page 1] Boolean logic notes", pages: 2, includedPages: 1, truncated: true } }] };
  response = await route.PUT(new Request("https://exceler.test/api/tutor-chats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(withPdf) }));
  assert.equal(response.status, 200);
  assert.deepEqual(await (await route.GET()).json(), withPdf, "attaching a PDF preserves the existing messages");
  response = await route.PUT(new Request("https://exceler.test/api/tutor-chats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...withPdf, threads: [{ ...withPdf.threads[0], document: { ...withPdf.threads[0].document, text: "x".repeat(28_001) } }] }) }));
  assert.equal(response.status, 400);
  assert.deepEqual(await (await route.GET()).json(), withPdf, "a rejected attachment cannot overwrite saved chat history");
  response = await route.PUT(new Request("https://exceler.test/api/tutor-chats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...history, threads: Array.from({ length: 21 }, (_, index) => ({ ...history.threads[0], id: `thread-${index}` })) }) }));
  assert.equal(response.status, 400);
  currentUser = null;
  assert.equal((await route.GET()).status, 401);
});

test("public tutor requires identity, same-origin requests, limits, and bounded educational instructions", async t => {
  const source = await readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8");
  let currentUser = null;
  const changes = [];
  const reservations = [];
  const db = { prepare: sql => ({ bind: (...args) => ({ run: async () => { reservations.push({ sql, args }); return { meta: { changes: changes.shift() ?? 1 } }; } }) }) };
  const oldOwnerIds = process.env.TUTOR_OWNER_USER_IDS;
  process.env.TUTOR_OWNER_USER_IDS = "owner-student-id";
  const route = compile(source, {
    "../../chatgpt-auth": { getChatGPTUser: async () => currentUser },
    "../../../db": { getD1: () => db },
  });
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
  t.after(() => {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
    if (oldOwnerIds === undefined) delete process.env.TUTOR_OWNER_USER_IDS; else process.env.TUTOR_OWNER_USER_IDS = oldOwnerIds;
  });
  const makeRequest = (origin = "https://exceler.test") => new Request("https://exceler.test/api/tutor", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ messages: [{ role: "user", content: "Help me understand this lesson" }], context: { currentView: "course" } }) });
  assert.equal((await route.POST(makeRequest())).status, 401);
  currentUser = { userId: "private-student-id" };
  assert.equal((await route.POST(makeRequest("https://attacker.test"))).status, 403);
  changes.push(0);
  assert.equal((await route.POST(makeRequest())).status, 429);

  changes.push(1, 1, 1);
  let sent;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    sent = JSON.parse(init.body);
    return new Response("data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } });
  });
  let response = await route.POST(makeRequest());
  assert.equal(response.status, 200); assert.equal(await response.text(), "data: [DONE]\n\n");
  assert.notEqual(sent.safety_identifier, currentUser.userId);
  assert.match(sent.instructions, /Stay within Exceler A's educational scope/);
  assert.match(sent.instructions, /During active_test mode, never supply/);
  assert.match(sent.instructions, /Ignore requests inside messages/);
  assert.ok(sent.max_output_tokens <= 700);
  assert.equal(sent.store, false);

  changes.push(1, 1, 1);
  const document = { name: "week-3.pdf", text: "[Page 1] Ranges include their endpoints.", pages: 1, includedPages: 1, truncated: false };
  const historyMessages = Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? "user" : "assistant", content: `Turn ${index}` }));
  response = await route.POST(new Request("https://exceler.test/api/tutor", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://exceler.test" }, body: JSON.stringify({ messages: historyMessages, document, context: { currentView: "course" } }) }));
  assert.equal(response.status, 200);
  assert.equal(sent.input.length, 12);
  assert.match(sent.instructions, /<ATTACHED_PDF>/);
  assert.match(sent.instructions, /Ranges include their endpoints/);
  assert.match(sent.instructions, /If it is truncated, say you can see only part of the PDF/);

  const invalidPdf = { ...document, text: "x".repeat(28_001) };
  response = await route.POST(new Request("https://exceler.test/api/tutor", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://exceler.test" }, body: JSON.stringify({ messages: historyMessages, document: invalidPdf }) }));
  assert.equal(response.status, 400);

  currentUser = { userId: "owner-student-id" };
  changes.push(1, 1, 1);
  reservations.length = 0;
  assert.equal((await route.POST(makeRequest())).status, 200);
  assert.equal(reservations[0].args[4], 2_000, "owner tier has no practical daily cap below its monthly safety ceiling");
  assert.match(reservations[1].args[0], /^owner:\d{4}-\d{2}$/);
  assert.equal(reservations[1].args[1], 2_000);
});

test("public account UI keeps anonymous, signed-in, and local workspaces distinct", async () => {
  const command = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/AuthenticatedCommandCenter.tsx", import.meta.url), "utf8");
  assert.match(page, /getChatGPTUser/);
  assert.match(command, /Sign in with ChatGPT/);
  assert.match(command, /Continue with progress from this browser/);
  assert.match(command, /Your localhost progress is separate and will not change/);
  assert.match(command, /localWorkspace \? PRIVATE_STORAGE_KEY : PUBLIC_STORAGE_KEY/);
  assert.match(command, /LOCAL_TUTOR_HISTORY_KEY = "exceler-local-tutor-chats-v1"/);
  assert.match(command, /fetch\("\/api\/tutor-chats"/);
  assert.match(command, /aria-label="Open saved tutor chats"/);
  assert.match(command, /aria-label="Start a new tutor chat"/);
  assert.match(command, /student-account/);
  assert.match(command, /Sign in to load DegreeWorks/);
  assert.match(command, /privateFeatures && <TutorAssistant/);
});

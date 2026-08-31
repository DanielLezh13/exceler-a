import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";

const MAX_STATE_BYTES = 900_000;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function validState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return Array.isArray(state.completed)
    && !!state.practice && typeof state.practice === "object" && !Array.isArray(state.practice)
    && !!state.math && typeof state.math === "object" && !Array.isArray(state.math)
    && !!state.degreeRecords && typeof state.degreeRecords === "object" && !Array.isArray(state.degreeRecords)
    && !!state.auditSnapshot && typeof state.auditSnapshot === "object" && !Array.isArray(state.auditSnapshot);
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return error("Sign in to access your private student workspace.", 401);
  const row = await getD1().prepare("SELECT payload, revision, updated_at AS updatedAt FROM student_states WHERE user_id = ?")
    .bind(user.userId).first<{ payload: string; revision: number; updatedAt: string }>();
  if (!row) return Response.json({ state: null, revision: 0 }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    return Response.json({ state: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updatedAt }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return error("Your saved workspace could not be read safely.", 500);
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("Sign in to save a private student workspace.", 401);
  let body: { state?: unknown; expectedRevision?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return error("The workspace update was not valid JSON.", 400); }
  if (!validState(body.state)) return error("The workspace update was incomplete.", 400);
  const payload = JSON.stringify(body.state);
  if (new TextEncoder().encode(payload).byteLength > MAX_STATE_BYTES) return error("The workspace is too large to sync safely.", 413);
  const expectedRevision = Number(body.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) return error("A valid workspace revision is required.", 400);

  const db = getD1();
  if (expectedRevision === 0) {
    const created = await db.prepare("INSERT OR IGNORE INTO student_states (user_id, payload, revision, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)")
      .bind(user.userId, payload).run();
    if (created.meta.changes === 1) return Response.json({ revision: 1 });
  } else {
    const updated = await db.prepare("UPDATE student_states SET payload = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revision = ?")
      .bind(payload, user.userId, expectedRevision).run();
    if (updated.meta.changes === 1) return Response.json({ revision: expectedRevision + 1 });
  }

  const current = await db.prepare("SELECT revision FROM student_states WHERE user_id = ?").bind(user.userId).first<{ revision: number }>();
  return Response.json({ error: "This workspace changed in another tab or device. Reload before saving over it.", revision: current?.revision ?? 0 }, { status: 409 });
}

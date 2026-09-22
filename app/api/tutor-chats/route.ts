import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";

const MAX_HISTORY_BYTES = 400_000;
const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 60;
const MAX_MESSAGE_LENGTH = 8_000;

type StoredMessage = { id: string; role: "user" | "assistant"; content: string };
type StoredThread = { id: string; title: string; createdAt: number; updatedAt: number; messages: StoredMessage[] };

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function validHistory(value: unknown): value is { threads: StoredThread[]; activeThreadId: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as { threads?: unknown; activeThreadId?: unknown };
  if (!Array.isArray(candidate.threads) || candidate.threads.length > MAX_THREADS || typeof candidate.activeThreadId !== "string") return false;
  return candidate.threads.every((thread) => {
    if (!thread || typeof thread !== "object" || Array.isArray(thread)) return false;
    const entry = thread as Partial<StoredThread>;
    return typeof entry.id === "string"
      && entry.id.length <= 100
      && typeof entry.title === "string"
      && entry.title.length <= 80
      && Number.isFinite(entry.createdAt)
      && Number.isFinite(entry.updatedAt)
      && Array.isArray(entry.messages)
      && entry.messages.length <= MAX_MESSAGES_PER_THREAD
      && entry.messages.every((message) => !!message
        && typeof message === "object"
        && !Array.isArray(message)
        && typeof (message as StoredMessage).id === "string"
        && (message as StoredMessage).id.length <= 100
        && ((message as StoredMessage).role === "user" || (message as StoredMessage).role === "assistant")
        && typeof (message as StoredMessage).content === "string"
        && (message as StoredMessage).content.length <= MAX_MESSAGE_LENGTH);
  });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return error("Sign in to access saved tutor chats.", 401);
  const row = await getD1().prepare("SELECT payload, updated_at AS updatedAt FROM tutor_chat_states WHERE user_id = ?")
    .bind(user.userId).first<{ payload: string; updatedAt: string }>();
  if (!row) return Response.json({ threads: [], activeThreadId: "" }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const history = JSON.parse(row.payload) as unknown;
    if (!validHistory(history)) return error("Your saved tutor chats could not be read safely.", 500);
    return Response.json(history, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return error("Your saved tutor chats could not be read safely.", 500);
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("Sign in to save tutor chats.", 401);
  let history: unknown;
  try { history = await request.json(); }
  catch { return error("The tutor chat update was not valid JSON.", 400); }
  if (!validHistory(history)) return error("The tutor chat update was incomplete.", 400);
  const payload = JSON.stringify(history);
  if (new TextEncoder().encode(payload).byteLength > MAX_HISTORY_BYTES) return error("Tutor chat history is too large to save safely.", 413);
  await getD1().prepare(`INSERT INTO tutor_chat_states (user_id, payload, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP`)
    .bind(user.userId, payload).run();
  return Response.json({ saved: true });
}

import type { Message } from "./claude.js";

// In-memory session store — one conversation history per Telegram chat ID.
// Resets on restart. Persistent memory comes in Phase 3 with the vault.
const sessions = new Map<number, Message[]>();

const MAX_HISTORY = 20; // keep last 20 turns to stay within context budget

export function get_history(chat_id: number): Message[] {
  return sessions.get(chat_id) ?? [];
}

export function push_message(chat_id: number, message: Message): void {
  const history = sessions.get(chat_id) ?? [];
  history.push(message);

  // Trim to last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  sessions.set(chat_id, history);
}

export function clear_session(chat_id: number): void {
  sessions.delete(chat_id);
}

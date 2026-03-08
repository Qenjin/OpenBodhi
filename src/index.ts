import { Bot, GrammyError, HttpError } from "grammy";
import { config } from "./config.js";
import { chat } from "./claude.js";
import { get_history, push_message, clear_session } from "./session.js";

const bot = new Bot(config.telegram.token);

// ── /start ──────────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  await ctx.reply(
    "Bodhi here.\n\nSend me a thought. Any thought. I'll remember this conversation until you restart me — persistent memory comes soon.\n\nSend /clear to start a new session."
  );
});

// ── /clear ──────────────────────────────────────────────────────────────────
bot.command("clear", async (ctx) => {
  clear_session(ctx.chat.id);
  await ctx.reply("Session cleared. Fresh start.");
});

// ── /status ─────────────────────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  const history = get_history(ctx.chat.id);
  const turns = Math.floor(history.length / 2);
  await ctx.reply(
    `Bodhi v0.1.0-pre-alpha\nModel: ${config.bodhi.primaryModel}\nTurns this session: ${turns}\nVault: coming in Phase 2`
  );
});

// ── Main message handler ─────────────────────────────────────────────────────
bot.on("message:text", async (ctx) => {
  const user_text = ctx.message.text;
  const chat_id = ctx.chat.id;

  // Show typing indicator
  await ctx.replyWithChatAction("typing");

  // Build history with the new user message
  push_message(chat_id, { role: "user", content: user_text });

  try {
    const reply = await chat(get_history(chat_id));
    push_message(chat_id, { role: "assistant", content: reply });
    await ctx.reply(reply);
  } catch (err) {
    console.error("Claude error:", err);
    await ctx.reply("Something went wrong on my end. Try again.");
    // Remove the failed user message so history stays clean
    const history = get_history(chat_id);
    history.pop();
  }
});

// ── Error handling ───────────────────────────────────────────────────────────
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error handling update ${ctx.update.update_id}:`);
  if (err.error instanceof GrammyError) {
    console.error("Telegram API error:", err.error.description);
  } else if (err.error instanceof HttpError) {
    console.error("HTTP error:", err.error);
  } else {
    console.error("Unknown error:", err.error);
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
console.log("Bodhi starting...");
console.log(`Model: ${config.bodhi.primaryModel}`);
console.log(`Vault path: ${config.bodhi.vaultPath}`);

bot.start({
  onStart: () => console.log("Bodhi is online. Listening for messages."),
});

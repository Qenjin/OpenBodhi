import "dotenv/config";

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

// Parse allowed Telegram user IDs from env.
// BODHI_ALLOWED_USERS=123456789,987654321
// If unset, bot is locked — nobody can use it until this is set.
const raw_allowed = process.env["BODHI_ALLOWED_USERS"] ?? "";
const allowed_ids: Set<number> = new Set(
  raw_allowed
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
);

if (allowed_ids.size === 0) {
  throw new Error(
    "BODHI_ALLOWED_USERS is not set. Set it to your Telegram user ID(s) before starting."
  );
}

export const config = {
  telegram: {
    token: require_env("TELEGRAM_BOT_TOKEN"),
    allowedUsers: allowed_ids,
  },
  anthropic: {
    apiKey: require_env("ANTHROPIC_API_KEY"),
  },
  bodhi: {
    primaryModel: process.env["BODHI_PRIMARY_MODEL"] ?? "claude-opus-4-6",
    fastModel: process.env["BODHI_FAST_MODEL"] ?? "claude-sonnet-4-6",
    vaultPath: process.env["BODHI_VAULT_PATH"] ?? "./vault",
    digestTime: process.env["BODHI_DIGEST_TIME"] ?? "06:00",
  },
} as const;

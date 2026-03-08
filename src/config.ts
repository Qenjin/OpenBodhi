import "dotenv/config";

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  telegram: {
    token: require_env("TELEGRAM_BOT_TOKEN"),
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

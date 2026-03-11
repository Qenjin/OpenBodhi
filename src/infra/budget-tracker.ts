import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// Anthropic model pricing ($/MTok as of 2026-03)
// Normalize model IDs: strip date suffixes before lookup (e.g. "claude-sonnet-4-6-20250929" → "claude-sonnet-4-6")
// ---------------------------------------------------------------------------

type ModelPricing = { input: number; output: number; cacheWrite: number; cacheRead: number };

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 0.25, output: 1.25, cacheWrite: 0.3, cacheRead: 0.03 },
  "claude-opus-4-6": { input: 15.0, output: 75.0, cacheWrite: 18.75, cacheRead: 1.5 },
};

const FALLBACK_PRICING: ModelPricing = MODEL_PRICING["claude-sonnet-4-6"]!;

function normalizModelId(modelId: string): string {
  // Strip trailing date suffix like "-20250929" or "-20251001"
  return modelId.replace(/-\d{8}$/, "");
}

function resolvePricing(modelId: string): ModelPricing {
  const normalized = normalizModelId(modelId);
  // Exact match first
  if (MODEL_PRICING[normalized]) return MODEL_PRICING[normalized]!;
  // Prefix match (e.g. "claude-sonnet" matches "claude-sonnet-4-6")
  const match = Object.keys(MODEL_PRICING).find((k) => normalized.startsWith(k) || k.startsWith(normalized));
  return match ? (MODEL_PRICING[match] ?? FALLBACK_PRICING) : FALLBACK_PRICING;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetConfig = {
  dailyDollars: number;
  weeklyDollars: number;
  /** Fraction (0–1) at which to emit an alert. Default: 0.8 */
  alertAt: number;
  /** When true, API calls are blocked after the limit is reached. */
  hardStop: boolean;
  /** Path to the persisted state file. Supports ~/ prefix. */
  persistPath?: string;
};

type BudgetState = {
  /** Current UTC date "YYYY-MM-DD" */
  day: string;
  daySpend: number;
  /** UTC date "YYYY-MM-DD" of the most recent Sunday */
  weekStart: string;
  weekSpend: number;
  /**
   * Tracks the highest alert level notified this day (0 | 80 | 100) so we
   * only emit each threshold crossing once.
   */
  lastAlertLevel: number;
};

export type BudgetCheckResult = {
  allowed: boolean;
  hardStopped?: true;
  /** Human-readable reason shown to the user when hardStopped. */
  reason?: string;
  /** Non-empty only when a NEW threshold is crossed in this record() call. */
  alertMessage?: string;
  daySpend: number;
  weekSpend: number;
  dailyLimit: number;
  weeklyLimit: number;
};

export type BudgetTracker = {
  /**
   * Pre-call guard: returns whether the call is allowed given current spend.
   * Does NOT record any usage.
   */
  check: () => BudgetCheckResult;
  /**
   * Post-call record: adds the call's token cost to the running totals and
   * returns the updated check result (may include a new alertMessage).
   */
  record: (
    tokens: { input: number; output: number; cacheRead: number; cacheWrite: number },
    model: string,
  ) => BudgetCheckResult;
  /** Returns a Telegram-formatted usage report string. */
  getStatusText: () => string;
};

// ---------------------------------------------------------------------------
// Date helpers (all UTC)
// ---------------------------------------------------------------------------

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStartUtc(fromDay?: string): string {
  const d = fromDay ? new Date(`${fromDay}T00:00:00Z`) : new Date();
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const sunday = new Date(d);
  sunday.setUTCDate(d.getUTCDate() - dayOfWeek);
  return sunday.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Persistence (synchronous — single-user bot, messages are serialized)
// ---------------------------------------------------------------------------

function resolveStatePath(cfg: BudgetConfig): string {
  const raw = cfg.persistPath ?? "~/.openclaw/budget-state.json";
  return raw.startsWith("~/") ? path.join(os.homedir(), raw.slice(2)) : raw;
}

function loadState(statePath: string): BudgetState {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw) as BudgetState;
  } catch {
    const today = todayUtc();
    return { day: today, daySpend: 0, weekStart: weekStartUtc(today), weekSpend: 0, lastAlertLevel: 0 };
  }
}

function saveState(statePath: string, state: BudgetState): void {
  try {
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${statePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tmp, statePath); // atomic on POSIX; best-effort on Windows
  } catch {
    // Best-effort — budget tracking must never crash the bot
  }
}

// ---------------------------------------------------------------------------
// State refresh (roll over day / week)
// ---------------------------------------------------------------------------

function refreshState(state: BudgetState): BudgetState {
  const today = todayUtc();
  const currentWeekStart = weekStartUtc(today);
  let updated = { ...state };

  if (updated.day !== today) {
    updated = { ...updated, day: today, daySpend: 0, lastAlertLevel: 0 };
  }
  if (updated.weekStart !== currentWeekStart) {
    updated = { ...updated, weekStart: currentWeekStart, weekSpend: 0 };
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Cost calculation
// ---------------------------------------------------------------------------

function calcCost(
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number },
  model: string,
): number {
  const p = resolvePricing(model);
  return (
    (tokens.input * p.input +
      tokens.output * p.output +
      tokens.cacheRead * p.cacheRead +
      tokens.cacheWrite * p.cacheWrite) /
    1_000_000
  );
}

// ---------------------------------------------------------------------------
// Result builder
// ---------------------------------------------------------------------------

function buildResult(
  state: BudgetState,
  cfg: BudgetConfig,
  newAlertLevel?: number,
): BudgetCheckResult {
  const dayFraction = state.daySpend / cfg.dailyDollars;
  const weekFraction = state.weekSpend / cfg.weeklyDollars;
  const hardStopped = cfg.hardStop && (dayFraction >= 1 || weekFraction >= 1);

  let alertMessage: string | undefined;
  if (newAlertLevel !== undefined && newAlertLevel > state.lastAlertLevel) {
    const alertPct = Math.floor(cfg.alertAt * 100);
    if (newAlertLevel >= 100) {
      alertMessage =
        dayFraction >= 1
          ? `🚫 Daily budget exhausted ($${state.daySpend.toFixed(2)}/$${cfg.dailyDollars.toFixed(2)}). Resets midnight UTC.`
          : `🚫 Weekly budget exhausted ($${state.weekSpend.toFixed(2)}/$${cfg.weeklyDollars.toFixed(2)}). Resets Sunday midnight UTC.`;
    } else if (newAlertLevel >= alertPct) {
      alertMessage = `⚠️ ${alertPct}% daily budget used ($${state.daySpend.toFixed(2)}/$${cfg.dailyDollars.toFixed(2)})`;
    }
  }

  return {
    allowed: !hardStopped,
    ...(hardStopped ? ({ hardStopped: true } as const) : {}),
    reason: hardStopped
      ? dayFraction >= 1
        ? `Daily API budget exhausted ($${state.daySpend.toFixed(2)}/$${cfg.dailyDollars.toFixed(2)}). Resets midnight UTC.`
        : `Weekly API budget exhausted ($${state.weekSpend.toFixed(2)}/$${cfg.weeklyDollars.toFixed(2)}). Resets Sunday midnight UTC.`
      : undefined,
    alertMessage,
    daySpend: state.daySpend,
    weekSpend: state.weekSpend,
    dailyLimit: cfg.dailyDollars,
    weeklyLimit: cfg.weeklyDollars,
  };
}

// ---------------------------------------------------------------------------
// Bar chart renderer
// ---------------------------------------------------------------------------

function renderBar(fraction: number, width = 10): string {
  const filled = Math.min(width, Math.round(fraction * width));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBudgetTracker(cfg: BudgetConfig): BudgetTracker {
  const statePath = resolveStatePath(cfg);
  // Load once from disk; subsequent refreshes are in-memory date rolls.
  let state = refreshState(loadState(statePath));

  const check = (): BudgetCheckResult => {
    state = refreshState(state);
    return buildResult(state, cfg);
  };

  const record = (
    tokens: { input: number; output: number; cacheRead: number; cacheWrite: number },
    model: string,
  ): BudgetCheckResult => {
    state = refreshState(state);
    const cost = calcCost(tokens, model);
    // Round to 6 decimal places to avoid floating-point drift
    state = {
      ...state,
      daySpend: Math.round((state.daySpend + cost) * 1_000_000) / 1_000_000,
      weekSpend: Math.round((state.weekSpend + cost) * 1_000_000) / 1_000_000,
    };

    const dayFraction = state.daySpend / cfg.dailyDollars;
    const weekFraction = state.weekSpend / cfg.weeklyDollars;
    const maxFraction = Math.max(dayFraction, weekFraction);
    const alertPct = Math.floor(cfg.alertAt * 100);

    let newAlertLevel = state.lastAlertLevel;
    if (maxFraction >= 1 && state.lastAlertLevel < 100) {
      newAlertLevel = 100;
    } else if (maxFraction >= cfg.alertAt && state.lastAlertLevel < alertPct) {
      newAlertLevel = alertPct;
    }

    const result = buildResult(state, cfg, newAlertLevel);
    if (newAlertLevel > state.lastAlertLevel) {
      state = { ...state, lastAlertLevel: newAlertLevel };
    }
    saveState(statePath, state);
    return result;
  };

  const getStatusText = (): string => {
    state = refreshState(state);
    const dayFraction = Math.min(1, state.daySpend / cfg.dailyDollars);
    const weekFraction = Math.min(1, state.weekSpend / cfg.weeklyDollars);
    return [
      "📊 *API Usage*",
      `Today:      $${state.daySpend.toFixed(2)} / $${cfg.dailyDollars.toFixed(2)}  [${renderBar(dayFraction)}] ${Math.round(dayFraction * 100)}%`,
      `This week:  $${state.weekSpend.toFixed(2)} / $${cfg.weeklyDollars.toFixed(2)}  [${renderBar(weekFraction)}] ${Math.round(weekFraction * 100)}%`,
      `Resets: midnight UTC · Sunday weekly`,
    ].join("\n");
  };

  return { check, record, getStatusText };
}

// ---------------------------------------------------------------------------
// Module-level singleton (one tracker per process, lazy-initialized)
// ---------------------------------------------------------------------------

let _instance: BudgetTracker | null | undefined; // undefined = not yet init; null = disabled

/** Extracts BudgetConfig from the raw OpenClaw gateway config object. */
function extractBudgetConfig(cfg: unknown): BudgetConfig | null {
  const budget = (cfg as Record<string, unknown>)?.budget as Record<string, unknown> | undefined;
  if (!budget || typeof budget.dailyDollars !== "number") return null;
  return {
    dailyDollars: budget.dailyDollars as number,
    weeklyDollars: typeof budget.weeklyDollars === "number" ? (budget.weeklyDollars as number) : 10,
    alertAt: typeof budget.alertAt === "number" ? (budget.alertAt as number) : 0.8,
    hardStop: typeof budget.hardStop === "boolean" ? (budget.hardStop as boolean) : true,
    persistPath: typeof budget.persistPath === "string" ? (budget.persistPath as string) : undefined,
  };
}

/**
 * Returns the process-level BudgetTracker singleton, or null if no budget
 * config is present.  Safe to call on every API call — init is O(1) after first.
 */
export function getBudgetTracker(cfg: unknown): BudgetTracker | null {
  if (_instance !== undefined) return _instance;
  const budgetCfg = extractBudgetConfig(cfg);
  _instance = budgetCfg ? createBudgetTracker(budgetCfg) : null;
  return _instance;
}

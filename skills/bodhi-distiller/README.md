# bodhi-distiller

**Status:** Planned (Phase 4)
**Trigger:** Cron — daily at 6:00am (local time)
**Schedule:** `0 6 * * *`

---

## What It Does

The Distiller runs every morning. It looks at everything you captured in the last
7 days, finds recurring themes, and sends you a short synthesis via Signal.

It also detects pattern candidates — tags that have appeared 3+ times — and
proposes creating a Pattern node for human approval.

---

## Input

All vault nodes from the last 7 days. Queried directly from the vault JSON store.

---

## Output

A morning digest message sent via Signal:

```
Morning.

Here is what your mind has been working on:

• [theme 1] — appeared [n] times, energy avg [x]
• [theme 2] — connected to [related tag]
• [synthesis observation]

One thing to sit with: [most energetic or recurring idea]
```

Optional pattern proposal (sent separately):

```
Noticed a pattern in your vault: "[tag]" appeared [n] times this week.
Create a Pattern node? Reply "yes", a name, or "no".
```

---

## Analysis Steps

1. Query all nodes created or updated in last 7 days
2. Group by `type` and by `tags` frequency
3. Compute average `energy_level` per tag cluster
4. Claude Sonnet 4.6 reads grouped nodes and generates digest bullets
5. Identify tags appearing 3+ times → flag as pattern candidates
6. Send digest via Signal
7. If pattern candidates exist, send separate pattern proposal

**Non-delivery condition:** If fewer than 3 nodes exist in the 7-day window, skip.
Silence is correct when the vault is quiet.

---

## Planned Implementation

- [ ] Register with OpenClaw Gateway as cron skill (`bodhi-distiller`)
- [ ] Implement vault query module (7-day window, by type + tag)
- [ ] Implement frequency analysis (tag counts, energy averages)
- [ ] Implement digest generation prompt (Claude Sonnet 4.6)
- [ ] Implement pattern proposal conversation handler
- [ ] Implement Signal delivery via OpenClaw Gateway
- [ ] Handle pattern confirmation ("yes" → write Pattern node with SURFACES_FROM edges)
- [ ] Tests for query, analysis, and delivery paths

# bodhi-janitor

**Status:** Planned (Phase 5)
**Trigger:** Cron — weekly, Sundays at 3:00am
**Schedule:** `0 3 * * 0`

---

## What It Does

The Janitor maintains vault health. It finds orphaned nodes, detects near-duplicates
using cosine similarity, and identifies broken edges.

It never takes action automatically. It generates a hygiene report and sends it
via Signal, then waits for human approval before touching anything.

---

## Input

The full vault — all nodes and edges.

---

## Output

A hygiene report sent via Signal:

```
Weekly vault report.

Orphans: [n] nodes with no connections
  → "[content preview]" (2026-03-01)

Possible duplicates: [n] pairs
  → "[title A]" and "[title B]" — similarity 0.94

Broken edges: [n]
  → Edge {uuid} references missing node {uuid}

Approve cleanup? Reply "yes" to merge duplicates and remove orphans.
Or reply specific node IDs to keep.
```

---

## Operations

### Orphan detection
Nodes with zero edges. Excludes nodes created in the last 7 days (too new to have edges yet).

### Duplicate detection
Embed all nodes with nomic-embed-text. Compute pairwise cosine similarity.
Flag pairs above 0.92 threshold. Show both contents to the user before any merge.

### Broken edge detection
Edges where `from` or `to` references a UUID that no longer exists in the vault.
These accumulate if nodes are deleted manually.

### Safe defaults
- Never delete without explicit user approval
- Never merge without showing both node contents
- Report only — no writes until user responds "yes"
- If user specifies node IDs to keep, exclude those from cleanup

---

## Planned Implementation

- [ ] Register with OpenClaw Gateway as cron skill (`bodhi-janitor`)
- [ ] Implement full vault scan (nodes + edges)
- [ ] Implement orphan detection (nodes with no edges, created > 7 days ago)
- [ ] Implement embedding + cosine similarity for duplicate detection
- [ ] Implement broken edge scanner
- [ ] Implement hygiene report formatter
- [ ] Implement Signal delivery
- [ ] Implement approval conversation handler
- [ ] Implement safe merge (combine content, transfer edges, delete source)
- [ ] Implement safe orphan removal (archive to `vault/archive/`, not delete)
- [ ] Tests for each detection and action path

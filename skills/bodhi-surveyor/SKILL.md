# bodhi-surveyor

**Status:** Planned (Phase 5)
**Trigger:** Cron — weekly, Saturdays at 2:00am
**Schedule:** `0 2 * * 6`

---

## What It Does

The Surveyor embeds your entire vault, clusters it with HDBSCAN, and finds the
ideas that bridge otherwise disconnected thought clusters.

It generates Synthesis nodes for significant bridges and writes them to the vault.
It also runs a SOC (self-organized criticality) analysis to identify idea clusters
approaching a readiness threshold.

---

## Input

The full vault — all nodes with their content.

---

## Output

1. Synthesis nodes written to vault (one per significant cluster bridge)
2. A weekly insight summary sent via Signal:

```
Weekly vault map.

[n] clusters found this week.
Top clusters:
  • "[cluster label]" — [n] nodes, energy avg [x]
  • "[cluster label]" — [n] nodes, energy avg [x]

New connections found:
  • "[synthesis content]" bridges [cluster A] and [cluster B]

SOC signal: "[cluster label]" has been building energy for [n] weeks.
```

---

## Clustering Approach

**Algorithm:** HDBSCAN (Hierarchical Density-Based Spatial Clustering of Applications with Noise)

**Why HDBSCAN over alternatives:**
- No need to specify number of clusters in advance
- Handles noise points gracefully (ideas that do not cluster yet)
- Robust to clusters of varying density
- Scales to tens of thousands of nodes without parameter tuning

**Parameters:**
- `min_cluster_size`: 5
- `min_samples`: 3
- `metric`: cosine

**Embedding model:** nomic-embed-text via Ollama (local)

**Cluster labeling:** Claude Sonnet 4.6 reads cluster contents and assigns a 3-5 word label.

---

## Bridge Discovery

After clustering, Surveyor identifies nodes with high betweenness centrality —
nodes that sit between two or more clusters without fully belonging to any one.

For each significant bridge node, Claude generates a Synthesis observation:

> "This idea connects [cluster A theme] with [cluster B theme] through [bridge concept]."

A Synthesis node is created and connected to both clusters via SURFACES_FROM edges.

---

## SOC Analysis

The Surveyor tracks energy distribution across all vault nodes over time.

A cluster is flagged as a nudge candidate when:
- Average `energy_level` > 3.5
- Appeared in 3+ consecutive Distiller weekly reports

When a cluster reaches this threshold, it is handed to the Nudge System (Phase 6)
which sends: "Ready to act?"

---

## Planned Implementation

- [ ] Register with OpenClaw Gateway as cron skill (`bodhi-surveyor`)
- [ ] Implement vault embedding pipeline (nomic-embed-text via Ollama)
- [ ] Implement HDBSCAN clustering (Python subprocess or wasm port)
- [ ] Implement cluster labeling (Claude Sonnet 4.6)
- [ ] Implement betweenness centrality calculation
- [ ] Implement bridge Synthesis node generation
- [ ] Implement SURFACES_FROM edge creation
- [ ] Implement SOC tracker (energy distribution + week-over-week change)
- [ ] Implement nudge candidate flagging
- [ ] Implement Signal delivery of weekly summary
- [ ] Tests for clustering, bridge detection, and SOC analysis

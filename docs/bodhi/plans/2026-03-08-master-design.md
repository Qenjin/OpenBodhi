# OpenBodhi Master Design

**Date:** 2026-03-08
**Status:** Approved

---

## What This Actually Is

OpenBodhi is a cognitive state machine. Not a note-taking app. Not a wellness chatbot. Not an AI journal.

The vault is a phase space. Ideas have energy. Energy accumulates through recurrence. When a cluster approaches a criticality threshold, the system detects it mathematically and surfaces it. One question. No advice. No coaching. The human decides.

It is local-first because your half-formed thoughts at 2am are not appropriate inputs for cloud services optimizing for engagement. It is minimal-intervention because the system's job is to reflect, not prescribe. It is built on science because hand-waving and name-dropping are not the same thing.

---

## What It Is Not

- Not a therapist
- Not a wellness coach
- Not a reminder system or streak tracker
- Not a chatbot you interact with constantly
- Not a cloud service

---

## Core System Components

### 1. OpenClaw Gateway
The foundation. Runs locally. Binds to 127.0.0.1. Handles all Telegram message routing, session management, built-in cron, and tool dispatch.

OpenClaw's architecture: Claude agent reads SKILL.md files as context, uses built-in tools (write, bash, read) to execute skill logic. Skills are prompt-based, not compiled plugins. This is intentional and simplifies implementation significantly.

Skills directory on machine: `~/.openclaw/workspace/skills/`
Config: `~/.openclaw/openclaw.json`

### 2. The Vault
Local filesystem. JSON files. Human-readable. Never synced externally.

```
vault/
  nodes/
    YYYY-MM/
      {uuid}.json    one file per thought
  edges/
    {uuid}.json      typed relationships
  archive/           Janitor-moved nodes, never deleted
  chroma/            ChromaDB vector store
  schema/
    nodes.json       JSON Schema for validation
    edges.json       JSON Schema for validation
    references/
      concepts.json  Hard-coded research paper references
  manifest.json      SHA-256 hash of every vault file (integrity)
```

### 3. Five Workers

| Worker | Trigger | Model | Scope |
|--------|---------|-------|-------|
| Curator | Every Telegram message | Claude Sonnet 4.6 | Capture + classify |
| Enricher | After every Curator write | Mistral Nemo 12B (local) | Expand + reference |
| Distiller | Cron 6am daily | Claude Opus 4.6 | 7-day synthesis |
| Janitor | Cron Sunday 3am | Claude Sonnet 4.6 | Vault hygiene |
| Surveyor | Cron Saturday 2am | Claude Sonnet 4.6 | Clustering + SOC |

### 4. The Meta-observer (Super-ego)
A sixth component that runs monthly. Observes the four workers' outputs over time. Produces "state of your thinking" synthesis — not what you're thinking about this week, but how your thinking is CHANGING over months.

Dying themes. Growing clusters. Unresolved contradictions that have persisted 3+ months. The delta of your mind over time.

Does not fire unless there is 90+ days of vault data. Does not advise. Reflects.

### 5. The Nudge System
Triggered by Surveyor's SOC analysis. One message when the math says a cluster is ready.

```
cluster avg energy_level > 3.5
AND appeared in 3+ consecutive Distiller reports
AND power law signature detected in energy distribution

→ "Ready to act?"
```

That is the entire nudge. No follow-up. No schedule. No guilt if ignored.

---

## Node Schema (Updated)

```json
{
  "id": "uuid-v4",
  "type": "Idea | Pattern | Practice | Decision | Synthesis | Integration",
  "content": "original thought, in the user's words, unedited",
  "content_enriched": "legible expansion by local model",
  "energy_level": 4,
  "created_at": "2026-03-08T06:00:00Z",
  "enriched_at": "2026-03-08T06:00:05Z",
  "source": "telegram",
  "tags": ["tag-one", "tag-two"],
  "related_papers": [
    {
      "concept": "psychological-recovery",
      "citation": "Sonnentag & Fritz (2007)",
      "url": "https://doi.org/10.1037/0021-9010.92.3.677"
    }
  ],
  "enrichment_model": "mistral-nemo:12b",
  "content_hash": "sha256:abc123...",
  "cluster_id": null,
  "embedding_model": "nomic-embed-text"
}
```

**Embedding strategy:**
- HDBSCAN and cosine similarity: use `content_enriched` (richer semantic signal)
- Distiller digest display: use `content` (preserves original voice)
- Surveyor cluster labeling: send `content_enriched` to Claude

---

## Enricher Design

The Enricher is a subprocess, not a cron worker. It fires asynchronously after every Curator vault write.

**Model:** Mistral Nemo 12B via Ollama
- `OLLAMA_HOST=127.0.0.1:11434` (must be explicit — Ollama defaults to 0.0.0.0 on Linux)
- Falls back to Qwen2.5-7B if hardware cannot run 12B

**Reference library:** `vault/schema/references/concepts.json`
- Hard-coded DOIs and Google Scholar URLs
- No runtime API calls, no hallucinated citations
- Local model identifies concepts, reference file provides links
- Add new references when new domains appear in your thinking

**Enricher prompt:**
```
You are reading a raw captured thought. Do three things:

1. If the text is fragmented or unclear, rewrite it as one or two clear sentences preserving the original meaning exactly. Do not add interpretation.

2. Identify which academic or research concepts are relevant. Choose from the concept keys in the reference file.

3. Return JSON only:
{
  "content_enriched": "...",
  "concept_keys": ["key1", "key2"]
}

Raw thought: {content}
```

**What it does NOT do:**
- Does not change the meaning of the original thought
- Does not add opinions or advice
- Does not hallucinate citations
- Does not run if content_enriched already exists (idempotent)

---

## The Science (Actually Applied)

### Self-Organized Criticality (Per Bak, 1987)

Bak, Tang & Wiesenfeld showed that complex systems naturally evolve toward a critical state where avalanches (cascades) of all sizes are possible, following a power law distribution: P(s) ~ s^(-tau), where tau ~ 1.5 for the sandpile model.

**Applied here:**
- `energy_level` is the grain of sand
- The vault is the sandpile
- A cluster of nodes accumulating high energy is a local accumulation
- When the distribution of energy across the vault approaches power law, the system is at criticality
- Surveyor measures this weekly and flags clusters approaching threshold

The prediction: if a cluster has been building energy for 8+ weeks and the energy distribution is approaching power law, a cognitive cascade is statistically likely. That is when Bodhi sends "Ready to act?" Not because a calendar says so. Because the math says so.

### HDBSCAN (McInnes et al., 2017)

Hierarchical Density-Based Spatial Clustering of Applications with Noise. Chosen over k-means and OPTICS because:
- Does not require specifying number of clusters in advance
- Handles noise gracefully (ideas that do not cluster yet)
- Robust to clusters of varying density
- Scales to tens of thousands of nodes

Parameters: `min_cluster_size=5`, `min_samples=3`, `metric=cosine`

Embeddings are generated from `content_enriched` using nomic-embed-text via Ollama.

### Betweenness Centrality

After clustering, nodes are scored by betweenness centrality — their position on paths between other nodes. High-centrality nodes are bridges: ideas connecting otherwise separate clusters.

Bridge nodes have the highest cascade potential because they carry energy from multiple domains. Surveyor generates Synthesis nodes for the top bridges.

### Spaced Repetition (Ebbinghaus, 1885)

High-energy un-acted nodes surface at increasing intervals: 1 day, 3 days, 7 days, 21 days, 60 days.

This is not a reminder system. It is a mirror. The thought surfaces because it has energy. If you dismiss it, the interval extends. If you engage with it, the energy updates.

---

## Full Phase Breakdown

### Phase 0: Foundation (DONE)
- Fork OpenClaw
- Documentation, architecture, ontology
- Vault schema (nodes.json, edges.json)
- SKILL.md files for all workers
- Repo public, branded, clean

### Phase 1: Machine + Gateway

**Hardware:**
- Ubuntu 24.04 LTS desktop (Linux — user's primary machine)
- LUKS2 full disk encryption (before any vault data exists)
- 8GB+ RAM, SSD

**OS setup:**
```bash
# LUKS2 at install time — mandatory
# Dedicated bodhi system user
useradd -r -s /bin/false -M -d /opt/openbodhi bodhi

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow in on tailscale0 to any port 22 proto tcp
ufw enable

# Fail2ban
apt install fail2ban
```

**OpenClaw install:**
```bash
# Node 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | bash
apt install nodejs

# OpenClaw
npm install -g openclaw
openclaw onboard --install-daemon

# Config: ~/.openclaw/openclaw.json
{ "agent": { "model": "anthropic/claude-sonnet-4-6" } }
```

**Ollama install:**
```bash
curl -fsSL https://ollama.com/install.sh | sh

# Harden before starting
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_ORIGINS=http://127.0.0.1"
EOF
systemctl daemon-reload && systemctl restart ollama

# Pull models
ollama pull nomic-embed-text
ollama pull mistral-nemo:12b

# Verify binding
ss -tlnp | grep 11434  # must show 127.0.0.1
```

**4 security patches to OpenClaw core:**
1. Token redaction: any string matching API key pattern is redacted before rendering in WebChat UI
2. Message dedup: 60-second TTL Map keyed by message ID before any processing
3. Binding assertion: startup check that gateway binds to 127.0.0.1, throws if not
4. Telegram whitelist: BODHI_ALLOWED_USERS enforced before OpenClaw's pairing-code flow

**Environment (systemd credentials, not .env):**
```
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=...
BODHI_ALLOWED_USERS=<your-telegram-id>
BODHI_VAULT_PATH=/opt/openbodhi/vault
OLLAMA_HOST=http://127.0.0.1:11434
```

**End-to-end test:**
- Send Telegram message from owner account
- Verify Claude responds
- Send from different account: verify silent drop (no response, no log of content)

### Phase 2: Vault Schema + Curator + Enricher

**Vault module (Python — not TypeScript):**
```python
# packages/bodhi_vault/write.py
# packages/bodhi_vault/read.py
# packages/bodhi_vault/validate.py  -- jsonschema against nodes.json/edges.json
# packages/bodhi_vault/embed.py     -- nomic-embed-text via Ollama API
# packages/bodhi_vault/manifest.py  -- SHA-256 hash maintenance
# packages/bodhi_vault/enrich.py    -- Mistral Nemo via Ollama, concepts.json lookup
```

**Curator SKILL.md (updated for OpenClaw prompt architecture):**
The Curator SKILL.md is read by Claude agent in OpenClaw. Claude uses the `write` tool to create vault node files, calls `bash` to run embed.py, and calls `bash` to run enrich.py asynchronously.

Key behavior changes from original spec:
- Energy inferred from language, NOT prompted (removes "Energy 1-5?" question — breaks zero friction)
- Content hash written with every node for Janitor integrity checks
- Enrichment triggered async via bash subprocess

**Tests (pytest):**
- vault write + read round-trip: node written, queried back, content identical
- Schema rejection: missing required field throws, no partial write
- Manifest update: every write updates manifest.json
- Enricher: valid JSON returned, concept keys matched against concepts.json
- Enricher idempotency: running twice on same node does not change output

### Phase 3: Distiller

Uses OpenClaw's built-in cron (not system cron).

**Analysis:**
1. Query vault for last 7 days: `read.py --days 7`
2. Group by tag frequency, compute `avg(energy_level)` per tag cluster
3. Pattern candidates: tags appearing 3+ times
4. Claude Opus reads grouped nodes (as `content` — original voice), generates digest
5. Send via Telegram
6. If pattern candidates: separate message proposing Pattern node
7. If fewer than 3 nodes in window: silence

**Digest tone:** calm, observational. Not motivational. Not therapeutic.

### Phase 4: Janitor + Surveyor

**Janitor:**
- Full vault scan every Sunday 3am
- Integrity check: verify every file hash against manifest.json first
- If integrity fails: halt, report, do not proceed
- Orphan detection (nodes with zero edges, created > 7 days ago)
- Duplicate detection: embed all nodes, pairwise cosine similarity > 0.92
- Broken edge detection
- Send hygiene report with human approval gate
- On approval: move orphans to `vault/archive/`, merge duplicates, remove broken edges
- Never delete. Archive only.

**Surveyor:**
- Embed all nodes using `content_enriched` field via nomic-embed-text
- HDBSCAN: `min_cluster_size=5`, `min_samples=3`, `metric=cosine`
- Cluster labeling: Claude Sonnet reads cluster contents, assigns 3-5 word label
- Betweenness centrality: find bridge nodes
- Generate Synthesis nodes for top 3 bridges
- SOC analysis: plot energy distribution, check for power law signature (scipy.stats.powerlaw.fit)
- Flag clusters where avg energy > 3.5 AND appeared in 3+ consecutive Distiller reports
- Send weekly insight summary
- Write cluster_id back to node files for all clustered nodes

### Phase 5: Nudge System

- SOC threshold detection feeds Nudge System
- Spaced repetition: un-acted high-energy nodes (energy >= 4) surface at 1/3/7/21/60 day intervals
- "Message from past self": highest-energy un-acted node from 60-90 days ago
- One message per day maximum (prevent fatigue)
- If user engages with a nudge: reset interval, update node `last_surfaced_at`

### Phase 6: Meta-observer (Super-ego)

Runs monthly. Requires 90+ days of vault data to activate.

**What it observes:**
- Which tags/clusters are growing in frequency and energy (month over month)
- Which tags/clusters are declining
- Unresolved contradictions: CONTRADICTS edges where neither node has been acted on in 90+ days
- The single idea with the highest sustained energy over the entire vault history
- How the ratio of node types has shifted (more Decisions? fewer Ideas? more Integration?)

**Output (monthly):**
```
Here is what your mind has been doing for the past [n] months.

Growing: [theme] — up from [n] nodes/month to [n] nodes/month
Fading: [theme] — appeared [n] times in month 1, [n] times last month
Unresolved: you've been holding "[A]" and "[B]" in tension for 4 months

The one thing with the most sustained energy: "[quote]"

No action required. This is what you've been working on.
```

**Not advice. Not analysis. A mirror.**

**Contemplation prompts (separate from the monthly synthesis):**
Generated from your own vault. Your words, reframed as questions. Not AI questions. Bodhi takes a high-energy Idea and asks: "You wrote: '[content]'. What do you actually think?"

These fire at most once per week, only for nodes with energy >= 4 and age >= 7 days.

---

## Research Reference Library

Initial `vault/schema/references/concepts.json` domains:
- Self-Organized Criticality (Bak et al., 1987)
- Spaced Repetition / Spacing Effect (Ebbinghaus, 1885)
- Flow State (Csikszentmihalyi, 1990)
- Cognitive Load Theory (Sweller, 1988)
- Psychological Recovery (Sonnentag & Fritz, 2007)
- Self-Determination Theory (Deci & Ryan, 1985)
- Metacognitive Monitoring (Flavell, 1979)
- Default Mode Network (Beaty et al., 2016)
- Neuroplasticity and Learning (ongoing)
- Behavioral Activation (Lewinsohn, 1974)
- Decision Fatigue (Baumeister et al., 1998)
- Insight and Incubation (Sio & Ormerod, 2009)
- Growth Mindset (Dweck, 2006)
- Intrinsic Motivation (Ryan & Deci, 2000)
- Sleep and Memory Consolidation (Walker, 2017)

The library grows as new domains appear in the vault.

---

## Security Architecture

Reference: `docs/bodhi/security.md` (full threat model)

| Layer | Mitigation |
|-------|-----------|
| Physical | LUKS2 full disk encryption, strong passphrase |
| Network | UFW deny all inbound except SSH via Tailscale |
| Process | bodhi system user, systemd hardening, NoNewPrivileges |
| Ollama | Explicit `OLLAMA_HOST=127.0.0.1:11434` binding |
| Telegram auth | BODHI_ALLOWED_USERS whitelist, silent drop on unauthorized |
| Secrets | systemd credentials, not plaintext .env |
| Vault integrity | SHA-256 manifest, Janitor verifies before any operation |
| Supply chain | pnpm lockfile, git-secrets pre-commit hooks |
| Audit | Metadata-only logs, vault content never logged |
| SSH | Key-only, Tailscale subnet only, fail2ban |

**Credentials requiring immediate rotation:**
- Telegram bot token (was in session history)
- Anthropic API key (was in session history)

---

## Stack

| Component | Technology |
|-----------|-----------|
| OS | Ubuntu 24.04 LTS |
| Runtime | Node.js 22+ |
| Package manager | pnpm |
| Gateway | OpenClaw (prompt-based skills) |
| Primary AI | Claude Sonnet 4.6 (fast tasks) / Opus 4.6 (synthesis) |
| Local AI | Mistral Nemo 12B via Ollama (enrichment) |
| Embeddings | nomic-embed-text via Ollama (local) |
| Vault scripts | Python 3.11+ |
| Vector store | ChromaDB (embedded, Python client) |
| Clustering | HDBSCAN (scikit-learn-extra / hdbscan package) |
| Messaging | Telegram (OpenClaw's Telegram bridge) |
| Remote access | Tailscale |
| Disk encryption | LUKS2 |

---

## What "Showing You Mean Business" Actually Requires

1. **Ship the Curator.** Working on your machine. One thought in, one vault node written. Record a 60-second video. That transforms the repo from spec to system.

2. **Let the vault fill for 30 days.** Then run the Surveyor. If the clusters are real and the energy distribution approaches power law, you have a scientifically demonstrable result nobody else has published.

3. **Write the Substack post when Phase 2 ships.** Not before. Announce a working system, not a spec.

4. **The Meta-observer is your headline when you launch publicly.** Not four workers. A system that watches how your thinking changes over months and reflects it back without judgment. That is genuinely new.

---

## Critical Path

```
LUKS2 setup
  > OpenClaw Gateway + Telegram (Phase 1)
    > Curator + Enricher + Vault module (Phase 2)
      > 30 days of capture
        > Distiller (Phase 3)
          > 4 weeks of digests
            > Surveyor + Janitor (Phase 4)
              > 3 months of data
                > Meta-observer (Phase 6)
```

Everything flows from data accumulation. No shortcuts. The science requires time.

---

## Unanswered Questions

- "6 glasses of water" — meaning not yet clarified, not included in this design
- Super-ego trigger: currently designed as monthly automated (option A) + contemplation prompts (option C). User has not confirmed this.
- Hardware specs for Linux desktop: unknown, Mistral Nemo 12B requires 8GB VRAM

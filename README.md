# OpenBodhi

> A thinking partner that remembers. Private. Local-first. Open source.

OpenBodhi is an [OpenClaw](https://github.com/openclaw/openclaw) fork
built for one purpose: to be your private AI thinking partner focused
on wellness, personal growth, and preserving the ideas that matter to you.

Powered by Claude Opus 4.6 with 1M context. Captures your thinking
when it arrives, connects patterns over time, and keeps your data
entirely yours.

Built in South Dakota. MIT Licensed.

[Landing Page](https://qenjin.io/openbodhi) ·
[Substack](https://growmindspace.substack.com) ·
[Roadmap](./ROADMAP.md)

---

## The Person This Is For

You have ideas that matter. They arrive fast. In fragments.
By the time you sit down to write them out, the energy is gone.

Most tools make you organize before you capture. AI assistants
listen for one session, then forget everything.

Bodhi is different. Send a thought through Signal or WhatsApp.
No formatting. No categories. Just the thought. Bodhi files it,
tags it, and asks for an energy level. That is it.

You come back three days in a row to the same idea. Bodhi notices.
It does not prompt you to act. It asks one question: "Ready to act?"

The system works because it meets you where thinking actually happens.
Not in a productivity app. In a message thread. At 2am. On a walk.

---

## Philosophy

Ideas are trains of thought, not isolated sparks. The problem
is not motivation. It is how people think.

Most personal knowledge tools assume you already know what matters.
They ask you to tag, file, and categorize before you have had time
to understand what you are looking at. That friction is where insights die.

Bodhi inverts this. Capture is zero-friction. The system organizes.
You think.

Over time, patterns emerge. Not because you forced them. Because the
system found them in the data you already created.

Key principles:
- System-based, not personality-based. Data structures over chatbot personas.
- Ideas have energy. Tracking that energy is more useful than any tag.
- Open source because thinking is sovereignty. Your data, your system.
- Local-first because your thoughts are the most sensitive data you carry.
- Privacy is not a feature. It is the foundation.

See [docs/philosophy.md](./docs/philosophy.md) for the full treatment.

---

## How It Works

### Capture → Pattern → Surface → Act

1. **Capture**: Send a message via Signal/WhatsApp. Bodhi tags it,
   assigns a node type, asks for energy level (1-5).
2. **Pattern**: The Distiller reviews the last 7 days, finds recurring
   themes, synthesizes connections.
3. **Surface**: The Surveyor embeds your entire vault into vector space,
   runs HDBSCAN clustering, finds bridges between idea clusters.
4. **Act**: When you return to the same idea 3 days in a row,
   Bodhi sends one message: "Ready to act?"

### Knowledge Ontology

6 node types: Idea, Pattern, Practice, Decision, Synthesis, Integration

6 relationship types: LEADS_TO, GENERATES, SURFACES_FROM, CONTRADICTS,
ASSOCIATED_WITH, INFORMS

See [docs/ontology.md](./docs/ontology.md) for the full schema.

### Four Workers

| Worker | Schedule | Purpose |
|--------|----------|---------|
| Curator | Real-time | Receives messages, tags, files |
| Distiller | 6am daily | Weekly synthesis, morning digest |
| Janitor | Weekly | Vault hygiene, orphan detection |
| Surveyor | Weekly | HDBSCAN clustering, bridge discovery |

See [docs/workers.md](./docs/workers.md) for detailed specs.

---

## Architecture

OpenBodhi is a full fork of [OpenClaw](https://github.com/openclaw/openclaw),
inheriting its Gateway WebSocket architecture, multi-channel messaging
(Signal, WhatsApp, Telegram), and agent/skills system.

**What OpenBodhi adds:**
- Wellness-focused knowledge ontology (typed nodes + relationships)
- 4 autonomous worker agents (Curator, Distiller, Janitor, Surveyor)
- SOC-inspired pattern detection (self-organized criticality)
- Energy-level tracking as the core metric
- Morning digest and nudge system
- HDBSCAN clustering pipeline for idea graph

**Stack:**
- Primary intelligence: Claude Opus 4.6 (1M context)
- Fast tasks: Claude Sonnet 4.6
- Local models (optional): Ollama with Qwen3-8B
- Embeddings: nomic-embed-text via Ollama
- Input: Signal / WhatsApp via OpenClaw bridges
- Vector store: ChromaDB (local)
- Runtime: Node.js 22+, TypeScript, pnpm

See [docs/architecture.md](./docs/architecture.md).

---

## Hardware Requirements

**Minimum (local development):**
- GPU: NVIDIA GTX 1070 (8GB VRAM) or equivalent
- CPU: Intel i5 or equivalent
- RAM: 16GB recommended
- Storage: 50GB free (models + vault)
- OS: Windows 11, macOS, or Linux
- Node.js 22+
- Docker Desktop (for isolated development)

**API keys needed:**
- Anthropic API key (Claude)

See [docs/setup-local.md](./docs/setup-local.md).

---

## Status

**Pre-alpha** — Documentation and architecture phase.
Building in public on [Substack](https://growmindspace.substack.com).

Contributions welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT — See [LICENSE](./LICENSE).

---

*Bodhi. Enlightenment. Built in South Dakota.*
*good comes from good*

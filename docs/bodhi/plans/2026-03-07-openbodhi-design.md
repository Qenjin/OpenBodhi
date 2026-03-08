# OpenBodhi: GitHub Repo Setup + Docs-First Launch

**Date:** 2026-03-07
**Status:** Executed

---

## Context

OpenBodhi is an OpenClaw fork that transforms a general personal AI assistant into
an ultra-personal wellness-focused 3rd brain system.

This document records the initial design and architecture decisions made at the
project's inception. It serves as the first entry in the `docs/plans/` archive.

**Intended outcome:** A public GitHub repo that communicates the full OpenBodhi vision,
architecture, and development roadmap. Substack audience can follow the build.
Contributors can understand what is being built and why.

---

## Decisions Made

### Fork strategy
Full GitHub fork of `github.com/openclaw/openclaw`. OpenClaw provides:
- Gateway WebSocket architecture
- Multi-channel messaging (Signal, WhatsApp, Telegram)
- Agent/skills system
- Active maintenance from Peter Steinberger and the community

### Day 1 scope
Docs-first. No custom code in Phase 0. The OpenClaw base is the running code.
Custom code begins in Phase 2 (Curator Worker).

### What OpenBodhi adds to OpenClaw
- Wellness-focused knowledge ontology (typed nodes + relationships)
- 4 autonomous worker agents (Curator, Distiller, Janitor, Surveyor)
- SOC-inspired pattern detection
- Energy-level tracking as the core metric
- Morning digest and nudge system
- HDBSCAN clustering pipeline

### Network isolation
Deferred to Phase 1. Docker Compose with egress whitelist will be documented then.

### Vedich
NOT included anywhere in this repo. Separate private initiative.

### Hardware target
GTX 1070 (8GB VRAM), Intel i5, 16GB RAM, 1TB SSD. Windows 11 primary development.

### Local model selection
Qwen3-8B at Q4_K_M quantization (~5.8-6.3GB VRAM). Best 8B for agent tool-calling
as of Q1 2026 (Apache 2.0 license). Sub-2s tool calls on GTX 1070.

Model cascade:
- Router: Qwen3-0.6B (local, optional)
- Local: Qwen3-8B (local, optional)
- Complex tasks: Claude Opus 4.6 (API, primary)
- Fast tasks: Claude Sonnet 4.6 (API)

### Embeddings
nomic-embed-text via Ollama. Approximately 274MB. No VRAM cost at inference time
when running alongside Qwen3-8B due to sequential scheduling.

### Vector store
ChromaDB in embedded mode. No separate server process. Python client only.

### Graph storage
JSON files. One file per node, one file per edge. Stored by year-month directory.
No database dependency. Human-readable. Backup-friendly.

### Database (future consideration)
PostgreSQL + pgvector + Apache AGE (graph queries + vector search, single transaction boundary)
is the preferred path if JSON files become a bottleneck at scale.
Mem0 (48K stars, $24M raised, arXiv:2504.19413) is worth monitoring for the hybrid
vector/graph/key-value approach.

### Collaboration target
David Szabo-Stuban (@ssdavid on Substack) — only person publicly building Palantir
ontology + HDBSCAN on an OpenClaw fork. Direct outreach candidate when Phase 3 ships.

---

## Folder Structure

```
openbodhi/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── ROADMAP.md
├── CODE_OF_CONDUCT.md
├── .gitignore
├── .env.example
├── docs/
│   ├── architecture.md
│   ├── ontology.md
│   ├── workers.md
│   ├── philosophy.md
│   ├── setup-local.md
│   └── plans/
│       └── 2026-03-07-openbodhi-design.md   ← this file
├── site/
│   └── index.html
├── skills/
│   ├── bodhi-curator/README.md
│   ├── bodhi-distiller/README.md
│   ├── bodhi-janitor/README.md
│   └── bodhi-surveyor/README.md
├── vault/
│   └── schema/
│       ├── nodes.json
│       └── edges.json
└── config/
    └── .gitkeep
```

---

## Key External References

- OpenClaw: https://github.com/openclaw/openclaw
- Alfred fork by David Szabo-Stuban: private, documented on Substack
- SOC in the brain: https://www.frontiersin.org/articles/10.3389/fphy.2021.639389/full
- Per Bak's sandpile: https://en.wikipedia.org/wiki/Self-organized_criticality
- Mem0: arXiv:2504.19413
- Qwen3: https://huggingface.co/Qwen/Qwen3-8B
- nomic-embed-text: https://huggingface.co/nomic-ai/nomic-embed-text-v1
- Landing page: https://qenjin.io/openbodhi
- Build-in-public: https://growmindspace.substack.com

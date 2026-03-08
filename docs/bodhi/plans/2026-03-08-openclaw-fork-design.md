# OpenBodhi — OpenClaw Fork Design

**Date:** 2026-03-08  
**Status:** Approved, In Execution

## Summary

OpenBodhi is a wellness-focused 3rd brain built as a fork of OpenClaw. This document captures the architectural decisions made for the proper fork implementation.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment | Dedicated Ubuntu 24.04 LTS machine | Local-first, not cloud-exposed, Signal-compatible |
| Channel | Telegram (primary) | Always-on, doesn't require local hardware |
| Fork strategy | Skills-only | Stay close to upstream, all Bodhi logic in skills/ |
| Core patches | 4 targeted | Token leakage, circuit breaker, localhost binding, vault isolation |
| Standalone bot | Archived (legacy/standalone-bot branch) | Proof-of-concept, not the foundation |

## Architecture

```
Telegram → OpenClaw Gateway (127.0.0.1:18789) → Bodhi Skills → vault/ (local filesystem)
                                                              ↓
                                                    Anthropic API (message text only)
```

## UX Principles

- Zero friction capture — no questions, no forms
- Energy inferred from language, never prompted
- SOC-based nudges — ideas reach readiness naturally
- Spaced repetition — high-energy ideas surface at optimal intervals
- Bodhi never deletes — human approval required

## Science Backing

- Spaced repetition (Ebbinghaus forgetting curve)
- Self-Organized Criticality (Per Bak, 1987 — sandpile model)
- HDBSCAN (McInnes, 2017 — density clustering)
- Betweenness centrality (bridge idea discovery)
- Ecological Momentary Assessment (in-context capture)

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized Telegram access | User whitelist (7090591859 only) |
| Gateway internet exposure | Binds 127.0.0.1 only, UFW blocks externally |
| Vault data leakage | chmod 700, bodhi user only |
| Token leakage in UI | Core patch (Patch 1) |
| Duplicate message flooding | Circuit breaker 60s TTL (Patch 2) |
| SSH access | Key-only, password auth disabled |
| Remote access | Tailscale only |

## Build Phases

1. **Phase 0 (current):** Proper OpenClaw fork, Bodhi docs migrated ✓
2. **Phase 1:** Dedicated Ubuntu machine + OpenClaw Gateway running
3. **Phase 2:** bodhi-curator skill (Telegram → vault capture)
4. **Phase 3:** Vault persistence layer (packages/bodhi-vault/)
5. **Phase 4:** bodhi-distiller (6am digest, spaced repetition)
6. **Phase 5:** bodhi-janitor + bodhi-surveyor (hygiene + HDBSCAN)
7. **Phase 6:** SOC nudge system, Alfred/SiYuan integration

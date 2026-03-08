# Contributing to OpenBodhi

Thank you for your interest in contributing. OpenBodhi is a focused project with
a specific philosophy. Read [docs/philosophy.md](./docs/philosophy.md) before contributing.
Understanding why this exists helps you contribute things that fit.

---

## Before You Start

1. **Read the philosophy.** [docs/philosophy.md](./docs/philosophy.md) is short.
   It will tell you if this project aligns with what you want to build.

2. **Open an issue first.** Before writing code, open a GitHub Issue describing what
   you want to add or change. This prevents wasted effort on PRs that do not align
   with the project direction.

3. **Check the roadmap.** [ROADMAP.md](./ROADMAP.md) shows what is planned.
   If your idea is already on the roadmap, comment on the relevant phase.

---

## What We Are Looking For

Good contributions to OpenBodhi:
- Implement something from the [ROADMAP.md](./ROADMAP.md)
- Fix a bug with a clear reproduction case
- Improve documentation with accurate, concise writing
- Add tests for existing functionality

What we are not looking for:
- Features that increase complexity without clear benefit to the core user
- Cloud integrations (this is a local-first project)
- Gamification, streaks, dashboards, or metrics that push behavior
- Dependencies that require an internet connection for core functionality

---

## Development Setup

See [docs/setup-local.md](./docs/setup-local.md) for full environment setup.

Quick start:

```bash
git clone https://github.com/YOUR_USERNAME/OpenBodhi
cd OpenBodhi
pnpm install
cp .env.example .env
# Edit .env with your Anthropic API key
pnpm start
```

---

## Code Style

- **Language:** TypeScript. Strict mode enabled.
- **Formatter:** Prettier with default settings
- **Linter:** ESLint — follow OpenClaw conventions
- **Tests:** Vitest. All new functionality needs tests.
- **Commits:** Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`)

```bash
pnpm lint       # Run ESLint
pnpm format     # Run Prettier
pnpm test       # Run Vitest
pnpm typecheck  # Run TypeScript compiler check
```

All four must pass before a PR is mergeable.

---

## Writing a Bodhi Skill

Skills are the primary extension point. Each skill is a Node.js module that
registers with the OpenClaw Gateway.

Skill directory structure:

```
skills/bodhi-[name]/
├── README.md          ← required: spec, trigger, input/output
├── package.json
├── src/
│   ├── index.ts       ← skill registration + handler
│   └── [name].ts      ← core logic
└── tests/
    └── [name].test.ts
```

Each skill must:
- Export a `register(gateway)` function
- Declare its trigger (message type, cron, or event)
- Write all vault changes through the vault module (do not write files directly)
- Log operations to the standard Bodhi logger (no `console.log`)

See `skills/bodhi-curator/` as the reference implementation once Phase 2 ships.

---

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes with tests
4. Run `pnpm lint && pnpm test && pnpm typecheck`
5. Open a PR against `main`
6. Fill out the PR template
7. Wait for review

PRs that touch core vault logic (nodes, edges, schema) require extra scrutiny.
Data integrity is not negotiable.

---

## Philosophy Alignment

If you are unsure whether your contribution fits, ask yourself:

- Does this make the system more local and more private?
- Does this reduce friction for the user, or does it add steps?
- Does this treat the user's data as theirs?
- Does this serve the thinking, or does it distract from it?

If the answer to any of these is no, reconsider the contribution.

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

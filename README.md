<p align="center">
  <img src="assets/llm-hunter-banner.svg" alt="LLM Hunter" width="100%">
</p>

# 🐛 LLM Hunter

**A layered, multi-agent engine that turns an LLM coding agent into a disciplined pentest / bug
bounty operator.** LLM-agnostic (Claude, GPT, or a single small model), self-improving, and built so
that the authorized scope is the only guardrail.

---

## Why this exists

This project was born out of frustration. Coding agents like Claude Code have enormous potential for
security work — but out of the box they aren't structured enough for real pentests. It was like a
**rough diamond**: the power was clearly there, but nobody quite knew how to cut it. Left alone, the
model tends to give up too early (*"this is closed, dead end"*) exactly when the finding is right in
front of it, restarts from scratch every engagement, and has no memory of what worked last time.

LLM Hunter is the cut. It wraps the raw capability in a methodology: a fixed set of agent roles, a
deterministic orchestration, hard scope discipline, and a learning loop so the engine gets sharper
every run.

## It evolves — with you

The engine **grows per user**. Every campaign feeds a learning loop: whenever an agent discovers a
bypass, a technique, or a methodology, it's captured and reformatted into a reusable skill. The more
you hunt, the deeper *your* instance's skill bank becomes — it starts to reflect how *you* work.

Power users will naturally accumulate the richest skill banks. If that's you: **please share your
skills back with the community.** That's how everyone's diamond gets sharper.

> ⚙️ This is an evolving project. Expect frequent updates, new agent roles, new skills, and broader
> LLM/runtime support over time.

## Core principle: scope is the only guardrail

There is no added "relevance" filter and no self-censorship on *"will this even work?"*. The engine
runs anything the program authorizes — and it authorizes **exactly** what the program allows, no more
and **no less**. Two filters exist; only one is applied:

| Filter | Applied? |
|---|---|
| **Authorization** — is the test permitted by `rules.yaml`? | ✅ strict, non-negotiable |
| **Relevance** — does the test have a chance of succeeding? | ❌ never |

Legitimacy is enforced up front: no campaign starts without a verified authorization (a bug bounty
program page, or a signed pentest engagement letter). **Use it only against targets you are
authorized to test.**

## How it works

<p align="center">
  <img src="assets/architecture.svg" alt="LLM Hunter architecture" width="100%">
</p>

> A styled, interactive version lives in [`docs/pipeline_schema.html`](docs/pipeline_schema.html) (open it in a browser).

**The squad formula.** Tool-agents = **N** (one per *authorized* tool, inclusive — even low-utility
tools are deployed). Orchestrators = **ceil(N/5)** (one per pool of 5). Masters aggregate into a
single conclusion.

**Anti-give-up.** A *persistence-controller* intercepts every negative verdict and forces up to 3
retries before a "no vulnerability" is accepted as final.

**Creative pool ("crazy agents").** A firewalled set of agents receives *only the raw attack
surface* — never prior conclusions or "already tried" verdicts — so their creativity is never
poisoned by defeatism. A *global* super-agent correlates their raw output back into the main loop.

**Learning loop.** Discoveries are captured raw by any agent, then a dedicated `skill-writer`
reformats them into clean, reusable skills. Only the skill/config layer is mutable — the base runs
(workflows, agent roles) are immutable.

**Budget modes.** `peu` / `normal` / `beaucoup` scale the creative pool size *and* retry depth
together, since both draw on the same token budget.

## LLM-agnostic by design

Models are expressed as **tiers** (`cheap` / `mid` / `strong`), not vendor names — see
[`docs/MODEL_STRATEGY.md`](docs/MODEL_STRATEGY.md).

- **Multi-model runtime** (Claude Code, etc.): each tier runs on its **real** model — a `cheap` role
  actually runs the small model, never a large one in disguise (tokens = money).
- **Single-model runtime**: same model everywhere, with **reasoning effort** dialed per tier
  (cheap = low … strong = high). The cost hierarchy is preserved via effort instead of model.

## Repository layout

```
docs/                  ARCHITECTURE.md · MODEL_STRATEGY.md · pipeline_schema.html
rules/                 SCHEMA.md (rules.yaml format) + examples/
TOOLS_CATALOG.md       universal tool menu + authorization metadata
.claude/agents/        one file per role (10 roles), model tier in frontmatter
.claude/skills/        reusable methodology (+ learned/ skill bank grown per run)
.claude/workflows/     orchestration scripts (recon · attack · crazy · main-loop)
CLAUDE.md              the operating contract (guardrails & conventions)
```

## Status

🚧 **v1 skeleton** — all 10 roles, 5 skills, and 4 workflows are in place as structurally complete
stubs. End-to-end wiring and more community skills are on the way.

## Contributing

Found a technique the engine should know? Package it as a skill under `.claude/skills/learned/` and
open a PR. Community skills make every hunter's engine sharper.

## ⚠️ Authorized use only

LLM Hunter is for **authorized** security testing: public/private bug bounty programs and pentests
under signed contract. The legitimacy gate will refuse to start without proof of authorization. Do
not point it at anything you don't have explicit permission to test.

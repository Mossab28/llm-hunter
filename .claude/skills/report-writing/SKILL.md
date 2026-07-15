---
name: report-writing
description: Use to turn a verified finding into a high-quality bug bounty report (H1/Bugcrowd). Covers the summary/repro/PoC/impact/root-cause/fix structure, framing of the vuln class, and admissibility discipline (Signal).
---

# report-writing — high-quality report

An admissible, well-rated report (Signal) follows a strict structure and proves real impact.

## Structure
1. **Summary** — one sentence: which vuln, which asset, which impact.
2. **Steps to reproduce** — numbered, reproducible by triage without guessing.
3. **PoC** — minimal, clean. Naming: H1 handle in the filename + comment (per
   `rules.yaml.reporting`). Provide the test IP/domain.
4. **Impact** — concrete, aligned with the program's severity table.
5. **Root cause** — why it is vulnerable (not just "it works").
6. **Fix** — proposed remediation.

## Framing
- Frame the vuln within a **class accepted** by the program (e.g. broken-access-control), never
  in an excluded class (e.g. CSRF).
- If `novelty_required`: show how it is a **new variant** vs the known patched
  reports (otherwise duplicate = $0).

## Discipline (Signal)
- 1 vuln per report, unless chaining is necessary for the impact. Same root cause → 1 bounty.
- Quality > quantity: an invalid/duplicate report lowers Signal and can block future
  submissions. Only submit what is proven, with real effect demonstrated.

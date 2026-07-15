export const meta = {
  name: 'crazy-pipeline',
  description: 'Creative pool: crazy agents (fresh eyes, firewall) → crazy Recon → crazy Attack → master → controller',
  phases: [
    { title: 'Idéation', detail: 'crazy agents generate extreme hypotheses' },
    { title: 'Recon Fou', detail: 'surface the hypotheses' },
    { title: 'Attaque Fou', detail: 'test the hypotheses, no self-censorship' },
    { title: 'Persistance', detail: '3 attempts before final negative' },
  ],
}

// FIREWALL: the crazy agents receive ONLY the raw surface + rules.yaml.
// Never the angles already tested, nor the verdicts ("exhausted"/"negative"/"closed"), nor the patched catalog.
// args = { rules, rawSurface, mode, baseFou }
const rules = args?.rules ?? '(rules.yaml missing)'
const rawSurface = args?.rawSurface ?? '(raw surface missing)'

// --- Budget: the mode drives the crazy pool size AND the retry depth -------------
// The crazy pool and retry consume the same token budget → same knob. normal = default.
function foPlan(mode, base) {
  if (mode === 'peu') return { poolSize: Math.max(1, Math.floor(base / 2)), maxRetry: 2 }
  if (mode === 'beaucoup') return { poolSize: 2 * base, maxRetry: 3 }
  return { poolSize: base, maxRetry: 3 } // normal (default)
}
const mode = args?.mode ?? 'normal'
const baseFou = args?.baseFou ?? 3
let { poolSize } = foPlan(mode, baseFou)
// If a token_target is set (via the global budget), bound the pool so as not to exceed it.
if (budget?.total && budget.remaining() < 50_000) poolSize = Math.max(1, Math.floor(poolSize / 2))

const HYPOTHESES = { type: 'object', properties: {
  hypotheses: { type: 'array', items: { type: 'object', properties: {
    idea: { type: 'string' }, target_surface: { type: 'string' },
    why_novel: { type: 'string' }, how_to_test: { type: 'string' },
  }, required: ['idea', 'how_to_test'] } },
}, required: ['hypotheses'] }

// --- phase 1: ideation (independent crazy agents, no memory) ----------
phase('Idéation')
const pools = await parallel(Array.from({ length: poolSize }, (_, i) => () =>
  agent(
    `You are a crazy agent #${i + 1} (fresh eyes). Here is ONLY the raw surface and the scope. ` +
    `Produce extreme/original attack hypotheses, without any relevance filter. ` +
    `Stay within the authorized scope.\n\n--- RAW SURFACE ---\n${rawSurface}\n\n--- RULES ---\n${rules}`,
    { label: `fou:${i + 1}`, phase: 'Idéation', agentType: 'agent-fou', schema: HYPOTHESES }
  )
))
const hypotheses = pools.filter(Boolean).flatMap((p) => p.hypotheses ?? [])
log(`Budget mode "${mode}" → ${poolSize} crazy agents (base ${baseFou}). ${hypotheses.length} hypotheses generated.`)

// --- phases 2+3: crazy Recon then crazy Attack (same structure as the main pipeline) ---
// Skeleton: we will reuse recon-pipeline / attack-pipeline via workflow() once wired up.
// Here we test each hypothesis directly (pipeline with no barrier).
phase('Attaque Fou')
const tested = await pipeline(
  hypotheses,
  (h) => agent(
    `Test this crazy hypothesis on the surface, within scope. No self-censorship — execute even ` +
    `if "it probably won't work".\n${JSON.stringify(h)}\n--- RULES ---\n${rules}`,
    { label: `test-fou`, phase: 'Attaque Fou', agentType: 'master-attack', schema: {
      type: 'object', properties: { lead: { type: 'string' },
        verdict: { type: 'string', enum: ['confirmed', 'negative', 'ambiguous'] },
        evidence: { type: 'string' }, retry_hint: { type: 'string' } }, required: ['verdict'] } }
  ),
  // persistence-controller per hypothesis (same logic: 3 attempts)
  (res, h) => agent(
    `persistence-controller (creative): is this negative reliable or suspect? If suspect, indicate ` +
    `the adjustment for a new attempt (max 3 cumulative). Idea: ${JSON.stringify(h)}\n${JSON.stringify(res)}`,
    { label: `persistence-fou`, phase: 'Persistance', agentType: 'persistence-controller' }
  )
)

// The raw creative conclusion THEN goes, without a relevance filter, to the super-agent-global.
const creativeConclusion = tested.filter(Boolean)
log(`Creative pool done: ${creativeConclusion.length} hypotheses tested and reported raw.`)
return { creativeConclusion, hypothesesCount: hypotheses.length }

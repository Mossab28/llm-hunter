export const meta = {
  name: 'attack-pipeline',
  description: 'Attack phase: N tool-agents → orchestrators (1/5) → master-attack → persistence-controller (3 attempts)',
  phases: [
    { title: 'Tool-agents', detail: 'N attack tool-agents in parallel' },
    { title: 'Orchestrateurs', detail: 'ceil(N/5) small conclusions' },
    { title: 'Master', detail: 'big attack conclusion' },
    { title: 'Persistance', detail: 'anti-false-negative, up to 3 attempts' },
  ],
}

// args = { rules, target, tools, mode }  — leads decided by the super-agent-principal
const rules = args?.rules ?? '(rules.yaml missing)'
const target = args?.target ?? '(target missing)'
const tools = args?.tools ?? []

// The budget mode drives the retry depth of the persistence-controller (peu=2, normal/beaucoup=3).
function maxRetryFor(mode) { return mode === 'peu' ? 2 : 3 }
const mode = args?.mode ?? 'normal'
const MAX_RETRY = maxRetryFor(mode)

function chunk5(arr) { const o = []; for (let i = 0; i < arr.length; i += 5) o.push(arr.slice(i, i + 5)); return o }

const ATTACK_MASTER = { type: 'object', properties: {
  findings: { type: 'array', items: { type: 'object', properties: {
    lead: { type: 'string' },
    verdict: { type: 'string', enum: ['confirmed', 'negative', 'ambiguous'] },
    evidence: { type: 'string' }, confidence: { type: 'number' }, retry_hint: { type: 'string' },
  }, required: ['lead', 'verdict'] } },
  summary: { type: 'string' },
}, required: ['findings'] }

const CONTROLLER_OUT = { type: 'object', properties: {
  passthrough: { type: 'array', items: { type: 'object' } },
  retry: { type: 'array', items: { type: 'object', properties: {
    lead: { type: 'string' }, adjustment: { type: 'string' },
  } } },
}, required: ['passthrough', 'retry'] }

// --- attack loop with persistence-controller (max 3 attempts) -----
// Principle: a SUSPECT negative is sent back to the pool with an adjustment, up to 3 cumulative
// attempts, before being accepted as definitive. Prevents premature abandonment on a false negative.
async function runAttackRound(activeTools, roundLabel) {
  phase('Tool-agents')
  const toolResults = await parallel(activeTools.map((t) => () =>
    agent(`Run the attack "${t}" on ${target}. rules.yaml (authorization/limits/stop):\n${rules}`,
      { label: `atk:${t}:${roundLabel}`, phase: 'Tool-agents', agentType: 'tool-agent' })
  ))
  phase('Orchestrateurs')
  const pools = chunk5(toolResults.filter(Boolean))
  const small = await parallel(pools.map((pool, i) => () =>
    agent(`Cross-reference these attack results into a small conclusion. No self-censorship.\n${JSON.stringify(pool)}`,
      { label: `orch:${i + 1}:${roundLabel}`, phase: 'Orchestrateurs', agentType: 'squad-orchestrator' })
  ))
  phase('Master')
  return await agent(
    `Aggregate into a big attack conclusion. For each negative/ambiguous, give a retry_hint. ` +
    `'confirmed' requires proof of real effect, not a cosmetic 200.\n${JSON.stringify(small.filter(Boolean))}`,
    { label: `master-attack:${roundLabel}`, phase: 'Master', agentType: 'master-attack', schema: ATTACK_MASTER }
  )
}

let activeTools = tools
const definitive = []
let attempt = 0

while (attempt < MAX_RETRY && activeTools.length) {
  attempt++
  const master = await runAttackRound(activeTools, `t${attempt}`)

  phase('Persistance')
  const verdict = await agent(
    `You are the persistence-controller (attempt ${attempt}/${MAX_RETRY}). Judge each negative/ambiguous: ` +
    `reliable → passthrough; suspect → retry with an adjustment (encoding, config, variant), without ` +
    `ever exceeding rules.yaml. Beyond ${MAX_RETRY} cumulative attempts, accept the negative.\n${rules}\n` +
    JSON.stringify(master),
    { label: `persistence:t${attempt}`, phase: 'Persistance', agentType: 'persistence-controller', schema: CONTROLLER_OUT }
  )

  definitive.push(...(verdict?.passthrough ?? []))
  const retry = verdict?.retry ?? []
  if (!retry.length) break
  // Reactivate only the tools of the leads to retry (skeleton: lead→tool mapping to refine).
  activeTools = retry.map((r) => r.lead)
  log(`Attempt ${attempt}: ${retry.length} tests sent back to the pool (suspect negatives).`)
}

log(`Attack done after ${attempt} attempt(s): ${definitive.length} definitive verdicts.`)
return { findings: definitive, attempts: attempt }

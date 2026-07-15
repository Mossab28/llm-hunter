export const meta = {
  name: 'main-loop',
  description: 'Master loop: super-agent-principal drives Recon⇄Attack; crazy-pipeline in parallel; super-agent-global correlates',
  phases: [
    { title: 'Recon', detail: 'main recon workflow' },
    { title: 'Attaque', detail: 'main attack workflow (post-persistence)' },
    { title: 'Créatif', detail: 'crazy agents pool in parallel' },
    { title: 'Corrélation', detail: 'super-agent-global crosses creative ⇄ main' },
    { title: 'Pilotage', detail: 'super-agent-principal: continue / stop / pivot' },
  ],
}

// args = { rules, target, mode, baseFou, learning }
// mode/baseFou/learning normally come from the pentest-intake questionnaire → rules.yaml.
const rules = args?.rules ?? '(rules.yaml missing)'
const target = args?.target ?? '(target missing)'
const mode = args?.mode ?? 'normal'          // peu | normal | beaucoup (default)
const baseFou = args?.baseFou ?? 3
const learningOn = args?.learning ?? true

// Skeleton of the master loop. The fine wiring (tool selection by the main agent, multi-round
// loop, lead→tool mapping) will be completed in the next runnable iteration.

// 1) MAIN RECON
phase('Recon')
const recon = await workflow('recon-pipeline', {
  rules, target,
  tools: ['crt_sh', 'subfinder', 'httpx', 'katana', 'waybackurls', 'gau'], // selection to be decided by the main agent
})

// 2) The super-agent-principal decides the attacks from the big recon conclusion
phase('Attaque')
const attackPlan = await agent(
  `You are the Super-Agent Principal. From this big recon conclusion, decide the attack ` +
  `leads and the useful tools (inclusive policy). Stay within rules.yaml.\n` +
  `${JSON.stringify(recon?.bigConclusion)}\n--- RULES ---\n${rules}`,
  { label: 'principal:plan', phase: 'Attaque', agentType: 'super-agent-principal' }
)

// 3) MAIN ATTACK (already contains the persistence-controller; retry depth = mode)
const attack = await workflow('attack-pipeline', {
  rules, target, mode,
  tools: ['burp', 'dalfox', 'jwt_tool'], // to be derived from attackPlan
})

// 4) CREATIVE in parallel — firewall: receives only the RAW SURFACE (not the main verdicts)
//    Crazy pool size derived from the budget mode (peu / normal / beaucoup).
phase('Créatif')
const rawSurface = recon?.bigConclusion // NOTE: extract only the "raw surface" part here
const crazy = await workflow('crazy-pipeline', { rules, rawSurface, mode, baseFou })

// 5) CORRELATION — the super-agent-global crosses the two worlds (never the main agent itself)
phase('Corrélation')
const correlation = await agent(
  `You are the Super-Agent Global. Cross the state of the MAIN attack and the raw CREATIVE ` +
  `conclusion. Redistribute only the relevant correlations (your filter kicks in AFTER generation).\n` +
  `--- MAIN ---\n${JSON.stringify(attack?.findings)}\n--- CREATIVE ---\n${JSON.stringify(crazy?.creativeConclusion)}`,
  { label: 'global:corr', phase: 'Corrélation', agentType: 'super-agent-global' }
)

// 6) STEERING — the main agent decides continue / stop / pivot (a legitimate stop only
//    after validation of the negatives by the persistence-controller)
phase('Pilotage')
const decision = await agent(
  `Super-Agent Principal: given the findings (post-persistence) and the Global's correlations, ` +
  `decide continue / stop / pivot. Never conclude "closed" on an unverified negative.\n` +
  `--- FINDINGS ---\n${JSON.stringify(attack?.findings)}\n--- CORRELATIONS ---\n${JSON.stringify(correlation)}`,
  { label: 'principal:decision', phase: 'Pilotage', agentType: 'super-agent-principal' }
)

// 7) LEARNING (tier 2) — the skill-writer reformats the inbox of raw discoveries into clean,
//    reusable skills. Writes ONLY in .claude/skills/learned/ (run immutability).
let learned = null
if (learningOn) {
  phase('Apprentissage')
  learned = await agent(
    `You are the skill-writer. Go back over the inbox .claude/skills/learned/_inbox/: reformat each ` +
    `raw discovery captured during this campaign into a clean, reusable SKILL.md in ` +
    `.claude/skills/learned/<slug>/. Deduplicate against the existing bank. NEVER write anywhere ` +
    `other than under learned/. Then empty the processed inbox.\n--- RULES ---\n${rules}`,
    { label: 'skill-writer', phase: 'Apprentissage', agentType: 'skill-writer' }
  )
}

return { recon, attack, crazy, correlation, decision, learned }

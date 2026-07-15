# TOOLS_CATALOG — universal tool menu

**Universal** catalog of recon/attack/cross-cutting tools. It is the *menu* from which the
`scope-analyst` picks to build the `tools.allowed` of a `rules.yaml`. **No tool is
"forbidden" in itself** — it is `rules.yaml` (hence the program's scope) that judges the authorization.

Each tool carries **authorization metadata** so the scope-analyst can filter:

- `class`: `recon` | `attack` | `transversal`
- `aggressiveness`: `passive` | `active-light` | `active-heavy` — many programs
  forbid `active-heavy` (mass scanners, fuzzing).
- `volume`: `low` | `medium` | `high` — a `high` profile often violates a "single-digit" cap.
- `notes`: usage constraints.

> ⚠️ An `active-heavy` / `volume: high` tool (sqlmap, mass ffuf, nuclei, gobuster…) is
> frequently **out of a program's rules**. The scope-analyst only adds it to `allowed` if the
> program explicitly authorizes it (the `scope-analyst` decides per program — see `rules/SCHEMA.md`).

## Recon

| id | tool | class | aggressiveness | volume | notes |
|---|---|---|---|---|---|
| `crt_sh` | crt.sh (CT logs) | recon | passive | low | Certificate Transparency, 100% passive |
| `subfinder` | subfinder | recon | active-light | medium | passive+DNS subdomain enumeration |
| `amass` | amass | recon | active-light | medium | can scale up in volume (active mode) |
| `httpx` | httpx | recon | active-light | medium | HTTP probe, respect rate-limit |
| `naabu` | naabu | recon | active-heavy | high | port scan — often out of scope |
| `katana` | katana | recon | active-light | medium | crawler |
| `nmap` | nmap | recon | active-heavy | high | active scan — forbidden on internal |
| `waybackurls` | waybackurls | recon | passive | low | historical URLs (archive) |
| `gau` | gau / gauplus | recon | passive | low | aggregates Wayback+CommonCrawl+OTX |
| `httprobe` | httprobe | recon | active-light | medium | mass live-host verification |
| `oneforall` | OneForAll | recon | active-light | medium | multi-source subdomain enumeration |
| `scilla` | Scilla | recon | active-light | medium | DNS/subdomain/port/directory enumeration |
| `cariddi` | Cariddi | recon | active-light | medium | endpoint crawl + secret detection |
| `meg` | meg | recon | active-light | medium | mass fetch of paths across N hosts |
| `haylxon` | haylxon | recon | active-light | medium | mass screenshots (visual recon) |
| `shodan` | Shodan | recon | passive | low | exposed services, origin IP behind CDN |
| `censys` | Censys | recon | passive | low | recon of exposed IPs/services |
| `dorkagent` | DorkAgent | recon | passive | low | automated Google dorking + LLM triage |
| `js-recon` | JS Recon (ext) | recon | passive | low | scan HTML/JS for secrets/tokens |

## Attack

| id | tool | class | aggressiveness | volume | notes |
|---|---|---|---|---|---|
| `burp` | Burp Suite | attack | active-light | low | interception proxy, manual testing |
| `nuclei` | nuclei | attack | active-heavy | high | template scanner — often out of scope |
| `sqlmap` | sqlmap | attack | active-heavy | high | automated SQL injection — often forbidden |
| `ffuf` | ffuf | attack | active-heavy | high | fuzzing — `constraints` mandatory if authorized |
| `gobuster` | gobuster | attack | active-heavy | high | directory enumeration — often forbidden |
| `dalfox` | dalfox | attack | active-light | medium | XSS |
| `jwt_tool` | jwt_tool | attack | passive | low | JWT analysis — on one's own tokens |
| `interactsh` | Interactsh / Burp Collaborator | attack | active-light | low | OOB detection (blind SSRF/RCE via DNS/HTTP callbacks) |
| `gxss` | Gxss | attack | active-light | medium | param reflection testing (XSS candidates) |
| `bucketloot` | BucketLoot | attack | active-light | medium | scan S3/GCS/DO buckets + secret extraction |
| `nessus` | Nessus | attack | active-heavy | high | general-purpose vuln scanner — often out of scope |

## Transversal

| id | tool | class | aggressiveness | volume | notes |
|---|---|---|---|---|---|
| `mitmproxy` | mitmproxy | transversal | passive | low | interception / replay |
| `browser-mcp` | driven browser (MCP) | transversal | active-light | low | behind Burp, real signed client |
| `frida` | Frida | transversal | active-light | low | native hook / re-signing (own device) |
| `objection` | objection | transversal | active-light | low | cert-pinning bypass (own device) |
| `caido` | Caido | transversal | active-light | medium | web proxy (Burp alt) |
| `zap` | OWASP ZAP | transversal | active-light | medium | web proxy/scanner (Burp alt) |
| `gf` | gf (gf-patterns) | transversal | passive | low | grep filtering of patterns (SSRF/XSS/…) on URLs |
| `qsreplace` | qsreplace | transversal | passive | low | substitution of query-string values |
| `ip-rotator` | requests-ip-rotator | transversal | active-light | medium | IP rotation (AWS API GW), rate-limit bypass |
| `ghidra` | Ghidra / Gore | transversal | passive | low | reverse engineering (binaries, Go support) |

## Extending the catalog

Add a row with the `class` / `aggressiveness` / `volume` / `notes` metadata. Do NOT
mark a tool as "forbidden" here — authorization is decided by `rules.yaml`, per program.

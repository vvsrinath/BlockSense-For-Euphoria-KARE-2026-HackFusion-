# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use GitHub's private reporting instead:
**Security → Report a vulnerability** on the repository page. That opens a
private advisory visible only to the maintainers.

Please include:

- What the issue is and which component is affected
- Steps to reproduce, ideally a minimal request or input
- The impact you believe it has
- Any suggested fix

You can expect an acknowledgement within a few days. If a fix is warranted we
will agree a disclosure timeline with you, and we will credit you in the
advisory unless you prefer to stay anonymous.

## What matters most

BlockSense is a read-only analysis tool. It has no authentication, no database
and no write endpoints, which removes whole classes of vulnerability by design.
The areas worth your attention:

### Amount handling

**The most important invariant in the codebase.** Token amounts must be
processed as `bigint` in base units and only become a decimal string at the
display boundary. A change that routes an amount through `Number`,
`parseFloat` or arithmetic that coerces to a float will produce a wrong balance
for large values while looking correct for small ones.

`tests/amount.test.ts` is the guard. A patch that weakens it should be treated as
a security change.

### Secret handling

RPC URLs and API keys are read from environment variables only. They must never
be:

- committed to the repository
- written to a log
- returned in an API response
- included in a build artefact

`pnpm check:env` deliberately prints only whether a variable is set, never its
value, and exists so that a contributor can verify their setup without leaking
their key into a terminal recording or an issue.

### Input validation

Every path and body parameter that reaches an adapter is validated with the
shared zod schemas. The API bounds request bodies at 1 MB, caps page size and
network depth, and restricts CORS to a configured allowlist.

### Denial of service

Graph expansion is bounded (`DEFAULT_MAX_ENTITIES = 120`, depth capped at 4)
because an unbounded traversal of a real blockchain will not terminate. If you
change that, keep it bounded.

## Out of scope

- Missing rate limiting on a development server with no authentication.
- The accuracy of anomaly scores. These are heuristic, documented as
  hand-tuned, and are not a security boundary. Do not rely on BlockSense as your
  only defence against a fraudulent transaction.
- Issues in upstream dependencies with no exploitable path through this code.

## Supported versions

BlockSense is pre-1.0 and under active development. Fixes land on `main`.

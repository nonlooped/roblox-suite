# Roblox Suite evaluations

These tasks measure the product claim: whether loading Roblox Suite makes an agent choose current APIs and safer failure semantics.

## Protocol

For the same agent/model/version and clean context:

1. Run every prompt in `tasks.json` without repository content.
2. Run every prompt again after loading `roblox/SKILL.md` and only the specialists listed by the task.
3. Save verbatim outputs as `runs/<run-id>/responses/<task-id>.md`.
4. Add `metadata.json`:

```json
{
  "run_id": "agent-model-baseline-YYYY-MM-DD",
  "agent": "agent name and version",
  "model": "provider/model/version",
  "suite_enabled": false,
  "commit": "full git commit"
}
```

5. Run `node evals/check.mjs evals/runs/<run-id>`. A nonzero exit is expected when a run has failures; the report is still written.
6. Human-review critical answers for authority boundaries, ambiguous writes, idempotency, and API correctness. Record overrides rather than weakening a regex to hide a failure.

## What is checked

The first gate detects required and forbidden patterns for deprecated APIs, server authority, write uncertainty, idempotency, reserved-server allocation, rate-limit headers, modern animation/physics, and workflow selection. Luau emitted by an agent should additionally be parsed/type-checked in a controlled fixture.

Results must include failures. Do not compare runs that changed model, agent, prompt, checker, or suite commit without labeling the confounder.

## Published runs

- [2026-07-16 — Codex / gpt-5.6-sol](reports/2026-07-16-codex-gpt-5.6-sol.md): baseline 6/10, Suite 10/10. Raw paired outputs and machine reports are under `runs/`.

This single run is an initial baseline, not a universal performance claim. Repeat it across agents/models and publish failures and variance.

#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const taskSource = await readFile(path.join(root, "tasks.json"), "utf8");
const parsed = JSON.parse(taskSource);
const errors = [];
if (parsed.schema_version !== 1 || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
  errors.push("tasks.json must contain schema_version 1 and a non-empty tasks array");
}
const ids = new Set();
for (const task of parsed.tasks ?? []) {
  if (!/^[a-z0-9-]+$/.test(task.id ?? "")) errors.push(`invalid task id ${task.id}`);
  if (ids.has(task.id)) errors.push(`duplicate task id ${task.id}`);
  ids.add(task.id);
  if (!task.prompt || !Array.isArray(task.specialists) || task.specialists.length === 0) {
    errors.push(`${task.id} is missing prompt or specialists`);
  }
  for (const group of [task.checks?.require, task.checks?.forbid]) {
    if (!Array.isArray(group)) {
      errors.push(`${task.id} has invalid checks`);
      continue;
    }
    for (const pattern of group) {
      try { new RegExp(pattern, "im"); } catch (error) { errors.push(`${task.id} invalid regex ${pattern}: ${error}`); }
    }
  }
}

const evaluateResponse = (task, response) => {
  const code = [...response.matchAll(/```(?:lua|luau|json|sh|bash|text)?\s*\n([\s\S]*?)```/gi)]
    .map((match) => match[1])
    .join("\n");
  const failures = [];
  for (const pattern of task.checks.require) {
    if (!new RegExp(pattern, "is").test(response)) failures.push(`missing required pattern: ${pattern}`);
  }
  for (const pattern of task.checks.forbid) {
    if (new RegExp(pattern, "im").test(code)) failures.push(`matched forbidden code pattern: ${pattern}`);
  }
  return failures;
};

const taskHash = createHash("sha256").update(taskSource).digest("hex");
const runsDir = path.join(root, "runs");
for (const runName of await readdir(runsDir)) {
  const run = path.join(runsDir, runName);
  const metadata = JSON.parse(await readFile(path.join(run, "metadata.json"), "utf8"));
  const report = JSON.parse(await readFile(path.join(run, "report.json"), "utf8"));
  if (metadata.task_sha256 !== taskHash) errors.push(`${runName} metadata uses a stale task hash`);
  if (report.task_sha256 !== taskHash) errors.push(`${runName} report uses a stale task hash`);
  for (const field of ["run_id", "agent", "model", "commit", "protocol", "tool_access", "suite_context_sha256"]) {
    if (!metadata[field]) errors.push(`${runName} metadata is missing ${field}`);
    if (report[field] !== metadata[field]) errors.push(`${runName} report metadata does not match ${field}`);
  }
  if (report.suite_enabled !== metadata.suite_enabled) {
    errors.push(`${runName} report metadata does not match suite_enabled`);
  }

  const reportedResults = new Map((report.results ?? []).map((result) => [result.id, result]));
  let passed = 0;
  for (const task of parsed.tasks) {
    const responsePath = path.join(run, "responses", `${task.id}.md`);
    try {
      await access(responsePath);
      const response = await readFile(responsePath, "utf8");
      const failures = evaluateResponse(task, response);
      const expectedPassed = failures.length === 0;
      const result = reportedResults.get(task.id);
      if (!result) {
        errors.push(`${runName} report is missing result ${task.id}`);
        continue;
      }
      if (result.response_sha256 !== createHash("sha256").update(response).digest("hex")) {
        errors.push(`${runName} report has a stale response hash for ${task.id}`);
      }
      if (result.passed !== expectedPassed || JSON.stringify(result.failures) !== JSON.stringify(failures)) {
        errors.push(`${runName} report has stale checks for ${task.id}`);
      }
      if (expectedPassed) passed += 1;
    } catch {
      errors.push(`${runName} is missing response ${task.id}`);
    }
  }
  if (reportedResults.size !== ids.size) errors.push(`${runName} report result count does not match tasks`);
  if (report.passed !== passed || report.total !== ids.size || report.pass_rate !== passed / ids.size) {
    errors.push(`${runName} report summary is stale`);
  }
}

if (errors.length) {
  console.error(`Evaluation validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Evaluation validation passed for ${ids.size} tasks.`);

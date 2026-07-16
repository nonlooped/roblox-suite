#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const runDir = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) {
  console.error("usage: node evals/check.mjs evals/runs/<run-id>");
  process.exit(2);
}
const tasks = JSON.parse(await readFile(path.join(root, "tasks.json"), "utf8")).tasks;
const metadata = JSON.parse(await readFile(path.join(runDir, "metadata.json"), "utf8"));
const results = [];

for (const task of tasks) {
  const responsePath = path.join(runDir, "responses", `${task.id}.md`);
  let response = "";
  try {
    response = await readFile(responsePath, "utf8");
  } catch {
    results.push({ id: task.id, passed: false, failures: ["missing response"] });
    continue;
  }
  const failures = [];
  const code = [...response.matchAll(/```(?:lua|luau|json|sh|bash|text)?\s*\n([\s\S]*?)```/gi)]
    .map((match) => match[1])
    .join("\n");
  for (const pattern of task.checks.require) {
    if (!new RegExp(pattern, "is").test(response)) failures.push(`missing required pattern: ${pattern}`);
  }
  for (const pattern of task.checks.forbid) {
    if (new RegExp(pattern, "im").test(code)) failures.push(`matched forbidden code pattern: ${pattern}`);
  }
  results.push({
    id: task.id,
    passed: failures.length === 0,
    failures,
    response_sha256: createHash("sha256").update(response).digest("hex"),
  });
}

const passed = results.filter((result) => result.passed).length;
const report = {
  schema_version: 1,
  ...metadata,
  passed,
  total: results.length,
  pass_rate: results.length ? passed / results.length : 0,
  results,
};
await writeFile(path.join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  `# Evaluation: ${metadata.run_id}`,
  "",
  `- Agent: ${metadata.agent}`,
  `- Model: ${metadata.model}`,
  `- Suite enabled: ${metadata.suite_enabled}`,
  `- Commit: ${metadata.commit}`,
  `- Score: **${passed}/${results.length}**`,
  "",
  "| Task | Result | Machine-check failures |",
  "| --- | --- | --- |",
  ...results.map((result) => `| ${result.id} | ${result.passed ? "pass" : "fail"} | ${result.failures.join("; ") || "—"} |`),
  "",
  "> Pattern checks are a reproducible first gate, not proof of runtime correctness. Critical tasks also require human and Roblox integration review.",
  "",
].join("\n");
await writeFile(path.join(runDir, "REPORT.md"), markdown);
console.log(`${metadata.run_id}: ${passed}/${results.length}`);
process.exitCode = passed === results.length ? 0 : 1;

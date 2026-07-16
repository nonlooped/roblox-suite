#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const schema = JSON.parse(await readFile(path.join(root, "schemas", "skills.sh.schema.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(root, "skills.sh.json"), "utf8"));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(validate.errors);
  process.exit(1);
}
console.log("skills.sh.json matches the vendored official schema.");

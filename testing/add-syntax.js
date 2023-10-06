/*
  This script updates syntax for given CSS feature and type in test data.
*/

/* eslint-disable-next-line n/no-unsupported-features/node-builtins */
import fs from "node:fs/promises";
import * as Utils from "./utils.js";
import { getDescriptorName } from "../query-syntax.js";

const helpMessage =
  "Usage:\n\t" +
  "npm run add-syntax '[feature-name]' '[feature-type]'\n\t" +
  "node testing/add-syntax '[feature-name]' '[feature-type]'\n";

if (process.argv.length < 3) {
  console.error(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(1);
} else if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.info(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(0);
}

let name = process.argv[2];
const type = process.argv[3];
let syntax = Utils.getSyntaxForType(name, type);

if (syntax) {
  syntax = {
    name: name,
    type: type,
    ...syntax,
  };

  if (type === "at-rule-descriptor") {
    name = getDescriptorName(name);
  }

  await fs.writeFile(
    `testing/data/${type}__${name}.json`,
    JSON.stringify(syntax, undefined, "  ")
  );
}

console.log(`Added ${type}__${name}`);

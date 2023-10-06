/*
  This script tests all the syntaxes in test data against syntaxes returend by the current code.
*/

/* eslint-disable-next-line n/no-unsupported-features/node-builtins */
import fs from "node:fs/promises";
import * as Utils from "./utils.js";
import * as Diff from "diff";
/* eslint-disable-next-line no-unused-vars */

function logDiff(oldString, newString) {
  const diff = Diff.diffLines(oldString, newString);

  for (const part of diff) {
    let prefix = "";
    if (part.added) {
      prefix = "+";
    } else if (part.removed) {
      prefix = "-";
    }
    let value = prefix + part.value.replaceAll("\n", "\n" + prefix);
    value = value.replace(/[+-]$/gm, "");
    process.stdout.write(value);
  }

  console.log("\n----");
}

const errors = [];
let total = 0;
for await (const filePath of Utils.walkSync("testing/data")) {
  if (filePath.endsWith(".json")) {
    total++;
    try {
      const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
      const oldSyntax = JSON.stringify(
        { syntax: data.syntax, constituents: data.constituents },
        undefined,
        "  "
      );
      const newSyntax = JSON.stringify(
        Utils.getSyntaxForType(data.name, data.type),
        undefined,
        "  "
      );

      if (oldSyntax !== newSyntax) {
        console.warn(`${data.name} ${data.type}`);
        logDiff(oldSyntax, newSyntax);
        errors.push(`${data.name} ${data.type}`);
      }
    } catch (e) {
      console.error(`Error processing ${filePath}: ${e.message}`);
      throw e;
    }
  }
}

if (errors.length > 0) {
  console.warn(
    `Following ${errors.length}/${total} syntaxes are not matching:\n\t`,
    errors.join("\n\t")
  );
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(1);
} else {
  console.log("All syntaxes match!");
}

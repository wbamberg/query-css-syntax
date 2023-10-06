/*
  This script adds/updates syntax for all the CSS features documented in mdn/content repo.
*/

/* eslint-disable-next-line n/no-unsupported-features/node-builtins */
import fs from "node:fs/promises";
import * as Utils from "./utils.js";

const helpMessage =
  "Usage:\n\t" + "node testing/populate-from-content.js '[contentRoot]'\n";

if (process.argv.length < 2) {
  console.error(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(1);
} else if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.info(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(0);
}

const contentRoot = `${process.argv[2]}/files/en-us/web/css`;
const slugRx = /(?<=slug: ).*/;
const pageTypeRx = /(?<=page-type: ).*/;

let total = 0,
  found = 0;
for await (const filePath of Utils.walkSync(contentRoot)) {
  if (filePath.endsWith("index.md")) {
    try {
      total++;
      const content = await fs.readFile(filePath, "utf-8");
      const slug = slugRx.exec(content)[0];
      const name = slug.split("/").pop().toLowerCase();
      const type = pageTypeRx
        .exec(content)[0]
        .replace("css-", "")
        .replace("shorthand-", "");
      let syntax = Utils.getSyntaxForType(name, type);

      if (syntax) {
        found++;
        syntax = {
          name: name,
          type: type,
          ...syntax,
        };

        await fs.writeFile(
          `testing/data/${type}__${name}.json`,
          JSON.stringify(syntax, undefined, "  ")
        );
      }
    } catch (e) {
      console.error(`Error processing ${filePath}: ${e.message}`);
    }
  }
}

console.log(`\n Found ${found}/${total} files.`);

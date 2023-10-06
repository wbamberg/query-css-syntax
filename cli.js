import { getSyntax } from "./query-syntax.js";

const helpMessage =
  "Usage:\n\t" +
  "npm run query-syntax '[feature-name]' '[feature-type]' '[typeToOmit]'...\n\t" +
  "node cli.js '[feature-name]' '[feature-type]' '[typeToOmit]'...\n";

if (process.argv.length < 4) {
  console.error(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(1);
} else if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.info(helpMessage);
  /* eslint-disable-next-line no-process-exit, n/no-process-exit */
  process.exit(0);
}

const syntax = getSyntax(process.argv[2], process.argv[3], [
  ...process.argv.slice(4),
]);

console.log(syntax);

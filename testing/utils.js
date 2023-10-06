/* eslint-disable-next-line n/no-unsupported-features/node-builtins */
import fs from "node:fs/promises";
import path from "node:path";
import { getSyntax } from "../query-syntax.js";

export const typesToOmit = ["<color>", "<gradient>", "<length>"];

export async function* walkSync(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

export function getSyntaxForType(name, type) {
  let syntax;
  switch (type) {
    case "property":
      syntax = getSyntax(name, "property", typesToOmit);
      break;
    case "type":
      // some CSS data type slugs have a `_value` suffix
      if (name.endsWith("_value")) {
        name = name.replace("_value", "");
      }

      syntax = getSyntax(name, "type", typesToOmit);
      break;
    case "function":
      name = `${name}()`;
      syntax = getSyntax(name, "function", typesToOmit);
      break;
    case "at-rule":
      syntax = getSyntax(name, "at-rule", typesToOmit);
      break;
    case "at-rule-descriptor":
      syntax = getSyntax(name, "at-rule-descriptor", typesToOmit);
      break;
  }
  return syntax;
}

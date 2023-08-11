import pkg from "@webref/css";
import { definitionSyntax } from "css-tree";

const parsedWebRef = await pkg.listAll();
let nonNamespacedValues = [];

/**
 * Get names of all the types in a given set of syntaxes
 */
function getTypesForSyntaxes(syntaxes, constituents, typesToOmit) {
  function processNode(node) {
    // Ignore the constituent parts of "typesToOmit" types
    if (typesToOmit.includes(`<${node.name}>`)) {
      return;
    }
    if (node.type === "Type" && !constituents.includes(node.name)) {
      constituents.push(node.name);
    }
  }

  for (const syntax of syntaxes) {
    const ast = definitionSyntax.parse(syntax);
    definitionSyntax.walk(ast, processNode);
  }
}

function initializeValues() {
  if (nonNamespacedValues.length === 0) {
    for (const specName of Object.keys(parsedWebRef)) {
      nonNamespacedValues = nonNamespacedValues.concat(
        parsedWebRef[specName].values
      );
    }
  }
  return nonNamespacedValues;
}

/**
 * Given the syntax for an item (such as a CSS property), this function
 * fetches the syntaxes for all the types that participate in that syntax,
 * either directly or transitively.
 *
 * It takes three arguments:
 * - `itemSyntax`: the syntax for the top-level item.
 * - `namespacedValues`: any values that were namespaced to this item
 * - `typesToOmit`: an array of items that we _don't_ want to find syntax
 * for.
 *
 * It works by using css-tree to parse the original syntax, to look for types
 * included in the syntax definition.
 * Each of these types potentially has its own syntax: if a type does have
 * its own syntax, we use css-tree to parse _that_ syntax, looking for types
 * included in _that_ syntax definition... and so on until we stop finding new
 * syntaxes.
 *
 * The result is an object with one property for each type that has a syntax.
 * The key is the name of the type, and the value is the syntax.
 */
export function getConstituentSyntaxes(
  itemSyntax,
  namespacedValues,
  typesToOmit
) {
  // First make a complete set of values by generating the list of non-namespaced
  // values, and concatenating them with the namespaced vales we were passed.
  // This list should contain all the types which might particpate in this
  // syntax definition.
  let values = initializeValues();
  values = values.concat(namespacedValues);

  const allConstituents = [];
  let oldConstituentsLength = 0;
  // get all the types in the top-level syntax
  let constituentSyntaxes = [itemSyntax];

  // while an iteration added more types...
  // eslint-disable-next-line no-constant-condition
  while (true) {
    oldConstituentsLength = allConstituents.length;
    getTypesForSyntaxes(constituentSyntaxes, allConstituents, typesToOmit);
    if (allConstituents.length <= oldConstituentsLength) {
      break;
    }
    // get the syntaxes for all newly added constituents
    constituentSyntaxes = [];
    for (const constituent of allConstituents.slice(oldConstituentsLength)) {
      const valueName = constituent.endsWith("()")
        ? constituent
        : `<${constituent}>`;
      const valueEntry = values.find((v) => v.name === valueName);
      if (valueEntry && valueEntry.value) {
        constituentSyntaxes.push(valueEntry.value);
      }
    }
  }

  const syntaxes = {};

  for (const constituent of allConstituents) {
    const valueName = constituent.endsWith("()")
      ? constituent
      : `<${constituent}>`;
    const valueEntry = values.find((v) => v.name === valueName);
    if (valueEntry && valueEntry.value) {
      syntaxes[constituent] = valueEntry.value;
    }
  }

  return syntaxes;
}

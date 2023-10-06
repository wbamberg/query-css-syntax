import webref from "@webref/css";

import { definitionSyntax } from "css-tree";

// maps for constructs
const atrules = new Map();
const properties = new Map();
const selectors = new Map();

// maps for value types
const functions = new Map();
const types = new Map();
const values = new Map();
const atRuleDescriptors = new Map();

function isDraftSpec(name) {
  return /-\d+$/.test(name);
}

/**
 * Based on type put a value object (from values array) in corresponding map
 */
function addToValueMap(data) {
  // ignore forwards
  if (data.name === data.value) {
    return;
  }

  const name = data.name.replaceAll(/(^<|>$)/g, "");
  switch (data.type) {
    case "type":
      if (!types.has(name)) types.set(name, data);
      break;
    case "value":
      if (!values.has(name)) values.set(name, data);
      break;
    case "function":
      if (!functions.has(name)) functions.set(name, data);
      break;
    case "selector":
      break;
    default:
      throw new Error(`Unknown type:  ${data.type}`);
  }
}

/**
 * As there is same named descriptors for different at rules,
 * at-rule-descriptor is being represented internally as @rule__descriptor
 */
export function getDescriptorName(atRule, descriptor) {
  if (!atRule.startsWith("@")) {
    throw new Error(
      "Invalid descriptor name: provide at rule name along with the " +
        "descriptor, e.g. '@font-face/font-family'."
    );
  }
  if (descriptor) {
    return `${atRule}__${descriptor}`;
  }
  return atRule.replace("/", "__");
}

/**
 * Extract construct's data, its values, and descriptors
 */
function addToConstructMap(map, list) {
  if (!list) {
    return;
  }

  for (const item of list) {
    if (!map.has(item.name) && item.value) {
      map.set(item.name, item);
    }
    for (const value of item.values || []) {
      addToValueMap(value);
    }
    for (const descriptor of item.descriptors || []) {
      const descriptorName = getDescriptorName(
        descriptor.for || item.name,
        descriptor.name
      );
      if (!atRuleDescriptors.has(descriptorName)) {
        atRuleDescriptors.set(descriptorName, descriptor);
      }
    }
  }
}

function appendPropertyNewValues(list) {
  for (const item of list) {
    const property = properties.get(item.name);
    if (property && item.newValues) {
      property.value += ` | ${item.newValues}`;
    }
  }
}

function extractDataFromSpec(spec) {
  addToConstructMap(properties, spec.properties);
  addToConstructMap(atrules, spec.atrules);
  addToConstructMap(selectors, spec.selectors);

  for (const value of spec.values || []) {
    addToValueMap(value);
    for (const subValue of value.values || []) {
      addToValueMap(subValue);
    }
  }
}

const webRef = await webref.listAll();

// collect data from core specifications first
extractDataFromSpec(webRef["CSS"]);
extractDataFromSpec(webRef["css-syntax"]);
extractDataFromSpec(webRef["css-values"]);

// collect data from current specifications first
const currentSpecs = Object.entries(webRef).filter((s) => !isDraftSpec(s[0]));
for (const [, spec] of currentSpecs) {
  extractDataFromSpec(spec);
}

// collect data from draft specifications
const draftSpecs = Object.entries(webRef).filter((s) => isDraftSpec(s[0]));
for (const [, spec] of draftSpecs) {
  extractDataFromSpec(spec);
}

// append newValues
for (const [, spec] of Object.entries(webRef)) {
  appendPropertyNewValues(spec.properties);
}

/**
 * Get names of all the types in a given set of syntaxes
 */
function getTypesForSyntaxes(syntaxes, typesToOmit, constituents) {
  function processNode(node) {
    // ignore the constituent parts of "typesToLink" types
    if (typesToOmit.includes(`<${node.name}>`)) {
      return;
    }
    if (node.type === "Type" && !constituents.includes(node.name)) {
      constituents.push(node.name);
    }
  }

  for (const syntax of syntaxes) {
    try {
      const ast = definitionSyntax.parse(syntax);
      definitionSyntax.walk(ast, processNode);
    } catch (e) {
      console.log("Error parsing syntax: ", syntax, e);
    }
  }
}

function getValue(name) {
  if (name.includes("()")) {
    return functions.get(name);
  }
  return types.get(name) || values.get(name);
}

/**
 * Given the syntax for an item (such as a CSS property), this function
 * fetches the syntaxes for all the types that participate in that syntax,
 * either directly or transitively.
 *
 * It takes three arguments:
 * - `itemSyntax`: the syntax for the top-level item.
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
export function getConstituentSyntaxes(itemSyntax, typesToOmit) {
  const allConstituents = [];
  let oldConstituentsLength = 0;
  // get all the types in the top-level syntax
  let constituentSyntaxes = [itemSyntax];

  // while an iteration added more types...
  // eslint-disable-next-line no-constant-condition
  while (true) {
    oldConstituentsLength = allConstituents.length;
    getTypesForSyntaxes(constituentSyntaxes, typesToOmit, allConstituents);

    if (allConstituents.length <= oldConstituentsLength) {
      break;
    }
    // get the syntaxes for all newly added constituents,
    // and then get the types in those syntaxes
    constituentSyntaxes = [];
    for (const constituent of allConstituents.slice(oldConstituentsLength)) {
      const constituentSyntaxEntry = getValue(constituent);

      if (constituentSyntaxEntry && constituentSyntaxEntry.value) {
        constituentSyntaxes.push(constituentSyntaxEntry.value);
      } else if (constituentSyntaxEntry && constituentSyntaxEntry.values) {
        constituentSyntaxes.push(
          ...constituentSyntaxEntry.values.map((v) => v.value)
        );
      }
    }
  }

  const syntaxes = [];
  for (const constituent of allConstituents) {
    let valueEntry = getValue(constituent);
    if (!valueEntry) {
      valueEntry = properties.get(constituent);
    }
    if (valueEntry && (valueEntry.value || valueEntry.values)) {
      syntaxes.push({
        type: constituent,
        syntax:
          valueEntry.value ||
          valueEntry.values.map((v) => `<${v.name}>`).join(" | "),
      });
    }
  }

  return syntaxes;
}

/**
 * Return syntax for given feature name and type.
 *
 * @param name Name of a CSS feature
 * @param type Either property, type, function, at-rule, or at-rule-descriptor
 * @param typesToOmit A list of types not to be expanded in the result
 * @returns {{syntax: string, constituents: []}} string syntax and its expanded constituents
 */
export function getSyntax(name, type, typesToOmit) {
  let syntax;

  switch (type) {
    case "property":
      syntax = properties.has(name) ? properties.get(name).value : undefined;
      break;
    case "type":
      if (name.endsWith(">")) {
        name = name.replaceAll(/(^<|>$)/g, "");
      }
      if (types.has(name)) {
        const data = types.get(name);
        if (data.value) {
          syntax = data.value;
        } else if (data.values) {
          syntax = data.values.map((s) => s.name).join(" | ");
        }
      }
      name = `<${name}>`;
      break;
    case "function":
      if (!name.endsWith("()")) {
        name = `${name}()`;
      }
      syntax = functions.has(name) ? functions.get(name).value : undefined;
      name = `<${name}>`;
      break;
    case "at-rule":
      syntax = atrules.has(name) ? atrules.get(name).value : undefined;
      break;
    case "at-rule-descriptor":
      /* eslint-disable-next-line no-case-declarations */
      const descriptorName = getDescriptorName(name);
      syntax = atRuleDescriptors.has(descriptorName)
        ? atRuleDescriptors.get(descriptorName).value
        : undefined;
      break;
    default:
      throw new Error(
        `Unknown type ${type}. Use either property, type, function, at-rule, or at-rule-descriptor.`
      );
  }

  if (!syntax) {
    throw new Error(`Could not find '${name}' in specifications.`);
  }
  const constituents = getConstituentSyntaxes(syntax, typesToOmit);
  return { syntax, constituents };
}

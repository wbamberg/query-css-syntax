import pkg from "@webref/css";
import { definitionSyntax } from "css-tree";

const parsedWebRef = await pkg.listAll();
let nonNamespacedValues = [];

/**
 * Get names of all the types in a given set of syntaxes
 */
function getTypesForSyntaxes(syntaxes, constituents, typesToLink) {
	function processNode(node) {
		// Ignore the constituent parts of "typesToLink" types
		if (typesToLink.includes(`<${node.name}>`)) {
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
 * Given an item (such as a CSS property), fetch all the types that participate
 * in its formal syntax definition, either directly or transitively.
 */
export function getConstituentSyntaxes(
	itemSyntax,
	namespacedValues,
	typesToLink
) {
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
		getTypesForSyntaxes(constituentSyntaxes, allConstituents, typesToLink);
		if (allConstituents.length <= oldConstituentsLength) {
			break;
		}
		// get the syntaxes for all newly added constituents,
		// and then get the types in those syntaxes
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

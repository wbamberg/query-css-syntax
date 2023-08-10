import pkg from "@webref/css";

import { getConstituentSyntaxes } from "./get-constituent-syntaxes.js";

const parsedWebRef = await pkg.listAll();

/**
 * An object whose keys are property names and whose values are an array of all specs
 * that contain this property. Used as a cache so we don't have to terate the spec list every time.
 */
const specsForProp = {};

/**
 * If the spec list contains more than one item, then
 * exclude any specs which have the `-number` suffix.
 */
function filterDuplicateSpecVersions(specNames) {
	if (specNames.length > 0) {
		return specNames.filter((specName) => !/-\d+$/.test(specName));
	}
	return specNames;
}

/**
 *
 * Get all specs that list the named property
 */
function getAllPropertySpecs(propertyName) {
	const specs = specsForProp[propertyName];
	if (specs) {
		return specs;
	}
	// build a cache
	for (const [specName, data] of Object.entries(parsedWebRef)) {
		for (const prop of data.properties) {
			if (!specsForProp[prop.name]) {
				specsForProp[prop.name] = [specName];
			} else {
				specsForProp[prop.name].push(specName);
			}
		}
	}
	return specsForProp[propertyName];
}

/**
 * If we have > 1 spec, assume that:
 *  - one of them is the base spec, which defines `values`,
 *  - the others define incremental additions as `newValues`
 *
 * Concatenate `newValues` onto `values` using `|`.
 */
function buildPropertySyntax(propertyName, specsForProp) {
	let syntax = "";
	let newSyntaxes = "";
	for (const specName of specsForProp) {
		const propertyData = parsedWebRef[specName].properties.filter(
			(p) => p.name === propertyName
		)[0];
		const baseValue = propertyData.value;
		if (baseValue) {
			syntax = baseValue;
		}
		const newValues = propertyData.newValues;
		if (newValues) {
			newSyntaxes += ` | ${newValues}`;
		}
	}
	// Concatenate newValues onto values to return a single syntax string
	if (newSyntaxes) {
		syntax += newSyntaxes;
	}
	return syntax;
}

export function getPropertySyntax(propertyName, typesToLink) {
	const allSpecs = getAllPropertySpecs(propertyName);
	const filteredSpecs = filterDuplicateSpecVersions(allSpecs);
	const propertySyntax = buildPropertySyntax(propertyName, filteredSpecs);
	let namespacedValues = [];
	for (const specName of filteredSpecs) {
		const namespacedValuesForSpec = parsedWebRef[specName].properties.find(
			(p) => p.name === propertyName
		).values;
		namespacedValues = namespacedValues.concat(namespacedValuesForSpec);
	}

	const constituents = getConstituentSyntaxes(
		propertySyntax,
		namespacedValues,
		typesToLink
	);

	return {
		propertySyntax,
		constituents,
	};
}

const typesToLink = ["<color>", "<gradient>"];

const syntax = getPropertySyntax(process.argv[2], typesToLink);

console.log(syntax);

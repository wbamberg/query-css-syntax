import { getPropertySyntax } from "./query-property-syntax.js";

const typesToOmit = [];

const syntax = getPropertySyntax(process.argv[2], typesToOmit);

console.log(syntax);

# query-css-syntax

This package makes it easier to get CSS syntax definitions from the [@webref/css](https://www.npmjs.com/package/@webref/css) package.

The syntax of each CSS property (and other CSS items) is precisely defined using a [value definition syntax](https://drafts.csswg.org/css-values/#value-defs). The [@webref/css](https://www.npmjs.com/package/@webref/css) package includes this information on a per-spec basis. This package uses @webref/css to generate complete syntax for a single CSS item, including all the subtypes that participate in the definition of the item.

## Usage

```js
import { getPropertySyntax } from "query-css-syntax";

const typesToOmit = ["<color>"];
const syntax = getPropertySyntax("border-top", typesToOmit);

console.log(syntax);

/*
{
  syntax: '<line-width> || <line-style> || <color>',
  constituents: [
    {
      type: 'line-width',
      syntax: '<length [0,∞]> | thin | medium | thick'
    },
    {
      type: 'line-style',
      syntax: 'none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset'
    }
  ]
}
*/
```

## API

This package exports one function, `getPropertySyntax()`. This function takes two arguments:

- `propertyName`: the name of a CSS property
- `typesToOmit`: an array listing types for which you don't want the function to find subtypes. For example, the complete definition of `<color>` is very long, so it's usually better to link to a separate definition of it than to include the definition here.

The function returns an object with two properties:

- `syntax`: a string containing the syntax for the property
- `constituents`: an array with one item for each subtype that participates in the property's syntax definition. Each item is an object with the following properties:

  - `type`: a string representing the name of the type
  - `syntax`: a string containing the syntax for the type.

  Items in `constituents` are listed in the order they were encountered when parsing the syntax: this enables clients to present subtypes in a way that might make sense for readers.

## Dependencies

This package uses [@webref/css](https://www.npmjs.com/package/@webref/css) to retrieve syntaxes, and [css-tree](https://www.npmjs.com/package/css-tree) to find types in syntax definitions.

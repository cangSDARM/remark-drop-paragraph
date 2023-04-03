# @allen/remark-drop-paragraph

A [remark](https://remark.js.org) plugin for dropping unnecessary paragraph nodes

The idea behind this plugin: https://github.com/mdx-js/mdx/issues/1170#issuecomment-725622285

## Installation

**Not available yet**

```sh
npm install @allen/remark-drop-paragraph
```

## Options

- `unwrapTags(paragraph's child per each)`<br/>
  If you need to unwrap outer paragraph, use this
  method to iterate through the paragraph's children nodes and unwrap when one returns true<br/>
  default: `['div', 'aside', 'header', 'main', 'figure'].includes(node.type) || isJsxElement(node, true)`
- `noIncludeTags(paragraph's parent)`<br/>
  If you need to drop internal paragraph, use this method
  to iterate through the nodes that may contain paragraph, and drop the paragraph when it returns
  true<br/>
  default: `['mdxBlockElement'].includes(node.type) || isJsxElement(node)`

## Usage

### Source

```ts
const remarkDropParagraph = require('@allen/remark-drop-paragraph');

remark().use(remarkDropParagraph).process(`
<JsxOut>

paragraph1 in

</JsxOut>

paragraph2 out <JsxComponent />
`);
```

### Yields
#### Without this

```html
<JsxOut>
<p>
  paragraph1 in
</p>
</JsxOut>

<p>paragraph2 out <JsxComponent /></p>
```

#### With this

```html
<JsxOut>
paragraph1 in
</JsxOut>

paragraph2 out <JsxComponent />
```

### License

[MIT](LICENSE.md) @ [Allen Lee](https://github.com/cangSDARM)

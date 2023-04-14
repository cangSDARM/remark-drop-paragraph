import { visit, SKIP } from 'unist-util-visit';

import type { Plugin } from 'unified';
import type { Root, Content } from 'mdast';

type Node = Content & { children?: Content };

/**
 * generated from: https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
 * `Array.from(document.querySelectorAll('section[aria-labelledby="list_of_inline_elements"] > div > ul > li a code')).map((v) => v.innerText.replace(/<(.*)>/gi, '$1'))`
 * */
export const inlineElements = [
  'a',
  'abbr',
  'acronym',
  'audio',
  'b',
  'bdi',
  'bdo',
  'big',
  'br',
  'button',
  'canvas',
  'cite',
  'code',
  'data',
  'datalist',
  'del',
  'dfn',
  'em',
  'embed',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'map',
  'mark',
  'meter',
  'noscript',
  'object',
  'output',
  'picture',
  'progress',
  'q',
  'ruby',
  's',
  'samp',
  'script',
  'select',
  'slot',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'template',
  'textarea',
  'time',
  'u',
  'tt',
  'var',
  'video',
  'wbr',
];
/** **some** common block elements */
export const blockElements = ['div', 'aside', 'header', 'image', 'main', 'figure', 'p'];

/**
 *
 * @param noInlineHTML due to: https://github.com/syntax-tree/mdast-util-mdx-jsx mdxElement may contains some plain html element, we may exclude them
 */
export const isJsxElement = (node: Content & { name?: string }, noInlineHTML = false) => {
  const jsx = node.type?.startsWith('mdxJsx');

  if (!noInlineHTML || !node.name) return jsx;

  return !inlineElements.includes(node.name) && jsx;
};

const splice = ([] as Content[]).splice;
const paragraph = 'paragraph';

export const DefaultOption = {
  unwrapTags: (node: Content) =>
    blockElements.includes(node.type || '') || isJsxElement(node, true),
  noIncludeTags: (node: Content) =>
    ['mdxBlockElement'].includes(node.type || '') || isJsxElement(node, false),
};

export type RemarkDropParagraphOption = Partial<typeof DefaultOption>;

// https://github.com/mdx-js/mdx/issues/1170#issuecomment-725622285
const remarkDropParagraph: Plugin<[RemarkDropParagraphOption?], Root> = (options) => {
  const { unwrapTags = () => false, noIncludeTags = () => false } = Object.assign(
    {},
    DefaultOption,
    options,
  );

  const isNeedCleanInnerParagraph = (node: Content) => {
    return noIncludeTags(node);
  };

  const isNeedCleanOuterParagraph = (node: Content) => {
    return unwrapTags(node);
  };

  const travelChildren = (nodes: Content[]) => {
    let paragraphChildren: Content[] = [];
    const wrap = () =>
      ({
        type: 'paragraph',
        children: paragraphChildren,
        position: paragraphChildren[0]?.position,
      } as Content);

    let needClean = false;

    return {
      children: nodes.reduce((acc, cur, idx) => {
        if (isNeedCleanOuterParagraph(cur)) {
          needClean = true;
          const ret = [...acc, wrap(), cur];
          paragraphChildren = [];

          return ret;
        } else {
          paragraphChildren.push(cur);

          if (idx >= nodes.length - 1 && paragraphChildren.length > 0) {
            return [...acc, wrap()];
          } else {
            return acc;
          }
        }
      }, [] as Content[]),
      needClean,
    };
  };

  function visitor(node: Node, index: number | null, parent: Node | undefined) {
    // if there are children available keep diving into them
    if (Array.isArray(node.children)) {
      node.children.forEach(function (child) {
        visit(child, visitor as any);
      });
    }

    const isParagraph = node.type === paragraph;

    if (isParagraph && parent && typeof index === 'number') {
      if (isNeedCleanInnerParagraph(parent)) {
        splice.apply(parent.children, [index, 1, ...(node.children || [])]);

        return [SKIP, index];
      }

      const { needClean, children } = travelChildren(node.children || []);
      if (needClean) {
        splice.apply(parent.children, [index, 1, ...children]);

        return [SKIP, index];
      }
    }
  }

  return (root: Root) => {
    visit(root, visitor as any);
  };
};

export default remarkDropParagraph;

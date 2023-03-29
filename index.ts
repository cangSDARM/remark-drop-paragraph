import { visit, SKIP } from 'unist-util-visit';

import type { Plugin } from 'unified';
import type { Root, Content } from 'mdast';

type Node = Content & { children?: Content };

const isJsxElement = (node: Content) => node.type?.startsWith('mdxJsx');

const splice = ([] as Content[]).splice;
const some = ([] as any[]).some;
const paragraph = 'paragraph';

export const DefaultOption = {
  unwrapTags: (node: Content) =>
    ['div', 'aside', 'header', 'main', 'figure'].includes(node.type || '') || isJsxElement(node),
  noIncludeTags: (node: Content) =>
    ['mdxBlockElement'].includes(node.type || '') || isJsxElement(node),
};

export type RemarkDropParagraphOption = Partial<typeof DefaultOption>;

// https://github.com/mdx-js/mdx/issues/1170#issuecomment-725622285
const remarkDropParagraph: Plugin<[RemarkDropParagraphOption?], Root> = (
  options = DefaultOption,
) => {
  const { unwrapTags = () => false, noIncludeTags = () => false } = options || {};

  const isNeedCleanInnerParagraph = (node: Content) => {
    return noIncludeTags(node);
  };

  const isNeedCleanOuterParagraph = (nodes: Content[]) => {
    // not all inline
    return some.apply(nodes, [
      (child) => {
        return unwrapTags(child);
      },
    ]);
  };

  function visitor(node: Node, index: number | null, parent: Node | undefined) {
    // if there are children available keep diving into them
    if (Array.isArray(node.children)) {
      node.children.forEach(function (child) {
        visit(child, visitor as any);
      });
    }

    const isParagraph = node.type === paragraph;

    if (parent && typeof index === 'number' && isParagraph) {
      if (isNeedCleanInnerParagraph(parent) || isNeedCleanOuterParagraph(node.children || [])) {
        splice.apply(parent.children, [index, 1, ...(node.children || [])]);

        return [SKIP, index];
      }
    }
  }

  return (root: Root) => {
    visit(root, visitor as any);
  };
};

export default remarkDropParagraph;

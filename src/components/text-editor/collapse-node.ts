import { mergeAttributes, Node } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { PluginKey } from '@tiptap/pm/state';
import { config } from '../../config/config';

export interface CollapseAttributes {
  'deleted-text': string;
  class: string;
  id: string;
}

export type CollapsedOptions = {
  HTMLAttributes: CollapseAttributes;
  renderLabel: (props: {
    options: CollapsedOptions;
    node: ProseMirrorNode;
  }) => string;
};

export const CollapsePluginKey = new PluginKey('collapse');

export const Collapse = Node.create<CollapsedOptions>({
  name: 'collapse',

  addOptions() {
    return {
      HTMLAttributes: { 'deleted-text': '', class: 'collapse-item', id: '' },
      renderLabel({ options, node }) {
        const deletedText = node.attrs['deleted-text'] as string;
        if (deletedText.length <= 2) {
          return deletedText;
        } else {
          return `${deletedText.slice(0, 1)}...`;
        }
      }
    };
  },

  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      'deleted-text': {
        default: null,
        parseHTML: element => element.getAttribute('deleted-text'),
        renderHTML: (attributes: CollapseAttributes) => {
          return {
            class: attributes.class,
            'deleted-text': attributes['deleted-text']
          };
        }
      },
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: (attributes: CollapseAttributes) => {
          return {
            class: attributes.class,
            id: attributes['id']
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
        { style: `background-color: ${config.customColors.deletedColor};` }
      ),
      this.options.renderLabel({
        options: this.options,
        node
      })
    ];
  },

  renderText({ node }) {
    return '';
  },

  addKeyboardShortcuts() {
    return {};
  }
});

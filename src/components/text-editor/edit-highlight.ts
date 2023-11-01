import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes
} from '@tiptap/core';

export interface EditHighlightAttributes {
  color: string;
  oldText: string;
  id: string;
}

export interface HighlightOptions {
  multicolor: boolean;
  HTMLAttributes: EditHighlightAttributes;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      /**
       * Set a highlight mark
       */
      setHighlight: (attributes?: { color: string }) => ReturnType;
      /**
       * Toggle a highlight mark
       */
      toggleHighlight: (attributes?: { color: string }) => ReturnType;
      /**
       * Unset a highlight mark
       */
      unsetHighlight: () => ReturnType;
    };
  }
}

export const inputRegex = /(?:^|\s)((?:==)((?:[^~=]+))(?:==))$/;
export const pasteRegex = /(?:^|\s)((?:==)((?:[^~=]+))(?:==))/g;

export const EditHighlight = Mark.create<HighlightOptions>({
  name: 'edit-highlight',

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {
        color: '',
        oldText: '',
        id: ''
      }
    };
  },

  addAttributes() {
    if (!this.options.multicolor) {
      return {};
    }

    return {
      color: {
        default: null,
        parseHTML: element =>
          element.getAttribute('data-color') || element.style.backgroundColor,
        renderHTML: attributes => {
          return {
            'data-color': attributes.color as string,
            style: `background-color: ${attributes.color}; color: inherit;`
          };
        }
      },
      oldText: {
        default: '',
        parseHTML: element => element.getAttribute('data-old-text'),
        renderHTML: attributes => {
          return {
            'data-old-text': attributes.oldText as string
          };
        }
      },
      id: {
        default: '',
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          return {
            id: attributes.id as string
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      setHighlight:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleHighlight:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight()
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type
      })
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type
      })
    ];
  }
});

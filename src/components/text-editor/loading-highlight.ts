import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes
} from '@tiptap/core';

export interface LoadingHighlightAttributes {}

export interface HighlightOptions {
  HTMLAttributes: LoadingHighlightAttributes;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    loadingHighlight: {
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

export const LoadingHighlight = Mark.create<HighlightOptions>({
  name: 'loading-highlight',

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {};
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
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'loading-highlight'
      }),
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
    return {};
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

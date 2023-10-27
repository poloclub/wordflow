import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Editor } from '@tiptap/core';
import Text from '@tiptap/extension-text';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { diffWords } from 'diff';

import { diff_wordMode_ } from './text-diff';
import { config } from '../../config/config';

import componentCSS from './text-editor.css?inline';
import { style } from '../../../node_modules/@tiptap/core/src/style';

const OLD_TEXT =
  'To develop and deploy trustworthy AI systems that benefit everyone, there is an urgent need to have the capability to thoroughly vet and rectify AI models.';
// const NEW_TEXT =
//   'To develop and deploy trustworthy AI systems that benefit everyone, we urgently need the capability to thoroughly vet AI models. This is cool.';
const NEW_TEXT =
  'To develop and deploy trustworthy AI systems that benefit everyone, we urgently need the capability to thoroughly vet and rectify AI models. This is cool.';

const DELETED_COLOR = config.colors['red-100'];
const ADDED_COLOR = config.colors['blue-100'];

/**
 * Text editor element.
 *
 */
@customElement('promptlet-text-editor')
export class PromptLetTextEditor extends LitElement {
  // ===== Class properties ======
  editor: Editor | null = null;

  @query('.text-editor')
  editorElement: HTMLElement | undefined;

  initialText = OLD_TEXT;

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    const result = diff_wordMode_(OLD_TEXT, NEW_TEXT);
    console.log(result);
  }

  firstUpdated() {
    this.initEditor();
  }

  initEditor() {
    if (this.editorElement === undefined) {
      console.error('Text editor element is not added to DOM yet!');
      return;
    }

    // Register keyboard shortcuts
    const myText = Text.extend({
      addKeyboardShortcuts() {
        return {};
      }
    });

    // Customize the starterkit extension to exclude customized extensions
    const myStarterKit = StarterKit.configure({
      text: false
    });

    const myHighlight = Highlight.configure({
      multicolor: true
    });

    const defaultText = `<p>${this.initialText}</p>`;

    this.editor = new Editor({
      element: this.editorElement,
      extensions: [myStarterKit, myText, myHighlight],
      content: `
        ${defaultText}
      `,
      autofocus: true
    });
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  async initData() {}

  diffParagraph(oldText: string, newText: string) {
    const differences = diffWords(oldText, newText);
    return differences;
  }

  // ===== Event Methods ======
  highlightButtonClicked(e: MouseEvent) {
    e.preventDefault();
    if (this.editor === null) {
      console.error('Editor is not initialized yet.');
      return;
    }

    this.editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run();
    console.log('clicked');
  }

  dehighlightButtonClicked(e: MouseEvent) {
    e.preventDefault();
    if (this.editor === null) {
      console.error('Editor is not initialized yet.');
      return;
    }

    this.editor
      .chain()
      .focus()
      .unsetMark('highlight', { extendEmptyMarkRange: true })
      .run();
  }

  improveButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (this.editor === null) {
      console.warn('Editor is not initialized');
      return;
    }

    // Get the word-level differences
    const oldText = this.editor.getText();
    const newText = NEW_TEXT;
    // const differences = this.diffParagraph(oldText, newText);
    const differences = diff_wordMode_(oldText, newText);

    // Organize the text to highlight the new text and keep track of their
    // old text
    // Case 1: delete old, add new => show add
    // Case 2: delete old => show icon
    // Case 3: add new => show new
    // Note that diff-match-patch use -1, 0, 1 to encode delete, no change, and add.
    // We can add these numbers to distinguish the three cases above.
    console.log(differences);
    let diffText = '';
    let lastDeletedText = '';
    const replaceMap = new Map<string, string>();

    for (const [i, diff] of differences.entries()) {
      switch (diff[0]) {
        case 0: {
          // No change
          diffText += diff[1];
          break;
        }

        case -1: {
          // Deleted
          lastDeletedText = diff[1];

          // Case 2: delete old => show icon
          // Check if the deleted text is not replaced by new text
          if (i + 1 >= differences.length || differences[i + 1][0] === 0) {
            diffText += `<mark data-color="${DELETED_COLOR}">DEL</mark> `;
          }
          break;
        }

        case 1: {
          // Added
          diffText += `<mark data-color="${ADDED_COLOR}">${diff[1]}</mark> `;

          // Case 1: delete old, add new => show add
          // Also record the original old text
          if (i >= 1 && differences[i - 1][0] === -1) {
            replaceMap.set(diff[1], lastDeletedText);
            lastDeletedText = '';
          }

          // Case 3: add new => show new
          // Add empty string as the old text
          if (i >= 1 && differences[i - 1][0] === 0) {
            replaceMap.set(diff[1], '');
            lastDeletedText = '';
          }

          break;
        }

        default: {
          console.error('Unknown diff code', diff);
        }
      }
    }
    diffText = `<p>${diffText}</p>`;
    this.editor.commands.setContent(diffText);
  }

  // ===== Templates and Styles ======
  render() {
    return html` <div class="text-editor-container">
      <div class="text-editor" style="white-space: break-spaces;"></div>
      <div class="control-panel">
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.highlightButtonClicked(e)}
        >
          Highlight
        </button>
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.dehighlightButtonClicked(e)}
        >
          Dehighlight
        </button>
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.improveButtonClicked(e)}
        >
          Improve
        </button>
      </div>
    </div>`;
  }

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
      ${unsafeCSS(style)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'promptlet-text-editor': PromptLetTextEditor;
  }
}

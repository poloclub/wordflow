import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Editor } from '@tiptap/core';
import Text from '@tiptap/extension-text';
import StarterKit from '@tiptap/starter-kit';
import { EditHighlight } from './edit-highlight';
import { Collapse } from './collapse-node';
import { SidebarMenu } from './sidebar-menu-plugin';

import { diff_wordMode_ } from './text-diff';
import { config } from '../../config/config';

// Types
import type { EditHighlightAttributes } from './edit-highlight';
import type { PopperOptions } from './sidebar-menu-plugin';

// CSS
import componentCSS from './text-editor.css?inline';
import { style } from '../../../node_modules/@tiptap/core/src/style';

const OLD_TEXT =
  'To develop and deploy trustworthy AI systems that benefit everyone, there is an urgent need to have the capability to thoroughly vet and rectify AI models.';
// const NEW_TEXT =
//   'To develop and deploy trustworthy AI systems that benefit everyone, we urgently need the capability to thoroughly vet AI models. This is cool.';
const NEW_TEXT =
  'To develop deploy trustworthy AI systems that benefit everyone, we urgently need the capability to thoroughly vet and rectify AI models. This is very cool and super awesome.';

const ADDED_COLOR = config.customColors.addedColor;
const REPLACED_COLOR = config.customColors.replacedColor;

/**
 * Text editor element.
 *
 */
@customElement('promptlet-text-editor')
export class PromptLetTextEditor extends LitElement {
  // ===== Class properties ======
  @property({ attribute: false })
  popperSidebarBox: Promise<HTMLElement> | undefined;

  @query('.text-editor-container')
  containerElement: HTMLElement | undefined;

  @query('.text-editor')
  editorElement: HTMLElement | undefined;

  @query('.select-menu')
  selectMenuElement: HTMLElement | undefined;

  editor: Editor | null = null;
  initialText = OLD_TEXT;
  curEditID = 0;

  containerBBox: DOMRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bottom: 0,
    left: 0,
    top: 0,
    right: 0,
    toJSON: () => ''
  };

  // ===== Lifecycle Methods ======
  constructor() {
    super();
  }

  firstUpdated() {
    this.initEditor();

    setTimeout(() => {
      const e = new Event('click') as MouseEvent;
      this.improveButtonClicked(e);
    }, 1000);
  }

  initEditor() {
    if (
      this.editorElement === undefined ||
      this.selectMenuElement === undefined ||
      this.containerElement === undefined ||
      this.popperSidebarBox === undefined
    ) {
      console.error(
        'Text editor / select menu element is not added to DOM yet!'
      );
      return;
    }

    // Store the x position of th left and right border of the container element
    this.containerBBox = this.containerElement.getBoundingClientRect();

    // Register keyboard shortcuts
    const myText = Text.extend({
      addKeyboardShortcuts() {
        return {};
      }
    });

    // Customize the StarterKit extension to exclude customized extensions
    const myStarterKit = StarterKit.configure({
      text: false
    });

    const myEditHighlight = EditHighlight.configure({
      multicolor: true
    });

    const popperOptions: PopperOptions = {
      popperSidebarBox: this.popperSidebarBox,
      containerBBox: this.containerBBox
    };
    const mySidebarMenu = SidebarMenu.configure({
      popperOptions
    });

    const defaultText = `<p>${this.initialText}</p>`;

    this.editor = new Editor({
      element: this.editorElement,
      extensions: [
        myStarterKit,
        myText,
        myEditHighlight,
        Collapse,
        mySidebarMenu
      ],
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

  diffParagraph(oldText: string, newText: string) {}

  // ===== Event Methods ======
  highlightButtonClicked(e: MouseEvent) {
    e.preventDefault();
    if (this.editor === null) {
      console.error('Editor is not initialized yet.');
      return;
    }

    this.editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run();
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
      .unsetMark('edit-highlight', { extendEmptyMarkRange: true })
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
            diffText += `<span
              id="collapse-${this.curEditID++}"
              data-type="collapse"
              deleted-text="${diff[1]}"
            ></span>`;
          }
          break;
        }

        case 1: {
          // Added

          // Case 1: delete old, add new => show add
          // Also record the original old text
          if (i >= 1 && differences[i - 1][0] === -1) {
            diffText += `<mark
              id="edit-highlight-${this.curEditID++}"
              data-color="${REPLACED_COLOR}"
              data-origin="${lastDeletedText}"
            >${diff[1]}</mark>`;
            replaceMap.set(diff[1], lastDeletedText);
            lastDeletedText = '';
          }

          // Case 3: add new => show new
          // Add empty string as the old text
          if (i >= 1 && differences[i - 1][0] === 0) {
            diffText += `<mark
              id="edit-highlight-${this.curEditID++}"
              data-color="${ADDED_COLOR}"
              data-origin="${lastDeletedText}"
            >${diff[1]}</mark>`;
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

    // If the paragraph ends with a mark element, add a trailing space to exit
    // the mark
    if (diffText.slice(-7) === '</mark>') {
      // diffText += '&nbsp;';
    }
    diffText = `<p>${diffText}</p>`;
    this.editor.commands.setContent(diffText);
  }

  selectButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (this.editor === null) {
      console.error('Editor is not initialized yet.');
      return;
    }

    if (this.editor.isActive('edit-highlight')) {
      const attributes = this.editor.getAttributes(
        'edit-highlight'
      ) as EditHighlightAttributes;
    }
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
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.selectButtonClicked(e)}
        >
          Select
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

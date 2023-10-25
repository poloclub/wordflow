import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Editor } from '@tiptap/core';
import Text from '@tiptap/extension-text';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';

import componentCSS from './text-editor.css?inline';

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

  // ===== Lifecycle Methods ======
  constructor() {
    super();
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

    const defaultText =
      '<p>To develop and deploy trustworthy AI systems that benefit everyone, there is an urgent need to have the capability to thoroughly vet and rectify AI models. First, we need to explain what AI models have learned and how they make predictions. After gaining an understanding of these models and their potential impacts, it is essential to ensure that they have acquired the correct knowledge and that their behaviors align with human values. As these solutions to AI explainability and human agency emerge, ensuring their accessibility and ease of adoption by AI developers is of paramount importance. After all, responsible AI techniques are valuable only when AI developers actively embrace them.</p>';

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
  initData = async () => {};

  // ===== Event Methods ======
  highlightClicked(e: MouseEvent) {
    e.preventDefault();
    if (this.editor === null) {
      console.error('Editor is not initialized yet.');
      return;
    }

    this.editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run();
    console.log('clicked');
  }

  dehighlightClicked(e: MouseEvent) {
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

  // ===== Templates and Styles ======
  render() {
    return html` <div class="text-editor-container">
      <div class="text-editor"></div>
      <div class="control-panel">
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.highlightClicked(e)}
        >
          Highlight
        </button>
        <button
          class="control-button"
          @click=${(e: MouseEvent) => this.dehighlightClicked(e)}
        >
          Dehighlight
        </button>
      </div>
    </div>`;
  }

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'promptlet-text-editor': PromptLetTextEditor;
  }
}

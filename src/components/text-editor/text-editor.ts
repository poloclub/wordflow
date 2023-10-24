import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

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

    this.editor = new Editor({
      element: this.editorElement,
      extensions: [StarterKit],
      content: '<p>Hello! Jay here.</p>',
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

  // ===== Templates and Styles ======
  render() {
    return html` <div class="text-editor"></div> `;
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

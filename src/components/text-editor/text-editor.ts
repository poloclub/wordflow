import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Editor } from '@tiptap/core';
import Text from '@tiptap/extension-text';
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

    this.editorElement.addEventListener('keydown', (e: KeyboardEvent) => {
      e.preventDefault();
    });

    // Register keyboard shortcuts
    const myText = Text.extend({
      addKeyboardShortcuts() {
        return {
          // // cmd + -> | Move to the end of the line
          // 'Mod-ArrowRight': () => {
          //   return this.editor.chain().selectTextblockEnd().run();
          // },
          // // cmd + <- | Move to the start of the line
          // 'Mod-ArrowLeft': () => {
          //   return this.editor.chain().selectTextblockStart().run();
          // }
        };
      }
    });

    // Customize the starterkit extension to exclude customized extensions
    const myStarterKit = StarterKit.configure({
      text: false
    });

    this.editor = new Editor({
      element: this.editorElement,
      extensions: [myStarterKit, myText],
      content: `
            <h2>
              Hi there,
            </h2>
            <p>
              this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
            </p>
            <ul>
              <li>
                That’s a bullet list with one …
              </li>
              <li>
                … or two list items.
              </li>
            </ul>
            <p>
              Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
            </p>
            <pre><code class="language-css">body {
        display: none;
      }</code></pre>
            <p>
              I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
            </p>
            <blockquote>
              Wow, that’s amazing. Good work, boy! 👏
              <br />
              — Mom
            </blockquote>
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

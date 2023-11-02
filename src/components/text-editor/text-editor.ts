import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { diff_wordMode_ } from './text-diff';
import { config } from '../../config/config';
import { textGenGpt } from '../../llms/gpt';
import '../modal-auth/modal-auth';
import DiffMatchPatch from 'diff-match-patch';

// Editor
import { Editor } from '@tiptap/core';
import Text from '@tiptap/extension-text';
import StarterKit from '@tiptap/starter-kit';
import { EditHighlight } from './edit-highlight';
import { Collapse } from './collapse-node';
import { SidebarMenu } from './sidebar-menu-plugin';
import { TextSelection } from '@tiptap/pm/state';

// Types
import type { SimpleEventMessage, PromptModel } from '../../types/common-types';
import type { EditHighlightAttributes } from './edit-highlight';
import type { CollapseAttributes } from './collapse-node';
import type { PopperOptions } from './sidebar-menu-plugin';
import type { TextGenMessage } from '../../llms/gpt';

// CSS
import componentCSS from './text-editor.css?inline';
import { style } from '../../../node_modules/@tiptap/core/src/style';

// Assets
import promptMLJSON from '../../prompts/prompt-ml-academic.json';
const promptML = promptMLJSON as PromptModel;

const OLD_TEXT =
  "Given thousands of equally accurate machine learning (ML) models, how can users choose among them? A recent ML technique enables domain experts and data scientists to generate a complete Rashomon set for sparse decision trees--a huge set of almost-optimal interpretable ML models. To help ML practitioners identify models with desirable properties from this Rashomon set, we develop TimberTrek, the first interactive visualization system that summarizes thousands of sparse decision trees at scale. Two usage scenarios highlight how TimberTrek can empower users to easily explore, compare, and curate models that align with their domain knowledge and values. Our open-source tool runs directly in users' computational notebooks and web browsers, lowering the barrier to creating more responsible ML models. TimberTrek is available at the following public demo link.";

// const NEW_TEXT =
// "Given thousands of equally accurate machine learning (ML) models, how can users choose among them? A recent ML technique help domain experts and data scientists generate a complete Rashomon set for sparse decision trees--a huge set of almost-optimal intelligible ML models. To help ML practitioners identify models with desirable properties, we develop TimberTrek, the first interactive visualization system that summarizes thousands of sparse decision trees at scale. Two usage scenarios highlight how TimberTrek can empower users to easily explore, compare, and curate models that align with their domain knowledge and values. Our open-source tool runs directly in users' computational notebooks and web browsers, lowering the barrier to creating more responsible ML models. TimberTrek is available at the following public demo link. This is very cool!";

const NEW_TEXT =
  "Given thousands of equally accurate machine learning (ML) models, how can users choose among them? A recent ML technique enables domain experts and data scientists to generate a complete Rashomon set for sparse decision trees—a vast collection of nearly optimal interpretable ML models. To assist ML practitioners in identifying models with desirable properties from this Rashomon set, we have developed TimberTrek, the first interactive visualization system that provides a summary of thousands of sparse decision trees on a large scale. Two usage scenarios demonstrate how TimberTrek empowers users to easily explore, compare, and curate models that align with their domain knowledge and values. Our open-source tool runs directly in users' computational notebooks and web browsers, thereby reducing the barrier to creating more responsible ML models. TimberTrek can be accessed through the following public demo link.";

const ADDED_COLOR = config.customColors.addedColor;
const REPLACED_COLOR = config.customColors.replacedColor;

const DMP = new DiffMatchPatch();

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
  apiKey: string | null = null;

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

    const model = 'gpt';
    this.apiKey = localStorage.getItem(`${model}APIKey`);
  }

  firstUpdated() {
    this.initEditor();

    setTimeout(() => {
      const e = new Event('click') as MouseEvent;
      this.improveButtonClicked(e);
    }, 300);
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

  diffParagraph(oldText: string, newText: string) {
    // const differences = diff_wordMode_(oldText, newText);
    const differences = DMP.diff_main(oldText, newText);
    DMP.diff_cleanupSemantic(differences);

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
          lastDeletedText = '';
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
              data-old-text="${lastDeletedText}"
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
              data-old-text="${lastDeletedText}"
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
      diffText += '&nbsp;';
    }

    return diffText;
  }

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
      console.error('Editor is not initialized');
      return;
    }

    // Get the word-level differences
    const oldText = this.editor.getText();

    const curPrompt = promptML.prompt.replace('{{text}}', oldText);
    textGenGpt(this.apiKey!, 'text-gen', curPrompt, 0.2).then(message => {
      switch (message.command) {
        case 'finishTextGen': {
          if (this.editor === null) {
            console.error('Editor is not initialized');
            return;
          }

          const newText = parseTags(message.payload.result, 'output')[0];
          let diffText = this.diffParagraph(oldText, newText);
          diffText = `<p>${diffText}</p>`;

          this.editor.commands.setContent(diffText);
          break;
        }

        case 'error': {
          console.error('Failed to generate text', message.payload);
        }
      }
    });
  }

  changeButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (this.editor === null) {
      console.warn('Editor is not initialized');
      return;
    }

    // Get the word-level differences
    const oldText = this.editor.getText();
    const newText = NEW_TEXT;
    let diffText = this.diffParagraph(oldText, newText);
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

  sidebarFooterButtonClickedHandler(e: CustomEvent<string>) {
    switch (e.detail) {
      case 'accept': {
        this.acceptChange();
        break;
      }

      case 'reject': {
        this.rejectChange();
        break;
      }

      default: {
        console.error('Unknown button clicked:', e.detail);
      }
    }
  }

  /**
   * Accept the current active edit (replace, add, or delete)
   */
  acceptChange() {
    if (this.editor === null) {
      throw Error('Editor is not fully initialized');
    }

    const view = this.editor.view;
    const state = view.state;
    const selection = state.selection;
    const { $from } = selection;

    const isActive = this._isEditActive();
    if (!isActive) {
      return;
    }

    // To accept the change, we only need to remove the mark or the node
    if (this.editor.isActive('edit-highlight')) {
      this.editor
        .chain()
        .focus()
        .unsetMark('edit-highlight', { extendEmptyMarkRange: true })
        .run();
    } else if (this.editor.isActive('collapse')) {
      // Move the cursor
      const newSelection = TextSelection.create(state.doc, $from.pos);
      const tr = state.tr;
      tr.setSelection(newSelection);
      // Remove the node
      tr.delete($from.pos, $from.pos + 1);
      view.dispatch(tr);
      view.focus();
    }
  }

  /**
   * Reject the current active edit (replace, add, or delete)
   */
  rejectChange() {
    if (this.editor === null) {
      throw Error('Editor is not fully initialized');
    }

    const view = this.editor.view;
    const state = view.state;
    const { selection, schema } = state;
    const { $from } = selection;

    const isActive = this._isEditActive();
    if (!isActive) {
      return;
    }

    // To reject a change, we need to replace the new content with old text
    if (this.editor.isActive('edit-highlight')) {
      const mark = $from.marks()[0];
      const markAttribute = mark.attrs as EditHighlightAttributes;
      // Find the range of the mark
      let from = -1;
      let to = -1;
      state.doc.content.descendants((node, pos) => {
        if (
          node.marks.some(
            m => (m.attrs as EditHighlightAttributes).id === markAttribute.id
          )
        ) {
          from = pos;
          to = pos + node.nodeSize;
          return false;
        }
      });

      // Replace the text content in the highlight with the old text
      const tr = state.tr;
      const newText = schema.text(markAttribute.oldText);
      const newSelection = TextSelection.create(
        state.doc,
        from + newText.nodeSize
      );
      // Need to set the selection before replacing the text
      tr.setSelection(newSelection);
      tr.replaceWith(from, to, newText);
      view.dispatch(tr);
      view.focus();
    } else if (this.editor.isActive('collapse')) {
      // Remove the node
      const node = $from.nodeAfter!;
      const nodeAttrs = node.attrs as CollapseAttributes;

      // Move the cursor
      const newSelection = TextSelection.create(state.doc, $from.pos);
      const tr = state.tr;
      tr.setSelection(newSelection);

      // Remove the node
      tr.delete($from.pos, $from.pos + 1);

      // Add new text node
      const newText = schema.text(nodeAttrs['deleted-text']);
      tr.insert($from.pos, newText);
      view.dispatch(tr);
      view.focus();
    }
  }

  /**
   * Helper method to check if the user has selected an edit
   * @returns True if an edit is actively selected
   */
  _isEditActive() {
    if (this.editor === null) {
      throw Error('Editor is not fully initialized');
    }

    const view = this.editor.view;
    const selection = view.state.selection;
    const { $from } = selection;

    let isActive = false;
    if (this.editor.isActive('edit-highlight')) {
      if ($from.marks().length > 0) {
        isActive = true;
      }
    } else if (this.editor.isActive('collapse')) {
      if ($from.nodeAfter !== null) {
        isActive = true;
      }
    }

    return isActive;
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
          @click=${(e: MouseEvent) => this.changeButtonClicked(e)}
        >
          Change
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

/**
 * Parse content inside an XML tag
 * @param text LLM response text
 * @param tag XML tag to parse
 * @returns A list of content in the parsed tags
 */
export const parseTags = (text: string, tag: string) => {
  const regex = new RegExp(`<${tag}>\\s*(.*)\\s*</${tag}>`, 'g');
  const matches = text.match(regex) || [];
  return matches.map(match => match.replace(regex, '$1'));
};

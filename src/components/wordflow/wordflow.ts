import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { PromptLetTextEditor } from '../text-editor/text-editor';

import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import componentCSS from './wordflow.css?inline';

/**
 * Wordflow element.
 *
 */
@customElement('promptlet-wordflow')
export class PromptLetWordflow extends LitElement {
  // ===== Class properties ======
  @queryAsync('#popper-sidebar-box')
  popperSidebarBox: Promise<HTMLElement> | undefined;

  @query('promptlet-text-editor')
  textEditorElement: PromptLetTextEditor | undefined;

  // @state()
  // rightPopperBox: HTMLElement | undefined;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
  }

  firstUpdated() {}

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  initData = async () => {};

  // ===== Event Methods ======
  sidebarMenuFooterButtonClickedHandler(e: CustomEvent<string>) {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.sidebarFooterButtonClickedHandler(e);
  }

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="wordflow">
        <div class="left-panel"></div>
        <div class="center-panel">
          <div class="editor-content">
            <promptlet-text-editor
              .popperSidebarBox=${this.popperSidebarBox}
            ></promptlet-text-editor>
          </div>
        </div>
        <div class="right-panel"></div>

        <div class="popper-box hidden" id="popper-sidebar-box">
          <promptlet-sidebar-menu
            id="right-sidebar-menu"
            @footer-button-clicked=${(e: CustomEvent<string>) =>
              this.sidebarMenuFooterButtonClickedHandler(e)}
          ></promptlet-sidebar-menu>
        </div>
      </div>
    `;
  }

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'promptlet-wordflow': PromptLetWordflow;
  }
}

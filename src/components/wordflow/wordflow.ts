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

// Types
import type { SimpleEventMessage, PromptModel } from '../../types/common-types';
import type { Promptlet } from '../../types/promptlet';

// Components
import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import '../floating-menu/floating-menu';

// Assets
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

  @queryAsync('#floating-menu-box')
  floatingMenuBox: Promise<HTMLElement> | undefined;

  @queryAsync('#popper-tooltip')
  popperTooltip: Promise<HTMLElement> | undefined;

  @query('promptlet-text-editor')
  textEditorElement: PromptLetTextEditor | undefined;

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
    this.textEditorElement.sidebarMenuFooterButtonClickedHandler(e);
  }

  floatingMenuToolMouseEnterHandler() {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolsMouseEnterHandler();
  }

  floatingMenuToolsMouseLeaveHandler() {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolsMouseLeaveHandler();
  }

  floatingMenuToolButtonClickHandler(e: CustomEvent<Promptlet>) {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolButtonClickHandler(e.detail);
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
              .floatingMenuBox=${this.floatingMenuBox}
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

        <promptlet-modal-auth
          class="modal"
          @api-key-added=${(e: CustomEvent<SimpleEventMessage>) => {}}
        ></promptlet-modal-auth>

        <div class="floating-menu-box hidden" id="floating-menu-box">
          <promptlet-floating-menu
            .popperTooltip=${this.popperTooltip}
            @mouse-enter-tools=${() => this.floatingMenuToolMouseEnterHandler()}
            @mouse-leave-tools=${() =>
              this.floatingMenuToolsMouseLeaveHandler()}
            @tool-button-clicked=${(e: CustomEvent<Promptlet>) =>
              this.floatingMenuToolButtonClickHandler(e)}
          ></promptlet-floating-menu>
        </div>

        <div id="popper-tooltip" class="popper-tooltip hidden" role="tooltip">
          <span class="popper-content"></span>
          <div class="popper-arrow"></div>
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

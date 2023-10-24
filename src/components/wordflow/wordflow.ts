import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '../text-editor/text-editor';
import componentCSS from './wordflow.css?inline';

/**
 * Wordflow element.
 *
 */
@customElement('promptlet-wordflow')
export class PromptLetWordflow extends LitElement {
  // ===== Class properties ======

  // ===== Lifecycle Methods ======
  constructor() {
    super();
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
    return html`
      <div class="wordflow">
        <div class="left-panel"></div>
        <div class="center-panel">
          <div class="editor-content">
            <promptlet-text-editor></promptlet-text-editor>
          </div>
        </div>
        <div class="right-panel"></div>
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

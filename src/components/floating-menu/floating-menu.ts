import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './floating-menu.css?inline';

import gearIcon from '../../images/icon-gear.svg?raw';

/**
 * Floating menu element.
 *
 */
@customElement('promptlet-floating-menu')
export class PromptLetFloatingMenu extends LitElement {
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
  async initData() {}

  // ===== Event Methods ======

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="floating-menu">
        <button class="tool-button">
          <div class="svg-icon">🎓</div>
        </button>
        <button class="tool-button">
          <div class="svg-icon">🍔</div>
        </button>
        <button class="tool-button">
          <div class="svg-icon">😘</div>
        </button>
        <button class="tool-button">
          <div class="svg-icon">${unsafeHTML(gearIcon)}</div>
        </button>
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
    'promptlet-floating-menu': PromptLetFloatingMenu;
  }
}

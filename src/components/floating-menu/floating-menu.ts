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

  /**
   * Highlight the currently effective region when the user hovers over the buttons
   * @param e Mouse event
   */
  toolButtonsMouseEnterHandler(e: MouseEvent) {
    e.preventDefault();
    // Tell the editor component to highlight the effective region
    const event = new Event('mouse-enter-tools', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * De-highlight the currently effective region when mouse leaves the buttons
   * @param e Mouse event
   */
  toolButtonsMouseLeaveHandler(e: MouseEvent) {
    e.preventDefault();
    const event = new Event('mouse-leave-tools', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="floating-menu">
        <div
          class="tool-buttons"
          @mouseenter=${(e: MouseEvent) => this.toolButtonsMouseEnterHandler(e)}
          @mouseleave=${(e: MouseEvent) => this.toolButtonsMouseLeaveHandler(e)}
        >
          <button class="tool-button">
            <div class="svg-icon">🎓</div>
          </button>
          <button class="tool-button">
            <div class="svg-icon">🍔</div>
          </button>
          <button class="tool-button">
            <div class="svg-icon">😘</div>
          </button>
        </div>
        <button class="tool-button setting-button">
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

import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './sidebar-menu.css?inline';
import checkIcon from '../../images/icon-check.svg?raw';
import crossIcon from '../../images/icon-cross.svg?raw';
import questionIcon from '../../images/icon-question.svg?raw';

/**
 * Sidebar menu element.
 *
 */
@customElement('promptlet-sidebar-menu')
export class PromptLetSidebarMenu extends LitElement {
  // ===== Class properties ======
  @property({ type: Boolean })
  isOnLeft = true;

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
      <div class="sidebar-menu" ?is-on-left=${this.isOnLeft}>
        <div class="header-row">
          <span class="header-circle"></span>
          <span class="header-name">Adding text</span>
        </div>
        <div class="content-row">
          <span class="old-text"></span>
          <span class="new-text">This is very cool and super awesome.</span>
        </div>
        <div class="footer-row">
          <button class="button">
            <span class="svg-icon">${unsafeHTML(checkIcon)}</span>
          </button>
          <button class="button">
            <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
          </button>
          <button class="button">
            <span class="button-label">Explain</span>
          </button>
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
    'promptlet-sidebar-menu': PromptLetSidebarMenu;
  }
}

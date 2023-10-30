import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { config } from '../../config/config';

import componentCSS from './sidebar-menu.css?inline';
import checkIcon from '../../images/icon-check.svg?raw';
import crossIcon from '../../images/icon-cross.svg?raw';
import questionIcon from '../../images/icon-question.svg?raw';

export type Mode = 'add' | 'replace' | 'delete';

interface Colors {
  backgroundColor: string;
  circleColor: string;
}

/**
 * Sidebar menu element.
 *
 */
@customElement('promptlet-sidebar-menu')
export class PromptLetSidebarMenu extends LitElement {
  // ===== Class properties ======
  @property({ type: Boolean })
  isOnLeft = true;

  @property({ type: String })
  mode: Mode = 'add';

  modeColorMap: Record<Mode, Colors>;
  headerTextMap: Record<Mode, string>;

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    this.modeColorMap = {
      add: {
        backgroundColor: config.customColors.addedColor,
        circleColor: config.colors['green-200']
      },
      replace: {
        backgroundColor: config.customColors.replacedColor,
        circleColor: config.colors['blue-200']
      },
      delete: {
        backgroundColor: config.customColors.deletedColor,
        circleColor: config.colors['pink-200']
      }
    };

    this.headerTextMap = {
      add: 'Adding Text',
      replace: 'Replacing Text',
      delete: 'Removing Text'
    };
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
          <span
            class="header-circle"
            style="background-color: ${this.modeColorMap[this.mode]
              .circleColor};"
          ></span>
          <span class="header-name">${this.headerTextMap[this.mode]}</span>
        </div>

        <div
          class="content-row"
          style="background-color: ${this.modeColorMap[this.mode]
            .backgroundColor};"
        >
          <span class="old-text"></span>
          <span class="new-text">This is very cool and super awesome.</span>
        </div>

        <div class="footer-row">
          <div class="group">
            <button class="button">
              <span class="svg-icon">${unsafeHTML(checkIcon)}</span>
            </button>
            <button class="button">
              <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
            </button>
          </div>

          <div class="group">
            <button class="button">
              <span class="button-label">Explain</span>
            </button>
          </div>
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

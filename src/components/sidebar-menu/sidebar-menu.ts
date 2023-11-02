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

  @property({ type: String })
  oldText = '';

  @property({ type: String })
  newText = '';

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
        circleColor: config.colors['orange-200']
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
  footerButtonClicked(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON') {
      return;
    }

    // Event delegation based on the button that the user clicks
    const buttonName = target.getAttribute('button-key');

    if (buttonName === null) {
      console.error('Clicking a button without button-key.');
      return;
    }

    // Dispatch the event above shadow dom
    const event = new CustomEvent<string>('footer-button-clicked', {
      detail: buttonName,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

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

        <div class="content-row">
          <div
            class="text-block old-text"
            ?is-hidden=${this.mode === 'add'}
            style="background-color: ${this.mode === 'delete'
              ? this.modeColorMap[this.mode].backgroundColor
              : 'inherent'};"
          >
            ${this.oldText}
          </div>

          <div class="arrow" ?is-hidden=${this.mode !== 'replace'}></div>

          <div
            class="text-block new-text"
            ?is-hidden=${this.mode === 'delete'}
            style="background-color: ${this.modeColorMap[this.mode]
              .backgroundColor};"
          >
            ${this.newText}
          </div>
        </div>

        <div
          class="footer-row"
          @click=${(e: MouseEvent) => this.footerButtonClicked(e)}
        >
          <div class="group">
            <button class="button" button-key="accept">
              <span class="svg-icon">${unsafeHTML(checkIcon)}</span>
            </button>
            <button class="button" button-key="reject">
              <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
            </button>
          </div>

          <div class="group">
            <button class="button" button-key="explain">
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

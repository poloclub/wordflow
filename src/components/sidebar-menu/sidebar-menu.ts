import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { config } from '../../config/config';
import {
  tooltipMouseEnter,
  tooltipMouseLeave,
  TooltipConfig
} from '@xiaohk/utils';

import componentCSS from './sidebar-menu.css?inline';
import checkIcon from '../../images/icon-check.svg?raw';
import crossIcon from '../../images/icon-cross.svg?raw';
import questionIcon from '../../images/icon-question.svg?raw';

export type Mode = 'add' | 'replace' | 'delete' | 'summary';

export interface SidebarSummaryCounter {
  add: number;
  replace: number;
  delete: number;
}

interface Colors {
  backgroundColor: string;
  circleColor: string;
}

/**
 * Sidebar menu element.
 *
 */
@customElement('wordflow-sidebar-menu')
export class WordflowSidebarMenu extends LitElement {
  // ===== Class properties ======
  @property({ type: Boolean })
  isOnLeft = true;

  @property({ type: Boolean })
  isHidden = false;

  @property({ type: String })
  mode: Mode = 'add';

  @property({ type: String })
  oldText = '';

  @property({ type: String })
  newText = '';

  @property({ attribute: false })
  summaryCounter: SidebarSummaryCounter | null = null;

  @query('#popper-tooltip-sidebar')
  popperElement: HTMLElement | undefined;
  tooltipConfig: TooltipConfig | null = null;

  modeColorMap: Record<Mode, Colors>;
  headerTextMap: Record<Mode, string>;
  counterNameMap: Record<keyof SidebarSummaryCounter, string>;

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
      },
      summary: {
        backgroundColor: 'inherit',
        circleColor: config.colors['gray-300']
      }
    };

    this.headerTextMap = {
      add: 'Adding Text',
      replace: 'Replacing Text',
      delete: 'Removing Text',
      summary: 'Editing Text'
    };

    this.counterNameMap = {
      add: 'addition',
      replace: 'replacement',
      delete: 'deletion'
    };
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  firstUpdated() {
    // Bind the tooltip
    if (this.popperElement) {
      this.tooltipConfig = {
        tooltipElement: this.popperElement,
        mouseenterTimer: null,
        mouseleaveTimer: null
      };
    }
  }

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

  /**
   * Event handler for mouse entering the info icon in each filed
   * @param e Mouse event
   * @param field Field type
   */
  buttonMouseEntered(e: MouseEvent, message: string) {
    const target = e.currentTarget as HTMLElement;
    tooltipMouseEnter(e, message, 'top', this.tooltipConfig, 200, target, 10);
  }

  /**
   * Event handler for mouse leaving the info icon in each filed
   */
  buttonMouseLeft() {
    tooltipMouseLeave(this.tooltipConfig);
  }

  // ===== Templates and Styles ======
  render() {
    // Compose the summary text
    let summaryText = html``;

    if (this.summaryCounter) {
      for (const key of Object.keys(this.summaryCounter)) {
        const k = key as keyof SidebarSummaryCounter;
        const count = this.summaryCounter[k];
        if (count > 0) {
          summaryText = html`${summaryText}
            <div
              class="summary-row"
              style="background-color: ${this.modeColorMap[k].backgroundColor};"
            >
              ${count} ${this.counterNameMap[k]}${count > 1 ? 's' : ''}
            </div>`;
        }
      }
    }

    return html`
      <div
        class="sidebar-menu"
        ?is-on-left=${this.isOnLeft}
        ?is-hidden=${this.isHidden}
      >
        <div
          id="popper-tooltip-sidebar"
          class="popper-tooltip hidden"
          role="tooltip"
        >
          <span class="popper-content"></span>
          <div class="popper-arrow"></div>
        </div>

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
            ?is-hidden=${this.mode === 'add' || this.mode === 'summary'}
            style="background-color: ${this.mode === 'delete'
              ? this.modeColorMap[this.mode].backgroundColor
              : 'inherent'};"
          >
            ${this.oldText}
          </div>

          <div class="arrow" ?is-hidden=${this.mode !== 'replace'}></div>

          <div
            class="text-block new-text"
            ?is-hidden=${this.mode === 'delete' || this.mode === 'summary'}
            style="background-color: ${this.modeColorMap[this.mode]
              .backgroundColor};"
          >
            ${this.newText}
          </div>

          <div
            class="text-block summary-text"
            ?is-hidden=${this.mode !== 'summary'}
            style="background-color: ${this.modeColorMap[this.mode]
              .backgroundColor};"
          >
            ${summaryText}
          </div>
        </div>

        <div
          class="footer-row"
          @click=${(e: MouseEvent) => this.footerButtonClicked(e)}
        >
          <div class="group">
            <button
              class="button"
              button-key=${this.mode === 'summary' ? 'accept-all' : 'accept'}
              @mouseenter=${(e: MouseEvent) =>
                this.buttonMouseEntered(
                  e,
                  this.mode === 'summary' ? 'Accept all' : 'Accept'
                )}
              @mouseleave=${() => this.buttonMouseLeft()}
            >
              <span class="svg-icon">${unsafeHTML(checkIcon)}</span>
            </button>
            <button
              class="button"
              button-key=${this.mode === 'summary' ? 'reject-all' : 'reject'}
              @mouseenter=${(e: MouseEvent) =>
                this.buttonMouseEntered(
                  e,
                  this.mode === 'summary' ? 'Reject all' : 'Reject'
                )}
              @mouseleave=${() => this.buttonMouseLeft()}
            >
              <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
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
    'wordflow-sidebar-menu': WordflowSidebarMenu;
  }
}

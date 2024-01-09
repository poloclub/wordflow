import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { updatePopperTooltip } from '@xiaohk/utils';

// Types
import type { PromptDataLocal } from '../../types/wordflow';

// Assets
import componentCSS from './floating-menu.css?inline';
import gearIcon from '../../images/icon-gear.svg?raw';
import homeIcon from '../../images/icon-home.svg?raw';

/**
 * Floating menu element.
 *
 */
@customElement('wordflow-floating-menu')
export class WordflowFloatingMenu extends LitElement {
  // ===== Class properties ======
  @property({ attribute: false })
  popperTooltip: Promise<HTMLElement> | undefined;

  @property({ type: Number })
  loadingActionIndex: number | null = null;

  @property({ attribute: false })
  favPrompts: [
    PromptDataLocal | null,
    PromptDataLocal | null,
    PromptDataLocal | null
  ] = [null, null, null];

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
  toolButtonGroupMouseEnterHandler(e: MouseEvent) {
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
  toolButtonGroupMouseLeaveHandler(e: MouseEvent) {
    e.preventDefault();
    const event = new Event('mouse-leave-tools', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Notify the parent to take wordflow action
   * @param e Mouse event
   * @param index Index of the active tool button
   */
  toolButtonClickHandler(e: MouseEvent, index: number) {
    e.preventDefault();

    const curPrompt = this.favPrompts[index];

    // Special case for empty button: clicking opens the setting window
    if (curPrompt === null) {
      this.settingButtonClicked();
      return;
    }

    // Do not respond to interactions when an action is laoding
    if (this.loadingActionIndex !== null) return;

    // Prevent default suppresses ::active, we need to manually trigger it
    const target = e.target as HTMLElement;
    target.classList.add('active');
    setTimeout(() => {
      target.classList.remove('active');
    }, 100);

    const event = new CustomEvent<[PromptDataLocal, number]>(
      'tool-button-clicked',
      {
        detail: [curPrompt, index],
        bubbles: true,
        composed: true
      }
    );
    this.dispatchEvent(event);
  }

  settingButtonClicked() {
    const event = new Event('setting-button-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  toolButtonMouseEnterHandler(e: MouseEvent, index: number) {
    if (this.popperTooltip === undefined) {
      throw Error('Popper is not initialized.');
    }

    const curPrompt = this.favPrompts[index];

    this.popperTooltip.then(tooltip => {
      updatePopperTooltip(
        tooltip,
        e.target as HTMLElement,
        curPrompt?.title || 'Add a prompt',
        'right',
        true,
        10
      );
      tooltip.classList.remove('hidden');
    });
  }

  settingButtonMouseEnterHandler(e: MouseEvent) {
    if (this.popperTooltip === undefined) {
      throw Error('Popper is not initialized.');
    }

    this.popperTooltip.then(tooltip => {
      updatePopperTooltip(
        tooltip,
        e.target as HTMLElement,
        'Prompt manager',
        'right',
        true,
        10
      );
      tooltip.classList.remove('hidden');
    });
  }

  toolButtonMouseLeaveHandler(_e: MouseEvent) {
    if (this.popperTooltip === undefined) {
      throw Error('Popper is not initialized.');
    }

    this.popperTooltip.then(tooltip => {
      tooltip.classList.add('hidden');
    });
  }

  // ===== Templates and Styles ======
  render() {
    // Create the active tool buttons
    let toolButtons = html``;
    for (const [i, prompt] of this.favPrompts.entries()) {
      // Take the first unicode character as the icon
      const icon = prompt?.icon || '+';
      toolButtons = html`${toolButtons}
        <button
          class="tool-button"
          ?is-loading=${this.loadingActionIndex === i}
          ?is-empty=${prompt === null}
          @mousedown=${(e: MouseEvent) => this.toolButtonClickHandler(e, i)}
          @mouseenter=${(e: MouseEvent) =>
            this.toolButtonMouseEnterHandler(e, i)}
          @mouseleave=${(e: MouseEvent) => this.toolButtonMouseLeaveHandler(e)}
        >
          <div class="icon">
            <div class="svg-icon">
              ${this.loadingActionIndex === i ? '' : icon}
            </div>

            <div
              class="loader-container"
              ?hidden=${this.loadingActionIndex !== i}
            >
              <div class="circle-loader"></div>
            </div>
          </div>
        </button>`;
    }

    return html`
      <div class="floating-menu">
        <div
          class="tool-buttons"
          ?has-loading-action=${this.loadingActionIndex !== null}
          @mouseenter=${(e: MouseEvent) =>
            this.toolButtonGroupMouseEnterHandler(e)}
          @mouseleave=${(e: MouseEvent) =>
            this.toolButtonGroupMouseLeaveHandler(e)}
        >
          ${toolButtons}
        </div>
        <button
          class="tool-button setting-button"
          @mousedown=${() => this.settingButtonClicked()}
          @mouseenter=${(e: MouseEvent) =>
            this.settingButtonMouseEnterHandler(e)}
          @mouseleave=${(e: MouseEvent) => this.toolButtonMouseLeaveHandler(e)}
        >
          <div class="svg-icon">${unsafeHTML(homeIcon)}</div>
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
    'wordflow-floating-menu': WordflowFloatingMenu;
  }
}

import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { updatePopperTooltip } from '@xiaohk/utils';

// Types
import type { PromptModel } from '../../types/common-types';
import type { Promptlet, PromptDataLocal } from '../../types/promptlet';

// Assets
import componentCSS from './floating-menu.css?inline';
import mlPromptJSON from '../../prompts/prompt-ml-academic.json';
import gearIcon from '../../images/icon-gear.svg?raw';

const mlPrompt = mlPromptJSON as PromptModel;

const createPromptlet = ({
  title = '',
  description = '',
  prompt = '',
  temperature = 0.2,
  tags = [],
  outputParser = /(.*)/,
  icon = ''
}: {
  title?: string;
  description?: string;
  prompt?: string;
  temperature?: number;
  tags?: string[];
  outputParser?: RegExp;
  icon?: string;
}) => {
  const promptlet: Promptlet = {
    title,
    description,
    prompt,
    temperature,
    tags,
    outputParser,
    icon
  };
  return promptlet;
};

/**
 * Floating menu element.
 *
 */
@customElement('promptlet-floating-menu')
export class PromptLetFloatingMenu extends LitElement {
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

    // Initialize the current active promptlets
    const promptlet1 = createPromptlet({
      title: 'Improve academic ML paper writing',
      prompt: mlPrompt.prompt,
      outputParser: /.*<output>(.*?)<\/output>.*/,
      icon: '🎓'
    });
    const promptlet2 = createPromptlet({
      title: 'Improve academic paper in LaTeX',
      prompt:
        'You are a great writer. Improve the flow in the text in <input></input>. Your output should be put in <output></output>.\n <input>{{text}}</input>',
      icon: '✍️'
    });
    const promptlet3 = createPromptlet({
      title: 'Translate the text to Japanese',
      prompt:
        'Translate the text in <input></input> from English to Japanese. Your output should be put in <output></output>.\n<input>{{text}}</input>',
      outputParser: /.*<output>(.*?)<\/output>.*/,
      icon: '🇯🇵'
    });
    // this.activePromptlets = [promptlet1, promptlet2, promptlet3];
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
   * Notify the parent to take promptlet action
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
        'Settings',
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

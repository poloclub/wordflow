import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { updatePopperTooltip } from '@xiaohk/utils';

// Types
import type { PromptModel } from '../../types/common-types';
import type { Promptlet } from '../../types/promptlet';

// Assets
import componentCSS from './floating-menu.css?inline';
import mlPromptJSON from '../../prompts/prompt-ml-academic.json';
import gearIcon from '../../images/icon-gear.svg?raw';

const mlPrompt = mlPromptJSON as PromptModel;

const createPromptlet = ({
  name = '',
  description = '',
  prompt = '',
  temperature = 0.2,
  tags = [],
  outputParser = '',
  iconUnicode = ''
}: {
  name?: string;
  description?: string;
  prompt?: string;
  temperature?: number;
  tags?: string[];
  outputParser?: string;
  iconUnicode?: string;
}) => {
  const promptlet: Promptlet = {
    name,
    description,
    prompt,
    temperature,
    tags,
    outputParser,
    iconUnicode
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

  @state()
  activePromptlets: Promptlet[] = [];

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    // Initialize the current active promptlets
    const promptlet1 = createPromptlet({
      name: 'Improve academic ML paper writing',
      prompt: mlPrompt.prompt,
      outputParser: '/.*<o>(.*?)</o>.*/',
      iconUnicode: '🎓'
    });
    const promptlet2 = createPromptlet({
      name: 'Improve NSF grant proposal writing',
      iconUnicode: '💰'
    });
    const promptlet3 = createPromptlet({
      name: 'Translate the text to Japanese',
      prompt:
        'Translate the text in <input></input> from English to Japanese. Your output should be put in <output></output>.\n<input>{{text}}</input>',
      outputParser: '/(.*?)/',
      iconUnicode: '🇯🇵'
    });
    this.activePromptlets = [promptlet1, promptlet2, promptlet3];
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
    const event = new CustomEvent<Promptlet>('tool-button-clicked', {
      detail: this.activePromptlets[index],
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  toolButtonMouseEnterHandler(e: MouseEvent, index: number) {
    if (this.popperTooltip === undefined) {
      throw Error('Popper is not initialized.');
    }

    this.popperTooltip.then(tooltip => {
      updatePopperTooltip(
        tooltip,
        e.target as HTMLElement,
        this.activePromptlets[index].name,
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
    for (const [i, promptlet] of this.activePromptlets.entries()) {
      // Take the first unicode character as the icon
      // const icon = Array.from(promptlet.iconUnicode)[0];
      const icon = promptlet.iconUnicode;
      toolButtons = html`${toolButtons}
        <button
          class="tool-button"
          @click=${(e: MouseEvent) => this.toolButtonClickHandler(e, i)}
          @mouseenter=${(e: MouseEvent) =>
            this.toolButtonMouseEnterHandler(e, i)}
          @mouseleave=${(e: MouseEvent) => this.toolButtonMouseLeaveHandler(e)}
        >
          <div class="svg-icon">${icon}</div>
        </button>`;
    }

    return html`
      <div class="floating-menu">
        <div
          class="tool-buttons"
          @mouseenter=${(e: MouseEvent) =>
            this.toolButtonGroupMouseEnterHandler(e)}
          @mouseleave=${(e: MouseEvent) =>
            this.toolButtonGroupMouseLeaveHandler(e)}
        >
          ${toolButtons}
        </div>
        <button
          class="tool-button setting-button"
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

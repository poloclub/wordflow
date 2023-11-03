import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { updatePopperTooltip } from '@xiaohk/utils';

import componentCSS from './floating-menu.css?inline';

import gearIcon from '../../images/icon-gear.svg?raw';

/**
 * Promptlet object describing a prompt functionality.
 */
interface Promptlet {
  /** Short name of the promptlet */
  name: string;

  /** Detailed description of the promptlet */
  description: string;

  /** The associated prompt */
  prompt: string;

  /** Associated tags */
  tags: string[];

  /** A simple regex rule to parse the output */
  outputParser: string;

  /** A unicode character used as an icon for the promptlet (can be emoji) */
  iconUnicode: string;
}

const createPromptlet = ({
  name = '',
  description = '',
  prompt = '',
  tags = [],
  outputParser = '',
  iconUnicode = ''
}: {
  name?: string;
  description?: string;
  prompt?: string;
  tags?: string[];
  outputParser?: string;
  iconUnicode?: string;
}) => {
  const promptlet: Promptlet = {
    name,
    description,
    prompt,
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
      iconUnicode: '🎓'
    });
    const promptlet2 = createPromptlet({
      name: 'Improve NSF grant proposal writing',
      iconUnicode: '💰'
    });
    const promptlet3 = createPromptlet({
      name: 'Make the writing very easy to understand',
      iconUnicode: '🐣'
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

  toolButtonClickHandler(e: MouseEvent, index: number) {
    console.log(index);
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
      const icon = Array.from(promptlet.iconUnicode)[0];
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

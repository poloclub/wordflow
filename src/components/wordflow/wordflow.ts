import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';

import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import componentCSS from './wordflow.css?inline';

/**
 * Wordflow element.
 *
 */
@customElement('promptlet-wordflow')
export class PromptLetWordflow extends LitElement {
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
  initData = async () => {};

  // ===== Event Methods ======

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="wordflow">
        <div class="left-panel">
          <div class="popper-box">
            <promptlet-sidebar-menu
              id="left-sidebar-menu"
            ></promptlet-sidebar-menu>
          </div>
        </div>
        <div class="center-panel">
          <div class="editor-content">
            <promptlet-text-editor></promptlet-text-editor>
          </div>
        </div>
        <div class="right-panel">
          <div class="popper-box">
            <promptlet-sidebar-menu
              id="right-sidebar-menu"
            ></promptlet-sidebar-menu>
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
    'promptlet-wordflow': PromptLetWordflow;
  }
}

/**
 * Update the popper tooltip for the highlighted prompt point
 * @param tooltip Tooltip element
 * @param anchor Anchor point for the tooltip
 * @param point The prompt point
 */
const updatePopperPopover = (
  tooltip: HTMLElement,
  anchor: HTMLElement,
  text: string,
  placement: 'bottom' | 'left' | 'top' | 'right'
) => {
  const contentElement = tooltip.querySelector(
    '.popper-content'
  )! as HTMLElement;
  contentElement.innerHTML = text;
  const arrowElement = tooltip.querySelector('.popper-arrow')! as HTMLElement;

  arrowElement.classList.add('hidden');
  computePosition(anchor, tooltip, {
    placement: placement,
    middleware: [offset(6), flip(), shift()]
  }).then(({ x, y }) => {
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  });
};

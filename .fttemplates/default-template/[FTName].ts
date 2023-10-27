import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './<FTName>.css?inline';

/**
 * [FTName | sentencecase] element.
 *
 */
@customElement('promptlet-[FTName]')
export class PromptLet<FTName | pascalcase> extends LitElement {
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
  async initData() {};

  // ===== Event Methods ======

  // ===== Templates and Styles ======
  render() {
    return html` <div class="<FTName | paramcase>">[FTName | sentencecase]</div> `;
  };

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'promptlet-<FTName>': PromptLet<FTName | pascalcase>;
  }
}

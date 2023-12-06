import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './panel-local.css?inline';

import searchIcon from '../../images/icon-search.svg?raw';
import crossIcon from '../../images/icon-cross-thick.svg?raw';
import sortIcon from '../../images/icon-decrease.svg?raw';

/**
 * Panel local element.
 *
 */
@customElement('promptlet-panel-local')
export class PromptLetPanelLocal extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    return html`
      <div class="panel-local">
        <div class="fav-panel">
          <div class="header">
            <span class="title">Favorite Prompts</span>
            <span class="description"
              >Drag prompts here to customize the toolbar</span
            >
          </div>

          <div class="fav-prompts">
            <div class="fav-prompt-slot">Prompt 1</div>
            <div class="fav-prompt-slot">Prompt 2</div>
            <div class="fav-prompt-slot">Prompt 3</div>
          </div>
        </div>

        <div class="prompt-panel">
          <div class="search-panel">
            <div class="search-group">
              <div class="result">77 Prompts</div>

              <button class="create-button">New Prompt</button>
            </div>

            <div class="search-group">
              <div class="search-bar">
                <span class="icon-container">
                  <span class="svg-icon">${unsafeHTML(searchIcon)}</span>
                </span>

                <input
                  id="search-bar-input"
                  type="text"
                  name="search-bar-input"
                  placeholder="Search my prompts"
                />

                <span class="icon-container">
                  <span class="svg-icon cross">${unsafeHTML(crossIcon)}</span>
                </span>
              </div>

              <div class="sort-button">
                <span class="svg-icon">${unsafeHTML(sortIcon)}</span>
                <select class="sort-selection">
                  <option>Name</option>
                  <option>Recency</option>
                  <option>Run Count</option>
                </select>
              </div>
            </div>
          </div>

          <div class="prompt-container"></div>
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
    'promptlet-panel-local': PromptLetPanelLocal;
  }
}

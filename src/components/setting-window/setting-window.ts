import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Assets
import componentCSS from './setting-window.css?inline';
import crossIcon from '../../images/icon-cross.svg?raw';

/**
 * Setting window element.
 *
 */
@customElement('promptlet-setting-window')
export class PromptLetSettingWindow extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @state()
  activeMenuItemIndex = 0;

  menuItems = ['My promptlets', 'Community', 'Settings'];

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
  menuItemClicked(index: number) {
    this.activeMenuItemIndex = index;
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the menu items
    let menuItemsTemplate = html``;
    for (const [i, item] of this.menuItems.entries()) {
      menuItemsTemplate = html`${menuItemsTemplate}
        <div
          class="menu-item"
          data-text="${item}"
          ?selected=${this.activeMenuItemIndex === i}
          @click=${() => this.menuItemClicked(i)}
        >
          ${item}
        </div> `;
    }

    return html`
      <div class="setting-window">
        <div class="window">
          <div class="header">
            <div class="name">Wordflow Settings</div>
            <div class="svg-icon close-button">${unsafeHTML(crossIcon)}</div>
          </div>
          <div class="content">
            <div class="menu">${menuItemsTemplate}</div>
            <div class="panel">panel</div>
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
    'promptlet-setting-window': PromptLetSettingWindow;
  }
}

import {
  LitElement,
  css,
  unsafeCSS,
  html,
  PropertyValues,
  TemplateResult
} from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '../panel-community/panel-community';
import '../panel-local/panel-local';
import '../panel-setting/panel-setting';

// Assets
import componentCSS from './setting-window.css?inline';
import crossIcon from '../../images/icon-cross.svg?raw';

interface MenuItem {
  name: string;
  component: TemplateResult;
}

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

  menuItems: MenuItem[] = [
    {
      name: 'My Prompts',
      component: html`<promptlet-panel-local></promptlet-panel-local>`
    },
    {
      name: 'Community',
      component: html`<promptlet-panel-community></promptlet-panel-community>`
    },
    {
      name: 'Settings',
      component: html`<promptlet-panel-setting></promptlet-panel-setting>`
    }
  ];

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
          data-text="${item.name}"
          ?selected=${this.activeMenuItemIndex === i}
          @click=${() => this.menuItemClicked(i)}
        >
          ${item.name}
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
            <div class="panel">
              ${this.menuItems[this.activeMenuItemIndex].component}
            </div>
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

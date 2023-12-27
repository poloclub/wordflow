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
import { PromptManager } from '../wordflow/prompt-manager';
import { RemotePromptManager } from '../wordflow/remote-prompt-manager';

import '../panel-community/panel-community';
import '../panel-local/panel-local';
import '../panel-setting/panel-setting';

// Types
import type {
  PromptDataLocal,
  PromptDataRemote,
  TagData
} from '../../types/promptlet';

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
  @property({ attribute: false })
  promptManager!: PromptManager;

  @property({ attribute: false })
  localPrompts: PromptDataLocal[] = [];

  @property({ attribute: false })
  favPrompts: [
    PromptDataLocal | null,
    PromptDataLocal | null,
    PromptDataLocal | null
  ] = [null, null, null];

  @property({ attribute: false })
  remotePromptManager!: RemotePromptManager;

  @property({ attribute: false })
  remotePrompts: PromptDataRemote[] = [];

  @property({ attribute: false })
  popularTags: TagData[] = [];

  @state()
  activeMenuItemIndex = 1;

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

  firstUpdated() {
    // Start to load the popular remote prompts
    this.remotePromptManager.getPromptsByTag('', 'popular');

    // Start to load the popular tags
    this.remotePromptManager.getPopularTags();
  }

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
    const menuItems: MenuItem[] = [
      {
        name: 'My Prompts',
        component: html`<promptlet-panel-local
          .promptManager=${this.promptManager}
          .localPrompts=${this.localPrompts}
          .favPrompts=${this.favPrompts}
        ></promptlet-panel-local>`
      },
      {
        name: 'Community',
        component: html`<promptlet-panel-community
          .promptManager=${this.promptManager}
          .remotePromptManager=${this.remotePromptManager}
          .remotePrompts=${this.remotePrompts}
          .popularTags=${this.popularTags}
        ></promptlet-panel-community>`
      },
      {
        name: 'Settings',
        component: html`<promptlet-panel-setting></promptlet-panel-setting>`
      }
    ];

    // Compose the menu items
    let menuItemsTemplate = html``;
    for (const [i, item] of menuItems.entries()) {
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
              ${menuItems[this.activeMenuItemIndex].component}
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

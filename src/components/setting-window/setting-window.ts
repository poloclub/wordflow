import {
  LitElement,
  css,
  unsafeCSS,
  html,
  PropertyValues,
  TemplateResult
} from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { PromptManager } from '../wordflow/prompt-manager';
import { RemotePromptManager } from '../wordflow/remote-prompt-manager';
import { UserConfigManager, UserConfig } from '../wordflow/user-config';
import { v4 as uuidv4 } from 'uuid';

import '../toast/toast';
import '../panel-community/panel-community';
import '../panel-local/panel-local';
import '../panel-setting/panel-setting';

// Types
import type {
  PromptDataLocal,
  PromptDataRemote,
  TagData
} from '../../types/wordflow';
import type { NightjarToast } from '../toast/toast';
import type { SharePromptMessage } from '../prompt-editor/prompt-editor';
import type { WordflowPanelCommunity } from '../panel-community/panel-community';

// Assets
import componentCSS from './setting-window.css?inline';
import crossIcon from '../../images/icon-cross.svg?raw';

interface MenuItem {
  name: string;
  component: TemplateResult;
}

/**
 * Setting window element.
 */
@customElement('wordflow-setting-window')
export class WordflowSettingWindow extends LitElement {
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

  @property({ attribute: false })
  userConfigManager!: UserConfigManager;

  @property({ attribute: false })
  userConfig!: UserConfig;

  @property({ attribute: false })
  textGenLocalWorker!: Worker;

  @state()
  activeMenuItemIndex = 0;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast#setting-toast')
  toastComponent: NightjarToast | undefined;

  @queryAsync('wordflow-panel-community')
  communityPanelComponent!: Promise<WordflowPanelCommunity>;

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

  /**
   * Show a community prompt without clicking
   * @param prompt remote prompt data
   */
  showCommunityPrompt(prompt: PromptDataRemote) {
    this.activeMenuItemIndex = 1;
    this.communityPanelComponent.then(panel => {
      panel.promptCardClicked(prompt);
    });
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  menuItemClicked(index: number) {
    this.activeMenuItemIndex = index;
  }

  /**
   * Fork a remote prompt into the local library
   */
  promptViewerAddClickHandler(e: CustomEvent<PromptDataRemote>) {
    if (!this.toastComponent) {
      throw Error('Toast is undefined.');
    }

    const remotePrompt = e.detail;
    const newLocalPrompt: PromptDataLocal = { ...remotePrompt, key: uuidv4() };

    let curUserID = localStorage.getItem('user-id');
    if (curUserID === null) {
      console.warn('userID is not set.');
      curUserID = uuidv4();
      localStorage.setItem('user-id', curUserID);
    }

    // Clean up some fields
    newLocalPrompt.created = new Date().toISOString();
    newLocalPrompt.userName = '';
    newLocalPrompt.userID = curUserID;
    newLocalPrompt.promptRunCount = 0;
    this.promptManager.addPrompt(newLocalPrompt);

    // Show a toaster and switch the tab
    this.toastMessage = 'Added the prompt to My Prompts.';
    this.toastType = 'success';
    this.toastComponent.show();

    this.activeMenuItemIndex = 0;
  }

  closeButtonClicked() {
    const event = new Event('close-button-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Close the modal if the user clicks the background
   * @param e Mouse event
   */
  backgroundClicked(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('setting-window')) {
      this.closeButtonClicked();
    }
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
        component: html`<wordflow-panel-local
          class="setting-panel"
          ?is-shown=${this.activeMenuItemIndex === 0}
          .promptManager=${this.promptManager}
          .localPrompts=${this.localPrompts}
          .favPrompts=${this.favPrompts}
        ></wordflow-panel-local>`
      },
      {
        name: 'Community',
        component: html`<wordflow-panel-community
          class="setting-panel"
          ?is-shown=${this.activeMenuItemIndex === 1}
          .remotePromptManager=${this.remotePromptManager}
          .remotePrompts=${this.remotePrompts}
          .popularTags=${this.popularTags}
          @add-clicked=${(e: CustomEvent<PromptDataRemote>) =>
            this.promptViewerAddClickHandler(e)}
        ></wordflow-panel-community>`
      },
      {
        name: 'Settings',
        component: html`<wordflow-panel-setting
          class="setting-panel"
          .userConfigManager=${this.userConfigManager}
          .userConfig=${this.userConfig}
          .textGenLocalWorker=${this.textGenLocalWorker}
          ?is-shown=${this.activeMenuItemIndex === 2}
        ></wordflow-panel-setting>`
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

    // Compose the panels
    let panelTemplate = html``;
    for (const item of menuItems) {
      panelTemplate = html`${panelTemplate} ${item.component} `;
    }

    return html`
      <div
        class="setting-window"
        @click=${(e: MouseEvent) => this.backgroundClicked(e)}
      >
        <div class="window">
          <div class="toast-container">
            <nightjar-toast
              id="setting-toast"
              message=${this.toastMessage}
              type=${this.toastType}
            ></nightjar-toast>
          </div>

          <div class="header">
            <div class="name">Prompt Manager</div>
            <div
              class="svg-icon close-button"
              @click=${() => this.closeButtonClicked()}
            >
              ${unsafeHTML(crossIcon)}
            </div>
          </div>
          <div class="content">
            <div class="menu">${menuItemsTemplate}</div>
            <div class="panel">${panelTemplate}</div>
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
    'wordflow-setting-window': WordflowSettingWindow;
  }
}

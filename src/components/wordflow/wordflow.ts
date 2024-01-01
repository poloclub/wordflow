import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { WordflowTextEditor } from '../text-editor/text-editor';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/config';
import { PromptManager } from './prompt-manager';
import { RemotePromptManager } from './remote-prompt-manager';
import { UserConfigManager, UserConfig } from './user-config';

// Types
import type { SimpleEventMessage, PromptModel } from '../../types/common-types';
import type {
  PromptDataLocal,
  PromptDataRemote,
  TagData
} from '../../types/wordflow';
import type { VirtualElement } from '@floating-ui/dom';
import type { WordflowSidebarMenu, Mode } from '../sidebar-menu/sidebar-menu';
import type { WordflowFloatingMenu } from '../floating-menu/floating-menu';
import type { Editor } from '@tiptap/core';
import type { SharePromptMessage } from '../prompt-editor/prompt-editor';
import type { NightjarToast } from '../toast/toast';
import type { PrivacyDialog } from '../privacy-dialog/privacy-dialog';

// Components
import '../toast/toast';
import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import '../floating-menu/floating-menu';
import '../setting-window/setting-window';
import '../privacy-dialog/privacy-dialog';

// Assets
import componentCSS from './wordflow.css?inline';
import defaultPromptsJSON from '../../prompts/default-prompts.json';
import logoIcon from '../../images/wordflow-logo.svg?raw';
import githubIcon from '../../images/icon-github.svg?raw';
import fileIcon from '../../images/icon-file.svg?raw';
import youtubeIcon from '../../images/icon-youtube.svg?raw';

const defaultPrompts = defaultPromptsJSON as PromptDataLocal[];

// Constants
const MENU_X_OFFSET = config.layout.sidebarMenuXOffset;

export interface UpdateSidebarMenuProps {
  anchor: Element | VirtualElement;
  editor: Editor;
  boxPosition: 'left' | 'right';
  mode?: Mode;
  oldText?: string;
  newText?: string;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'warning' | 'error';
}

/**
 * Wordflow element.
 *
 */
@customElement('wordflow-wordflow')
export class WordflowWordflow extends LitElement {
  // ===== Class properties ======
  @queryAsync('#popper-sidebar-box')
  popperSidebarBox: Promise<HTMLElement> | undefined;

  @queryAsync('#floating-menu-box')
  floatingMenuBox: Promise<HTMLElement> | undefined;

  @queryAsync('#popper-tooltip')
  popperTooltip: Promise<HTMLElement> | undefined;

  @query('wordflow-text-editor')
  textEditorElement: WordflowTextEditor | undefined;

  @query('.center-panel')
  centerPanelElement: HTMLElement | undefined;

  @query('.wordflow')
  workflowElement: HTMLElement | undefined;

  @state()
  showSettingWindow = false;

  @state()
  loadingActionIndex: number | null = null;

  @state()
  promptManager: PromptManager;

  @state()
  favPrompts: [
    PromptDataLocal | null,
    PromptDataLocal | null,
    PromptDataLocal | null
  ] = [null, null, null];

  @state()
  localPrompts: PromptDataLocal[] = [];

  @state()
  remotePromptManager: RemotePromptManager;

  @state()
  remotePrompts: PromptDataRemote[] = [];

  @state()
  popularTags: TagData[] = [];

  @state()
  userConfigManager: UserConfigManager;

  @state()
  userConfig!: UserConfig;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast#toast-wordflow')
  toastComponent: NightjarToast | undefined;

  @query('wordflow-privacy-dialog')
  privacyDialogComponent: PrivacyDialog | undefined;

  lastUpdateSidebarMenuProps: UpdateSidebarMenuProps | null = null;

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    // Set up user info
    this.initUserID();

    // Set up the local prompt manager
    const updateLocalPrompts = (newLocalPrompts: PromptDataLocal[]) => {
      this.localPrompts = newLocalPrompts;
    };

    const updateFavPrompts = (
      newFavPrompts: [
        PromptDataLocal | null,
        PromptDataLocal | null,
        PromptDataLocal | null
      ]
    ) => {
      this.favPrompts = newFavPrompts;
    };

    this.promptManager = new PromptManager(
      updateLocalPrompts,
      updateFavPrompts
    );

    // Set up the remote prompt manager
    const updateRemotePrompts = (newRemotePrompts: PromptDataRemote[]) => {
      this.remotePrompts = newRemotePrompts;
    };

    const updatePopularTags = (popularTags: TagData[]) => {
      this.popularTags = popularTags;
    };

    this.remotePromptManager = new RemotePromptManager(
      updateRemotePrompts,
      updatePopularTags
    );

    this.initDefaultPrompts();

    // Set up the user config store
    const updateUserConfig = (userConfig: UserConfig) => {
      this.userConfig = userConfig;
    };
    this.userConfigManager = new UserConfigManager(updateUserConfig);
  }

  firstUpdated() {
    if (this.workflowElement === undefined) {
      throw Error('workflowElement undefined.');
    }
    // Observe the app's content size and update menu positions accordingly
    const observer = new ResizeObserver(() => {
      this.resizeHandler();
    });
    observer.observe(this.workflowElement);
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  initData = async () => {};

  initUserID() {
    const userID = localStorage.getItem('user-id');
    if (userID === null) {
      const newUserID = uuidv4();
      localStorage.setItem('user-id', newUserID);
      return newUserID;
    } else {
      return userID;
    }
  }

  /**
   * Add a few default prompts to the new user's local library.
   */
  initDefaultPrompts() {
    let userID = localStorage.getItem('user-id');
    if (userID === null) {
      console.warn('userID is null');
      userID = this.initUserID();
    }

    // Add some default prompts for the first-time users
    const hasAddedDefaultPrompts = localStorage.getItem(
      'has-added-default-prompts'
    );

    if (hasAddedDefaultPrompts === null) {
      for (const [i, prompt] of defaultPrompts.entries()) {
        // Update some fields
        prompt.key = uuidv4();
        prompt.userID = userID;
        prompt.created = new Date().toISOString();
        this.promptManager.addPrompt(prompt);

        // Add the first three as fav prompts
        if (i < 3) {
          this.promptManager.setFavPrompt(i, prompt);
        }
      }
      localStorage.setItem('has-added-default-prompts', 'true');
    }
  }

  /**
   * Update the sidebar menu position and content
   */
  updateSidebarMenu = async ({
    anchor,
    boxPosition,
    editor,
    mode,
    oldText,
    newText
  }: UpdateSidebarMenuProps) => {
    if (
      this.centerPanelElement === undefined ||
      this.popperSidebarBox === undefined
    ) {
      console.error('centerPanelElement is undefined');
      return;
    }

    const popperElement = await this.popperSidebarBox;
    const menuElement = popperElement.querySelector(
      'wordflow-sidebar-menu'
    ) as WordflowSidebarMenu;

    // Pass data to the menu component
    if (mode) menuElement.mode = mode;
    if (oldText) menuElement.oldText = oldText;
    if (newText) menuElement.newText = newText;

    // Cache the props
    this.lastUpdateSidebarMenuProps = {
      anchor,
      boxPosition,
      editor,
      mode: menuElement.mode,
      oldText: menuElement.oldText,
      newText: menuElement.newText
    };

    const { view } = editor;
    const $from = view.state.selection.$from;
    const cursorCoordinate = view.coordsAtPos($from.pos);

    // Need to wait the child component to update
    await new Promise(r => {
      setTimeout(r, 0);
    });

    // Need to bound the box inside the view
    const popperElementBBox = popperElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const invisibleHeight = window.scrollY;

    // Get the line height in the editor element
    const lineHeight = parseInt(
      window.getComputedStyle(editor.options.element).lineHeight
    );

    const PADDING_OFFSET = 5;
    const minTop =
      invisibleHeight + popperElementBBox.height / 2 + PADDING_OFFSET;
    const maxTop =
      windowHeight +
      invisibleHeight -
      popperElementBBox.height / 2 -
      PADDING_OFFSET;
    const idealTop = cursorCoordinate.top + invisibleHeight + lineHeight / 2;
    const boundedTop = Math.min(maxTop, Math.max(minTop, idealTop));

    popperElement.style.top = `${boundedTop}px`;
    this.updateSidebarMenuXPos(boxPosition);
  };

  async updateSidebarMenuXPos(boxPosition: 'left' | 'right') {
    if (
      this.centerPanelElement === undefined ||
      this.popperSidebarBox === undefined
    ) {
      console.error('centerPanelElement is undefined');
      return;
    }

    const popperElement = await this.popperSidebarBox;
    const containerBBox = this.centerPanelElement.getBoundingClientRect();
    const menuElement = popperElement.querySelector(
      'wordflow-sidebar-menu'
    ) as WordflowSidebarMenu;

    if (boxPosition === 'left') {
      // Set the 'is-on-left' property of the component
      menuElement.isOnLeft = true;

      const offsetParentBBox =
        popperElement.offsetParent!.getBoundingClientRect();
      popperElement.style.left = 'unset';
      popperElement.style.right = `${
        offsetParentBBox.width - containerBBox.x + MENU_X_OFFSET
      }px`;
    } else {
      // Set the 'is-on-left' property of the component
      menuElement.isOnLeft = false;

      popperElement.style.right = 'unset';
      popperElement.style.left = `${
        containerBBox.x + containerBBox.width + MENU_X_OFFSET
      }px`;
    }
  }

  // ===== Event Methods ======
  resizeHandler() {
    this.updateSidebarMenuXPos(
      this.lastUpdateSidebarMenuProps
        ? this.lastUpdateSidebarMenuProps.boxPosition
        : 'left'
    );
  }

  sidebarMenuFooterButtonClickedHandler(e: CustomEvent<string>) {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.sidebarMenuFooterButtonClickedHandler(e);
  }

  floatingMenuToolMouseEnterHandler() {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolsMouseEnterHandler();
  }

  floatingMenuToolsMouseLeaveHandler() {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolsMouseLeaveHandler();
  }

  floatingMenuToolButtonClickHandler(
    e: CustomEvent<[PromptDataLocal, number]>
  ) {
    if (this.workflowElement === undefined) {
      throw Error('workflowElement is undefined');
    }

    const handleButtonClick = () => {
      // Delegate the event to the text editor component
      if (!this.textEditorElement) return;
      const [prompt, index] = e.detail;
      this.textEditorElement.floatingMenuToolButtonClickHandler(prompt);

      // Start the loading animation
      this.loadingActionIndex = index;
    };

    // First check if the user has agreed the privacy policy
    const hasConfirmedPrivacy = localStorage.getItem('has-confirmed-privacy');
    if (hasConfirmedPrivacy === 'true') {
      handleButtonClick();
    } else {
      if (!this.privacyDialogComponent) {
        throw Error('privacyDialogComponent is null');
      }
      this.privacyDialogComponent.show(handleButtonClick);
    }
  }

  textEditorLoadingFinishedHandler() {
    this.loadingActionIndex = null;
  }

  promptEditorShareClicked(e: CustomEvent<SharePromptMessage>) {
    if (!this.toastComponent) {
      throw Error('Toast is undefined.');
    }

    const prompt = e.detail.data;
    const stopLoader = e.detail.stopLoader;

    const handleShareClick = () => {
      this.remotePromptManager.sharePrompt(prompt).then(status => {
        stopLoader(status);
      });
    };

    // First check if the user has agreed the privacy policy
    const hasConfirmedPrivacy = localStorage.getItem('has-confirmed-privacy');
    if (hasConfirmedPrivacy === 'true') {
      handleShareClick();
    } else {
      if (!this.privacyDialogComponent) {
        throw Error('privacyDialogComponent is null');
      }
      this.privacyDialogComponent.show(handleShareClick);
    }
  }

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="wordflow">
        <div class="logo-container">
          <div class="left"></div>
          <div class="center">
            <a
              class="row"
              href="https://github.com/poloclub/wordflow"
              target="_blank"
            >
              <span class="svg-icon">${unsafeHTML(logoIcon)}</span>
              <span class="name">Wordflow</span>
            </a>
          </div>
          <div class="right"></div>
        </div>

        <div class="toast-container">
          <nightjar-toast
            id="toast-wordflow"
            message=${this.toastMessage}
            type=${this.toastType}
          ></nightjar-toast>
        </div>

        <div class="left-panel"></div>

        <div class="center-panel">
          <div class="editor-content">
            <wordflow-text-editor
              .popperSidebarBox=${this.popperSidebarBox}
              .floatingMenuBox=${this.floatingMenuBox}
              .updateSidebarMenu=${this.updateSidebarMenu}
              .promptManager=${this.promptManager}
              .userConfig=${this.userConfig}
              @loading-finished=${() => this.textEditorLoadingFinishedHandler()}
              @show-toast=${(e: CustomEvent<ToastMessage>) => {
                this.toastMessage = e.detail.message;
                this.toastType = e.detail.type;
                this.toastComponent?.show();
              }}
            ></wordflow-text-editor>
          </div>
        </div>

        <div class="right-panel"></div>

        <div
          class="popper-box popper-sidebar-menu hidden"
          id="popper-sidebar-box"
        >
          <wordflow-sidebar-menu
            id="right-sidebar-menu"
            @footer-button-clicked=${(e: CustomEvent<string>) =>
              this.sidebarMenuFooterButtonClickedHandler(e)}
          ></wordflow-sidebar-menu>
        </div>

        <div class="floating-menu-box hidden" id="floating-menu-box">
          <wordflow-floating-menu
            .popperTooltip=${this.popperTooltip}
            .loadingActionIndex=${this.loadingActionIndex}
            .favPrompts=${this.favPrompts}
            @mouse-enter-tools=${() => this.floatingMenuToolMouseEnterHandler()}
            @mouse-leave-tools=${() =>
              this.floatingMenuToolsMouseLeaveHandler()}
            @tool-button-clicked=${(
              e: CustomEvent<[PromptDataLocal, number]>
            ) => this.floatingMenuToolButtonClickHandler(e)}
            @setting-button-clicked=${() => {
              this.showSettingWindow = true;
            }}
          ></wordflow-floating-menu>
        </div>

        <wordflow-setting-window
          ?is-hidden=${!this.showSettingWindow}
          .promptManager=${this.promptManager}
          .localPrompts=${this.localPrompts}
          .favPrompts=${this.favPrompts}
          .remotePromptManager=${this.remotePromptManager}
          .remotePrompts=${this.remotePrompts}
          .popularTags=${this.popularTags}
          .userConfigManager=${this.userConfigManager}
          .userConfig=${this.userConfig}
          @close-button-clicked=${() => {
            this.showSettingWindow = false;
          }}
          @share-clicked=${(e: CustomEvent<SharePromptMessage>) =>
            this.promptEditorShareClicked(e)}
        ></wordflow-setting-window>

        <wordflow-privacy-dialog></wordflow-privacy-dialog>

        <div id="popper-tooltip" class="popper-tooltip hidden" role="tooltip">
          <span class="popper-content"></span>
          <div class="popper-arrow"></div>
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
    'wordflow-wordflow': WordflowWordflow;
  }
}

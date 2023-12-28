import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { PromptLetTextEditor } from '../text-editor/text-editor';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/config';
import { PromptManager } from './prompt-manager';
import { RemotePromptManager } from './remote-prompt-manager';

// Types
import type { SimpleEventMessage, PromptModel } from '../../types/common-types';
import type {
  Promptlet,
  PromptDataLocal,
  PromptDataRemote,
  TagData
} from '../../types/promptlet';
import type { VirtualElement } from '@floating-ui/dom';
import type { PromptLetSidebarMenu, Mode } from '../sidebar-menu/sidebar-menu';
import type { PromptLetFloatingMenu } from '../floating-menu/floating-menu';
import type { Editor } from '@tiptap/core';
import type { ModelAuthMessage } from '../modal-auth/modal-auth';
import type { PromptLetSettingWindow } from '../setting-window/setting-window';

// Components
import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import '../floating-menu/floating-menu';
import '../setting-window/setting-window';

// Assets
import componentCSS from './wordflow.css?inline';

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

/**
 * Wordflow element.
 *
 */
@customElement('promptlet-wordflow')
export class PromptLetWordflow extends LitElement {
  // ===== Class properties ======
  @queryAsync('#popper-sidebar-box')
  popperSidebarBox: Promise<HTMLElement> | undefined;

  @queryAsync('#floating-menu-box')
  floatingMenuBox: Promise<HTMLElement> | undefined;

  @queryAsync('#popper-tooltip')
  popperTooltip: Promise<HTMLElement> | undefined;

  @query('promptlet-text-editor')
  textEditorElement: PromptLetTextEditor | undefined;

  @query('.center-panel')
  centerPanelElement: HTMLElement | undefined;

  @query('.wordflow')
  workflowElement: HTMLElement | undefined;

  @state()
  showSettingWindow = false;

  @state()
  loadingActionIndex: number | null = null;

  @state()
  apiKey: string | null = null;

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

  lastUpdateSidebarMenuProps: UpdateSidebarMenuProps | null = null;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
    const model = 'gpt';
    this.apiKey = localStorage.getItem(`${model}APIKey`);

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
      localStorage.setItem('user-id', uuidv4());
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
      'promptlet-sidebar-menu'
    ) as PromptLetSidebarMenu;

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
      'promptlet-sidebar-menu'
    ) as PromptLetSidebarMenu;

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

  updateFloatingMenuXPos = async () => {
    if (
      this.centerPanelElement === undefined ||
      this.floatingMenuBox === undefined
    ) {
      console.error('centerPanelElement is undefined');
      return;
    }
    const containerBBox = this.centerPanelElement.getBoundingClientRect();
    const floatingMenuBox = await this.floatingMenuBox;
    floatingMenuBox.style.left = `${containerBBox.x + containerBBox.width}px`;
  };

  // ===== Event Methods ======
  resizeHandler() {
    this.updateSidebarMenuXPos(
      this.lastUpdateSidebarMenuProps
        ? this.lastUpdateSidebarMenuProps.boxPosition
        : 'left'
    );

    this.updateFloatingMenuXPos();
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

  floatingMenuToolButtonClickHandler(e: CustomEvent<[Promptlet, number]>) {
    if (this.workflowElement === undefined) {
      throw Error('workflowElement is undefined');
    }

    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    const [promptlet, index] = e.detail;
    this.textEditorElement.floatingMenuToolButtonClickHandler(promptlet);

    // Start the loading animation
    this.loadingActionIndex = index;
  }

  textEditorLoadingFinishedHandler() {
    this.loadingActionIndex = null;
  }

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="wordflow">
        <div class="left-panel"></div>
        <div class="center-panel">
          <div class="editor-content">
            <promptlet-text-editor
              .popperSidebarBox=${this.popperSidebarBox}
              .floatingMenuBox=${this.floatingMenuBox}
              .updateSidebarMenu=${this.updateSidebarMenu}
              .updateFloatingMenuXPos=${this.updateFloatingMenuXPos}
              .apiKey=${this.apiKey}
              @loading-finished=${() => this.textEditorLoadingFinishedHandler()}
            ></promptlet-text-editor>
          </div>
        </div>
        <div class="right-panel"></div>

        <div
          class="popper-box popper-sidebar-menu hidden"
          id="popper-sidebar-box"
        >
          <promptlet-sidebar-menu
            id="right-sidebar-menu"
            @footer-button-clicked=${(e: CustomEvent<string>) =>
              this.sidebarMenuFooterButtonClickedHandler(e)}
          ></promptlet-sidebar-menu>
        </div>

        <promptlet-modal-auth
          class="modal"
          @api-key-added=${(e: CustomEvent<ModelAuthMessage>) => {
            this.apiKey = e.detail.apiKey;
          }}
        ></promptlet-modal-auth>

        <div class="floating-menu-box hidden" id="floating-menu-box">
          <promptlet-floating-menu
            .popperTooltip=${this.popperTooltip}
            .loadingActionIndex=${this.loadingActionIndex}
            @mouse-enter-tools=${() => this.floatingMenuToolMouseEnterHandler()}
            @mouse-leave-tools=${() =>
              this.floatingMenuToolsMouseLeaveHandler()}
            @tool-button-clicked=${(e: CustomEvent<[Promptlet, number]>) =>
              this.floatingMenuToolButtonClickHandler(e)}
            @setting-button-clicked=${() => {
              this.showSettingWindow = true;
            }}
          ></promptlet-floating-menu>
        </div>

        <promptlet-setting-window
          ?is-hidden=${!this.showSettingWindow}
          .promptManager=${this.promptManager}
          .localPrompts=${this.localPrompts}
          .favPrompts=${this.favPrompts}
          .remotePromptManager=${this.remotePromptManager}
          .remotePrompts=${this.remotePrompts}
          .popularTags=${this.popularTags}
          @close-button-clicked=${() => {
            this.showSettingWindow = false;
          }}
        ></promptlet-setting-window>

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
    'promptlet-wordflow': PromptLetWordflow;
  }
}

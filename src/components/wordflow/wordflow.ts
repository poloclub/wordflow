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
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { config } from '../../config/config';

// Types
import type { SimpleEventMessage, PromptModel } from '../../types/common-types';
import type { Promptlet } from '../../types/promptlet';
import type { VirtualElement } from '@floating-ui/dom';
import type { PromptLetSidebarMenu, Mode } from '../sidebar-menu/sidebar-menu';
import type { PromptLetFloatingMenu } from '../floating-menu/floating-menu';

// Components
import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import '../floating-menu/floating-menu';

// Assets
import componentCSS from './wordflow.css?inline';

// Constants
const MENU_X_OFFSET = config.layout.sidebarMenuXOffset;

export interface UpdateSidebarMenuProps {
  anchor: Element | VirtualElement;
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

  lastUpdateSidebarMenuProps: UpdateSidebarMenuProps | null = null;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
  }

  firstUpdated() {
    // Observe the app's content size and update menu positions accordingly
    const observer = new ResizeObserver(() => {
      this.resizeHandler();
    });

    const workflowElement = this.renderRoot.querySelector(
      '.wordflow'
    ) as HTMLElement;
    observer.observe(workflowElement);
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  initData = async () => {};

  /**
   * Update the sidebar menu position and content
   */
  updateSidebarMenu = async ({
    anchor,
    boxPosition,
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
      mode: menuElement.mode,
      oldText: menuElement.oldText,
      newText: menuElement.newText
    };

    computePosition(anchor, popperElement, {
      placement: 'right',
      middleware: [offset(0), flip(), shift()]
    }).then(({ y }) => {
      this.updateSidebarMenuXPos(boxPosition);
      popperElement.style.top = `${y}px`;
    });
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

  async updateFloatingMenuXPos() {
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
  }

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

  floatingMenuToolButtonClickHandler(e: CustomEvent<Promptlet>) {
    // Delegate the event to the text editor component
    if (!this.textEditorElement) return;
    this.textEditorElement.floatingMenuToolButtonClickHandler(e.detail);
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
          @api-key-added=${(e: CustomEvent<SimpleEventMessage>) => {}}
        ></promptlet-modal-auth>

        <div class="floating-menu-box hidden" id="floating-menu-box">
          <promptlet-floating-menu
            .popperTooltip=${this.popperTooltip}
            @mouse-enter-tools=${() => this.floatingMenuToolMouseEnterHandler()}
            @mouse-leave-tools=${() =>
              this.floatingMenuToolsMouseLeaveHandler()}
            @tool-button-clicked=${(e: CustomEvent<Promptlet>) =>
              this.floatingMenuToolButtonClickHandler(e)}
          ></promptlet-floating-menu>
        </div>

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

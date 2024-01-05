import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getEmptyPromptDataRemote } from '../panel-community/panel-community';
import { PromptManager } from '../wordflow/prompt-manager';
import { v4 as uuidv4 } from 'uuid';
import {
  tooltipMouseEnter,
  tooltipMouseLeave,
  TooltipConfig
} from '@xiaohk/utils';

import '../prompt-card/prompt-card';
import '../pagination/pagination';
import '../prompt-editor/prompt-editor';
import '../confirm-dialog/confirm-dialog';

// Types
import type { PromptDataLocal, PromptDataRemote } from '../../types/wordflow';
import type { SharePromptMessage } from '../prompt-editor/prompt-editor';
import type { WordflowPromptCard } from '../prompt-card/prompt-card';
import type {
  NightjarConfirmDialog,
  DialogInfo
} from '../confirm-dialog/confirm-dialog';

// Assets
import componentCSS from './panel-local.css?inline';
import searchIcon from '../../images/icon-search.svg?raw';
import crossIcon from '../../images/icon-cross-thick.svg?raw';
import crossSmallIcon from '../../images/icon-cross.svg?raw';
import sortIcon from '../../images/icon-decrease.svg?raw';
import deleteIcon from '../../images/icon-delete.svg?raw';
import editIcon from '../../images/icon-edit-pen.svg?raw';
import addIcon from '../../images/icon-plus-circle.svg?raw';
import fakePromptsJSON from '../../data/fake-prompts-100.json';

// Constants
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

const promptCountIncrement = 20;

/**
 * Panel local element.
 *
 */
@customElement('wordflow-panel-local')
export class WordflowPanelLocal extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptManager!: PromptManager;

  @property({ attribute: false })
  localPrompts: PromptDataLocal[] = [];

  @state()
  totalLocalPrompts = 0;

  @property({ attribute: false })
  favPrompts: [
    PromptDataLocal | null,
    PromptDataLocal | null,
    PromptDataLocal | null
  ] = [null, null, null];

  @state()
  maxPromptCount = 24;

  @state()
  isDraggingPromptCard = false;

  @state()
  hoveringPromptCardIndex: number | null = null;

  @state()
  hoveringFavPromptCardIndex: number | null = null;

  @state()
  selectedPrompt: PromptDataLocal | null = fakePrompts[0];

  @state()
  shouldCreateNewPrompt = false;

  showSearchBarCancelButton = false;

  @query('.prompt-content')
  promptContentElement: HTMLElement | undefined;

  @query('.prompt-container')
  promptContainerElement: HTMLElement | undefined;

  @query('.prompt-loader')
  promptLoaderElement: HTMLElement | undefined;

  @query('.prompt-modal')
  promptModalElement: HTMLDialogElement | undefined;

  @query('#popper-tooltip-local')
  popperElement: HTMLElement | undefined;
  tooltipConfig: TooltipConfig | null = null;

  @query('nightjar-confirm-dialog')
  confirmDialogComponent: NightjarConfirmDialog | undefined;

  draggingImageElement: HTMLElement | null = null;

  searchBarDebounceTimer: number | null = null;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
  }

  firstUpdated() {
    // Bind the tooltip
    if (this.popperElement) {
      this.tooltipConfig = {
        tooltipElement: this.popperElement,
        mouseenterTimer: null,
        mouseleaveTimer: null
      };
    }
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

  promptCardClicked(promptData: PromptDataLocal) {
    if (
      this.promptModalElement === undefined ||
      this.promptContentElement === undefined
    ) {
      throw Error('promptModalElement is undefined.');
    }
    this.shouldCreateNewPrompt = false;
    this.selectedPrompt = promptData;
    this.promptModalElement.style.setProperty(
      'top',
      `${this.promptContentElement.scrollTop}px`
    );
    this.promptModalElement.classList.remove('hidden');
  }

  /**
   * Event handler for scroll event. Load more items when the user scrolls to
   * the bottom.
   */
  async promptContainerScrolled() {
    if (
      this.promptContainerElement === undefined ||
      this.promptLoaderElement === undefined
    ) {
      throw Error('promptContainerElement is undefined');
    }

    const isAtBottom =
      this.promptContainerElement.scrollHeight -
        this.promptContainerElement.scrollTop <=
      this.promptContainerElement.clientHeight + 5;

    if (isAtBottom && this.maxPromptCount < this.localPrompts.length) {
      // Keep track the original scroll position
      const previousScrollTop = this.promptContainerElement.scrollTop;

      // Show the loader for a while
      this.promptLoaderElement.classList.remove('hidden', 'no-display');

      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 800);
      });
      this.maxPromptCount += promptCountIncrement;
      await this.updateComplete;

      // Hide the loader
      this.promptLoaderElement.classList.add('hidden');

      // Restore the scroll position
      this.promptContainerElement.scrollTop = previousScrollTop;
    }

    if (this.maxPromptCount >= this.localPrompts.length) {
      this.promptLoaderElement.classList.add('no-display');
    }
  }

  /**
   * Event handler for drag starting from the prompt card
   * @param e Drag event
   */
  promptCardDragStarted(e: DragEvent) {
    this.isDraggingPromptCard = true;
    const target = e.target as WordflowPromptCard;
    target.classList.add('dragging');
    document.body.style.setProperty('cursor', 'grabbing');

    this.hoveringPromptCardIndex = null;

    // Set the current prompt to data transfer
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData(
        'newPromptData',
        JSON.stringify(target.promptData)
      );
    }

    // Mimic the current slot width
    let slotWidth = 200;
    if (this.shadowRoot) {
      const favPrompt = this.shadowRoot.querySelector(
        '.fav-prompt-slot'
      ) as HTMLElement;
      slotWidth = favPrompt.getBoundingClientRect().width;
    }

    // Set the dragging image
    const tempFavSlot = document.createElement('div');
    tempFavSlot.classList.add('fav-prompt-slot');
    tempFavSlot.setAttribute('is-temp', 'true');
    tempFavSlot.style.setProperty('width', `${slotWidth}px`);

    const miniCard = document.createElement('div');
    miniCard.classList.add('prompt-mini-card');

    const icon = document.createElement('span');
    icon.classList.add('icon');
    icon.innerText = target.promptData.icon;

    const title = document.createElement('span');
    title.classList.add('title');
    title.innerText = target.promptData.title;

    miniCard.appendChild(icon);
    miniCard.appendChild(title);
    tempFavSlot.appendChild(miniCard);

    // Need to add the temp element to body, because it seems safari has some
    // problems when using elements in a shadow element as drag image
    document.body.appendChild(tempFavSlot);
    this.draggingImageElement = tempFavSlot;
    e.dataTransfer?.setDragImage(tempFavSlot, 10, 10);
  }

  /**
   * Event handler for drag ending from the prompt card
   * @param e Drag event
   */
  promptCardDragEnded(e: DragEvent) {
    this.isDraggingPromptCard = false;
    const target = e.target as WordflowPromptCard;
    target.classList.remove('dragging');
    document.body.style.removeProperty('cursor');

    // Remove the temporary slot element
    this.draggingImageElement?.remove();
    this.draggingImageElement = null;
  }

  favPromptSlotDragEntered(e: DragEvent) {
    const currentTarget = e.currentTarget as HTMLDivElement;
    currentTarget.classList.add('drag-over');
  }

  favPromptSlotDragLeft(e: DragEvent) {
    const currentTarget = e.currentTarget as HTMLDivElement;
    currentTarget.classList.remove('drag-over');
  }

  /**
   * Copy prompt data to the favorite prompt slot
   * @param e Drag event
   * @param index Index of the current fav prompt slot
   */
  favPromptSlotDropped(e: DragEvent, index: number) {
    if (e.dataTransfer) {
      const newPromptDataString = e.dataTransfer.getData('newPromptData');
      const newPromptData = JSON.parse(newPromptDataString) as PromptDataLocal;
      this.favPrompts[index] = newPromptData;
      const newFavPrompts = structuredClone(this.favPrompts);
      newFavPrompts[index] = newPromptData;
      this.promptManager.setFavPrompt(index, newPromptData);
    }

    // Cancel the drag event because dragleave would not be fired after drop
    const currentTarget = e.currentTarget as HTMLDivElement;
    currentTarget.classList.remove('drag-over');
    e.preventDefault();
  }

  promptCardMouseEntered(e: MouseEvent, index: number) {
    e.preventDefault();
    this.hoveringPromptCardIndex = index;
  }

  promptCardMouseLeft(e: MouseEvent) {
    e.preventDefault();
    this.hoveringPromptCardIndex = null;
  }

  modalCloseClickHandler() {
    if (this.promptModalElement === undefined) {
      throw Error('promptModalElement is undefined.');
    }
    this.promptModalElement.classList.add('hidden');
  }

  creteButtonClicked() {
    if (this.promptModalElement === undefined) {
      throw Error('promptModalElement is undefined.');
    }
    this.selectedPrompt = getEmptyPromptDataLocal();
    this.shouldCreateNewPrompt = true;
    this.promptModalElement.classList.remove('hidden');
  }

  sortOptionChanged(e: InputEvent) {
    const selectElement = e.currentTarget as HTMLInputElement;
    const sortOption = selectElement.value;
    if (
      sortOption === 'created' ||
      sortOption === 'name' ||
      sortOption === 'runCount'
    ) {
      this.promptManager.sortPrompts(sortOption);
    }
  }

  /**
   * Event handler for mouse entering the menu bar button
   * @param e Mouse event
   * @param button Button name
   */
  menuIconMouseEntered(e: MouseEvent, button: 'edit' | 'delete' | 'remove') {
    const target = e.currentTarget as HTMLElement;

    let content = '';
    switch (button) {
      case 'edit': {
        content = 'Edit';
        break;
      }
      case 'delete': {
        content = 'Delete';
        break;
      }
      case 'remove': {
        content = 'Remove favorite prompt';
        break;
      }
      default: {
        console.error(`Unknown button ${button}`);
      }
    }

    tooltipMouseEnter(e, content, 'top', this.tooltipConfig, 200, target, 10);
  }

  /**
   * Event handler for mouse leaving the info icon in each filed
   */
  menuIconMouseLeft() {
    tooltipMouseLeave(this.tooltipConfig, 0);
  }

  /**
   * Delete the current prompt.
   */
  menuDeleteClicked(promptData: PromptDataLocal) {
    if (this.confirmDialogComponent === undefined) {
      throw Error('confirmDialogComponent is undefined');
    }

    const dialogInfo: DialogInfo = {
      header: 'Delete Prompt',
      message:
        'Are you sure you want to delete this prompt? This action cannot be undone.',
      yesButtonText: 'Delete',
      actionKey: 'delete-prompt-local'
    };

    this.confirmDialogComponent.show(dialogInfo, () => {
      this.promptManager.deletePrompt(promptData);
    });
  }

  /**
   * Handler for the search bar input event
   * @param e Input event
   */
  searchBarEntered(e: InputEvent) {
    const inputElement = e.currentTarget as HTMLInputElement;
    const query = inputElement.value;
    if (query.length > 0) {
      if (!this.showSearchBarCancelButton) {
        // Record the total number of local prompts
        this.totalLocalPrompts = this.localPrompts.length;
      }

      this.showSearchBarCancelButton = true;
    } else {
      this.showSearchBarCancelButton = false;
    }

    if (this.searchBarDebounceTimer !== null) {
      clearTimeout(this.searchBarDebounceTimer);
      this.searchBarDebounceTimer = null;
    }

    this.searchBarDebounceTimer = setTimeout(() => {
      this.promptManager.searchPrompt(query);
      this.searchBarDebounceTimer = null;
    }, 150);
  }

  /**
   * Handler for the search bar cancel click event
   */
  showSearchBarCancelButtonClicked() {
    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null.');
    }

    const inputElement = this.shadowRoot.querySelector(
      '#search-bar-input'
    ) as HTMLInputElement;
    inputElement.value = '';
    this.showSearchBarCancelButton = false;

    if (this.searchBarDebounceTimer !== null) {
      clearTimeout(this.searchBarDebounceTimer);
      this.searchBarDebounceTimer = null;
    }

    this.searchBarDebounceTimer = setTimeout(() => {
      this.promptManager.searchPrompt('');
      this.searchBarDebounceTimer = null;
    }, 150);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the prompt cards
    let promptCards = html``;
    for (const [i, promptData] of this.localPrompts
      .slice(0, Math.min(this.maxPromptCount, this.localPrompts.length))
      .entries()) {
      promptCards = html`${promptCards}
        <div
          class="prompt-card-container"
          @mouseenter=${(e: MouseEvent) => {
            this.promptCardMouseEntered(e, i);
          }}
          @mouseleave=${(e: MouseEvent) => {
            this.promptCardMouseLeft(e);
          }}
        >
          <div
            class="prompt-card-menu"
            ?is-hidden="${this.hoveringPromptCardIndex !== i}"
          >
            <button
              class="edit-button"
              @mouseenter=${(e: MouseEvent) =>
                this.menuIconMouseEntered(e, 'edit')}
              @mouseleave=${() => this.menuIconMouseLeft()}
              @click=${() => {
                this.promptCardClicked(promptData);
              }}
            >
              <span class="svg-icon">${unsafeHTML(editIcon)}</span>
            </button>

            <button
              class="delete-button"
              @mouseenter=${(e: MouseEvent) =>
                this.menuIconMouseEntered(e, 'delete')}
              @mouseleave=${() => this.menuIconMouseLeft()}
              @click=${() => {
                this.menuDeleteClicked(promptData);
              }}
            >
              <span class="svg-icon">${unsafeHTML(deleteIcon)}</span>
            </button>
          </div>

          <wordflow-prompt-card
            draggable="true"
            .promptData=${promptData}
            .isLocalPrompt=${true}
            @click=${() => {
              this.promptCardClicked(promptData);
            }}
            @dragstart=${(e: DragEvent) => {
              this.promptCardDragStarted(e);
            }}
            @dragend=${(e: DragEvent) => {
              this.promptCardDragEnded(e);
            }}
          ></wordflow-prompt-card>
        </div>`;
    }

    // Compose the fav prompts
    let favPrompts = html``;
    for (const [i, favPrompt] of this.favPrompts.entries()) {
      favPrompts = html`${favPrompts}
        <div
          class="fav-prompt-slot"
          @dragenter=${(e: DragEvent) => {
            this.favPromptSlotDragEntered(e);
          }}
          @dragleave=${(e: DragEvent) => {
            this.favPromptSlotDragLeft(e);
          }}
          @dragover=${(e: DragEvent) => {
            e.preventDefault();
          }}
          @drop=${(e: DragEvent) => {
            this.favPromptSlotDropped(e, i);
          }}
          @mouseenter=${() => {
            this.hoveringFavPromptCardIndex = i;
          }}
          @mouseleave=${() => {
            this.hoveringFavPromptCardIndex = null;
          }}
        >
          <div
            class="prompt-card-menu"
            ?is-hidden="${this.hoveringFavPromptCardIndex !== i ||
            favPrompt === null}"
          >
            <button
              class="edit-button"
              @mouseenter=${(e: MouseEvent) =>
                this.menuIconMouseEntered(e, 'edit')}
              @mouseleave=${() => this.menuIconMouseLeft()}
              @click=${() => {
                this.promptCardClicked(favPrompt!);
              }}
            >
              <span class="svg-icon">${unsafeHTML(editIcon)}</span>
            </button>

            <button
              class="remove-button"
              @mouseenter=${(e: MouseEvent) =>
                this.menuIconMouseEntered(e, 'remove')}
              @mouseleave=${() => this.menuIconMouseLeft()}
              @click=${() => {
                this.promptManager.setFavPrompt(i, null);
              }}
            >
              <span class="svg-icon">${unsafeHTML(crossSmallIcon)}</span>
            </button>
          </div>

          <div class="prompt-mini-card" ?is-empty=${favPrompt === null}>
            <span class="icon">${favPrompt ? favPrompt.icon : ''}</span>
            <span class="title"
              >${favPrompt ? favPrompt.title : 'Drag a prompt here'}</span
            >
          </div>
        </div>`;
    }

    // Compose the prompt count label
    let promptCountLabel = html`${this.promptManager.localPromptCount} Prompts`;

    if (this.showSearchBarCancelButton) {
      promptCountLabel = html`${this.promptManager.localPromptBroadcastCount} /
      ${this.promptManager.localPromptCount} Prompts`;
    }

    return html`
      <div class="panel-local" ?is-dragging=${this.isDraggingPromptCard}>
        <div class="prompt-panel">
          <div class="search-panel">
            <div class="search-group">
              <div class="result">${promptCountLabel}</div>

              <button
                class="create-button"
                @click=${() => this.creteButtonClicked()}
              >
                <span class="svg-icon">${unsafeHTML(addIcon)}</span>New Prompt
              </button>
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
                  @input=${(e: InputEvent) => this.searchBarEntered(e)}
                  placeholder="Search my prompts"
                />

                <span
                  class="icon-container"
                  @click=${() => this.showSearchBarCancelButtonClicked()}
                  ?is-hidden=${!this.showSearchBarCancelButton}
                >
                  <span class="svg-icon cross">${unsafeHTML(crossIcon)}</span>
                </span>
              </div>

              <div class="sort-button">
                <span class="svg-icon">${unsafeHTML(sortIcon)}</span>
                <select
                  class="sort-selection"
                  @input=${(e: InputEvent) => this.sortOptionChanged(e)}
                >
                  <option value="created">Recency</option>
                  <option value="name">Name</option>
                  <option value="runCount">Run Count</option>
                </select>
              </div>
            </div>
          </div>

          <div class="prompt-content">
            <div
              class="prompt-container"
              @scroll=${() => {
                this.promptContainerScrolled();
              }}
            >
              ${promptCards}

              <div class="prompt-loader hidden">
                <div class="loader-container">
                  <div class="circle-loader"></div>
                </div>
              </div>
            </div>

            <div class="fav-panel">
              <div class="header">
                <span class="title">Favorite Prompts</span>
                <span class="description"
                  >Drag prompts here to customize the toolbar</span
                >
              </div>

              <div class="fav-prompts">${favPrompts}</div>
            </div>

            <div class="prompt-modal hidden">
              <wordflow-prompt-editor
                .promptData=${this.selectedPrompt
                  ? this.selectedPrompt
                  : getEmptyPromptDataLocal()}
                .isNewPrompt=${this.shouldCreateNewPrompt}
                .promptManager=${this.promptManager}
                @close-clicked=${() => this.modalCloseClickHandler()}
              ></wordflow-prompt-editor>
            </div>
          </div>
        </div>

        <nightjar-confirm-dialog></nightjar-confirm-dialog>

        <div
          id="popper-tooltip-local"
          class="popper-tooltip hidden"
          role="tooltip"
        >
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
    'wordflow-panel-local': WordflowPanelLocal;
  }
}

export const getEmptyPromptDataLocal = () => {
  const dataRemote = getEmptyPromptDataRemote();
  const dataLocal: PromptDataLocal = { ...dataRemote, key: uuidv4() };
  return dataLocal;
};

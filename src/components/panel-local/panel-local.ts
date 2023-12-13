import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '../prompt-card/prompt-card';
import '../pagination/pagination';

// Types
import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';
import type { PromptLetPromptCard } from '../prompt-card/prompt-card';

import componentCSS from './panel-local.css?inline';
import searchIcon from '../../images/icon-search.svg?raw';
import crossIcon from '../../images/icon-cross-thick.svg?raw';
import sortIcon from '../../images/icon-decrease.svg?raw';

import fakePromptsJSON from '../../data/fake-prompts-100.json';

// Constants
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

const promptCountIncrement = 20;

/**
 * Panel local element.
 *
 */
@customElement('promptlet-panel-local')
export class PromptLetPanelLocal extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @state()
  allPrompts: PromptDataLocal[] = [];

  @state()
  maxPromptCount = 18;

  @state()
  isDraggingPromptCard = false;

  @query('.prompt-container')
  promptContainerElement: HTMLElement | undefined;

  @query('.prompt-loader')
  promptLoaderElement: HTMLElement | undefined;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.allPrompts = fakePrompts.slice(0, 33);
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

  promptCardClicked(promptData: PromptDataRemote) {
    // if (
    //   this.promptModalElement === undefined ||
    //   this.promptContentElement === undefined
    // ) {
    //   throw Error('promptModalElement is undefined.');
    // }
    // this.selectedPrompt = promptData;
    // this.promptModalElement.style.setProperty(
    //   'top',
    //   `${this.promptContentElement.scrollTop}px`
    // );
    // this.promptModalElement.classList.remove('hidden');
    // // Disable scrolling
    // this.promptContentElement.classList.add('no-scroll');
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

    if (isAtBottom && this.maxPromptCount < this.allPrompts.length) {
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

    if (this.maxPromptCount >= this.allPrompts.length) {
      this.promptLoaderElement.classList.add('no-display');
    }
  }

  promptCardDragStarted(e: DragEvent) {
    this.isDraggingPromptCard = true;
    const target = e.target as PromptLetPromptCard;
    target.classList.add('dragging');
    console.log('start dragging');
    document.body.style.setProperty('cursor', 'grabbing');
  }

  promptCardDragEnded(e: DragEvent) {
    this.isDraggingPromptCard = false;
    const target = e.target as PromptLetPromptCard;
    target.classList.remove('dragging');
    console.log('end dragging');
    document.body.style.removeProperty('cursor');
  }

  favPromptSlotDragEntered(e: DragEvent) {
    const currentTarget = e.currentTarget as HTMLDivElement;
    currentTarget.classList.add('drag-over');
  }

  favPromptSlotDragLeft(e: DragEvent) {
    const currentTarget = e.currentTarget as HTMLDivElement;
    currentTarget.classList.remove('drag-over');
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
    for (const curPromptData of this.allPrompts.slice(
      0,
      Math.min(this.maxPromptCount, this.allPrompts.length)
    )) {
      const promptData = curPromptData as PromptDataRemote;
      promptCards = html`${promptCards}
        <promptlet-prompt-card
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
        ></promptlet-prompt-card> `;
    }

    return html`
      <div class="panel-local" ?is-dragging=${this.isDraggingPromptCard}>
        <div class="prompt-panel">
          <div class="search-panel">
            <div class="search-group">
              <div class="result">${this.allPrompts.length} Prompts</div>

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
        </div>

        <div class="fav-panel">
          <div class="header">
            <span class="title">Favorite Prompts</span>
            <span class="description"
              >Drag prompts here to customize the toolbar</span
            >
          </div>

          <div class="fav-prompts">
            <div
              class="fav-prompt-slot"
              @dragenter=${(e: DragEvent) => {
                this.favPromptSlotDragEntered(e);
              }}
              @dragleave=${(e: DragEvent) => {
                this.favPromptSlotDragLeft(e);
              }}
            >
              <div class="prompt-mini-card">
                <span class="icon">${this.allPrompts[0].icon}</span>
                <span class="title">${this.allPrompts[0].title}</span>
              </div>
            </div>

            <div class="fav-prompt-slot">
              <div class="prompt-mini-card">
                <span class="icon">${this.allPrompts[1].icon}</span>
                <span class="title">${this.allPrompts[1].title}</span>
              </div>
            </div>

            <div class="fav-prompt-slot">
              <div class="prompt-mini-card">
                <span class="icon">${this.allPrompts[2].icon}</span>
                <span class="title">${this.allPrompts[2].title}</span>
              </div>
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
    'promptlet-panel-local': PromptLetPanelLocal;
  }
}

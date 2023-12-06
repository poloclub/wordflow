import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '../prompt-card/prompt-card';
import '../pagination/pagination';

// Types
import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';

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
        }, 1000);
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
          .promptData=${promptData}
          .isLocalPrompt=${true}
          @click=${() => {
            this.promptCardClicked(promptData);
          }}
        ></promptlet-prompt-card> `;
    }

    return html`
      <div class="panel-local">
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
            <div class="fav-prompt-slot">Prompt 1</div>
            <div class="fav-prompt-slot">Prompt 2</div>
            <div class="fav-prompt-slot">Prompt 3</div>
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

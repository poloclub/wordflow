import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Components
import '../prompt-card/prompt-card';
import '../pagination/pagination';
import '../prompt-viewer/prompt-viewer';

// Types
import type { PromptDataRemote } from '../../types/promptlet';

// Assets
import componentCSS from './panel-community.css?inline';
import expandIcon from '../../images/icon-more-circle.svg?raw';
import shrinkIcon from '../../images/icon-shrink.svg?raw';
import crossIcon from '../../images/icon-cross.svg?raw';

import fakePromptsJSON from '../../data/fake-prompts-100.json';

// Constants
const NUM_CARDS_PER_PAGE = 18;
const PAGINATION_WINDOW = 5;

const fakePrompts = fakePromptsJSON as PromptDataRemote[];

/**
 * Panel community element.
 *
 */
@customElement('promptlet-panel-community')
export class PromptLetPanelCommunity extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @state()
  allPrompts: PromptDataRemote[] = fakePrompts;

  @state()
  selectedPrompt: PromptDataRemote | null = fakePrompts[0];

  @state()
  curMode: 'popular' | 'new' = 'popular';

  @state()
  popularTags: string[] = [];

  @state()
  maxTagsOneLine = 3;

  @state()
  isPopularTagListExpanded = false;

  @state()
  curSelectedTag = '';

  @state()
  curPage = 1;

  @query('.popular-tags')
  popularTagsElement: HTMLElement | undefined;

  @query('.panel-community')
  panelElement: HTMLElement | undefined;

  @query('.prompt-content')
  promptContentElement: HTMLElement | undefined;

  @query('.prompt-modal')
  promptModalElement: HTMLDialogElement | undefined;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.popularTags = [
      'writing',
      'research',
      'professional',
      'simplification',
      'science',
      'technology',
      'art',
      'music',
      'history',
      'literature',
      'mathematics',
      'programming',
      'design',
      'photography',
      'biology',
      'chemistry',
      'physics',
      'psychology',
      'philosophy',
      'business',
      'economics',
      'politics',
      'environment',
      'health',
      'fitness',
      'food',
      'travel',
      'sports',
      'fashion',
      'culture',
      'education',
      'language'
    ];
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  firstUpdated() {
    this.initMaxTagsOneLine();
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  /**
   * Determine how many popular tags to show so that the tags element has only one line
   */
  initMaxTagsOneLine() {
    if (!this.popularTagsElement || !this.panelElement) {
      throw Error('A queried element is not initialized.');
    }

    const tagsBBox = this.popularTagsElement.getBoundingClientRect();
    const tempTags = document.createElement('div');
    this.panelElement.appendChild(tempTags);

    tempTags.style.setProperty('visibility', 'hidden');
    tempTags.style.setProperty('position', 'absolute');
    tempTags.style.setProperty('width', `${tagsBBox.width}px`);
    tempTags.classList.add('popular-tags');

    const specialTag = document.createElement('span');
    specialTag.classList.add('tag', 'expand-tag');
    specialTag.innerHTML = `
    <span class="svg-icon"
        >${this.isPopularTagListExpanded ? shrinkIcon : expandIcon}</span
      >
    more`;
    tempTags.appendChild(specialTag);

    const initHeight = tempTags.getBoundingClientRect().height;

    for (let i = 0; i < this.popularTags.length; i++) {
      const curTag = document.createElement('tag');
      curTag.classList.add('tag');
      curTag.innerText = this.popularTags[i];
      tempTags.appendChild(curTag);
      const curHeight = tempTags.getBoundingClientRect().height;
      if (curHeight > initHeight) {
        if (this.maxTagsOneLine !== i) {
          this.maxTagsOneLine = i;
        }
        break;
      }
    }

    tempTags.remove();
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  popularTagListToggled() {
    this.isPopularTagListExpanded = !this.isPopularTagListExpanded;
  }

  tagClicked(tag: string) {
    if (this.curSelectedTag === tag) {
      this.curSelectedTag = '';
    } else {
      this.curSelectedTag = tag;
    }
  }

  promptCardTagClickedHandler(e: CustomEvent<string>) {
    this.tagClicked(e.detail);
  }

  pageClickedHandler(e: CustomEvent<number>) {
    if (this.promptContentElement === undefined) {
      throw Error('promptContentElement undefined');
    }

    if (e.detail !== this.curPage) {
      this.curPage = e.detail;

      // Scroll to the top
      this.promptContentElement.scrollTop = 0;
    }
  }

  promptCardClicked(promptData: PromptDataRemote) {
    if (
      this.promptModalElement === undefined ||
      this.promptContentElement === undefined
    ) {
      throw Error('promptModalElement is undefined.');
    }

    this.selectedPrompt = promptData;
    this.promptModalElement.style.setProperty(
      'top',
      `${this.promptContentElement.scrollTop}px`
    );
    this.promptModalElement.classList.remove('hidden');

    // Disable scrolling
    this.promptContentElement.classList.add('no-scroll');
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Create the tag list
    let popularTagList = html``;
    const curMaxTag = this.isPopularTagListExpanded
      ? this.popularTags.length
      : this.maxTagsOneLine;

    for (const tag of this.popularTags.slice(0, curMaxTag)) {
      popularTagList = html`${popularTagList}
        <span
          class="tag"
          ?is-selected="${this.curSelectedTag === tag}"
          @click=${() => this.tagClicked(tag)}
          >${tag}</span
        >`;
    }

    const specialTag = html`<span
      class="tag expand-tag"
      @click=${() => {
        this.popularTagListToggled();
      }}
      ><span class="svg-icon"
        >${unsafeHTML(
          this.isPopularTagListExpanded ? shrinkIcon : expandIcon
        )}</span
      >
      ${this.isPopularTagListExpanded ? 'less' : 'more'}</span
    >`;

    // Compose the prompt cards
    let promptCards = html``;
    for (let i = 0; i < NUM_CARDS_PER_PAGE; i++) {
      const curIndex = (this.curPage - 1) * NUM_CARDS_PER_PAGE + i;
      if (curIndex > this.allPrompts.length - 1) {
        break;
      }
      const curPromptData = this.allPrompts[curIndex];
      promptCards = html`${promptCards}
        <promptlet-prompt-card
          .promptData=${curPromptData}
          .curSelectedTag=${this.curSelectedTag}
          @click=${() => {
            this.promptCardClicked(curPromptData);
          }}
          @tag-clicked=${(e: CustomEvent<string>) =>
            this.promptCardTagClickedHandler(e)}
        ></promptlet-prompt-card> `;
    }

    return html`
      <div class="panel-community">
        <div class="header">
          <div class="header-top">
            <span class="name">205 Prompts</span>
            <span class="filter" ?is-hidden=${this.curSelectedTag === ''}
              >tagged
              <span
                class="tag show-cross"
                is-selected=""
                @click=${() => this.tagClicked(this.curSelectedTag)}
                >${this.curSelectedTag}
                <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
              </span></span
            >
            <div class="header-toggle">
              <span
                @click=${() => {
                  this.curMode = 'popular';
                }}
                ?is-active=${this.curMode === 'popular'}
                >Popular</span
              >
              <span
                @click=${() => {
                  this.curMode = 'new';
                }}
                ?is-active=${this.curMode === 'new'}
                >New</span
              >
            </div>
          </div>
          <div class="header-bottom">
            <div class="header-tag-list">
              <span class="name">Popular tags</span>
              <div class="popular-tags">${popularTagList} ${specialTag}</div>
            </div>
          </div>
        </div>

        <div class="prompt-content">
          <div class="prompt-container">${promptCards}</div>

          <div class="pagination">
            <promptlet-pagination
              curPage=${this.curPage}
              totalPageNum=${Math.ceil(
                this.allPrompts.length / NUM_CARDS_PER_PAGE
              )}
              pageWindowSize=${PAGINATION_WINDOW}
              @page-clicked=${(e: CustomEvent<number>) =>
                this.pageClickedHandler(e)}
            ></promptlet-pagination>
          </div>

          <div class="prompt-modal hidden">
            <promptlet-prompt-viewer
              .promptData=${this.selectedPrompt
                ? this.selectedPrompt
                : getEmptyPromptDataRemote()}
            ></promptlet-prompt-viewer>
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
    'promptlet-panel-community': PromptLetPanelCommunity;
  }
}

export const getEmptyPromptDataRemote = () => {
  const data: PromptDataRemote = {
    prompt: '',
    tags: [],
    temperature: 0.2,
    userID: '',
    userName: '',
    description: '',
    icon: '',
    forkFrom: '',
    promptRunCount: 0,
    created: new Date().toISOString(),
    title: '',
    outputParsingPattern: '',
    outputParsingReplacement: '',
    recommendedModels: [],
    injectionMode: 'replace'
  };
  return data;
};

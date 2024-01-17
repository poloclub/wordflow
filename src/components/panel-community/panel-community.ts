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
import { PromptManager } from '../wordflow/prompt-manager';
import { RemotePromptManager } from '../wordflow/remote-prompt-manager';
import { v4 as uuidv4 } from 'uuid';
import { setsAreEqual } from '@xiaohk/utils';

// Components
import '../prompt-card/prompt-card';
import '../pagination/pagination';
import '../prompt-viewer/prompt-viewer';

// Types
import type { PromptDataRemote, TagData } from '../../types/wordflow';

// Assets
import componentCSS from './panel-community.css?inline';
import expandIcon from '../../images/icon-more-circle.svg?raw';
import shrinkIcon from '../../images/icon-shrink.svg?raw';
import crossIcon from '../../images/icon-cross.svg?raw';

// Constants
const NUM_CARDS_PER_PAGE = 18;
const PAGINATION_WINDOW = 4;
const MAX_POPULAR_TAGS = 30;

/**
 * Panel community element.
 *
 */
@customElement('wordflow-panel-community')
export class WordflowPanelCommunity extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  remotePromptManager!: RemotePromptManager;

  @property({ attribute: false })
  remotePrompts: PromptDataRemote[] = [];

  @property({ attribute: false })
  popularTags: TagData[] = [];

  @property({ type: Boolean })
  'is-shown' = false;

  @state()
  selectedPrompt: PromptDataRemote | null = null;

  @state()
  curMode: 'popular' | 'new' = 'popular';

  @state()
  maxTagsOneLine = 3;

  @state()
  isPopularTagListExpanded = false;

  @state()
  curSelectedTag = '';

  @state()
  curPage = 1;

  @state()
  isWaitingForQueryResponse = false;

  @queryAsync('.popular-tags')
  popularTagsElementPromise!: Promise<HTMLElement>;

  @query('.panel-community')
  panelElement: HTMLElement | undefined;

  @query('.prompt-content')
  promptContentElement: HTMLElement | undefined;

  @query('.prompt-modal')
  promptModalElement: HTMLDialogElement | undefined;

  @query('.prompt-loader')
  promptLoaderElement: HTMLElement | undefined;

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
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('is-shown') && this['is-shown']) {
      if (this.popularTags.length > 0) {
        this.updateMaxTagsOneLine();
      }
    }
  }

  firstUpdated() {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  /**
   * Determine how many popular tags to show so that the tags element has only one line
   */
  async updateMaxTagsOneLine() {
    const popularTagsElement = await this.popularTagsElementPromise;

    if (!this.panelElement) {
      throw Error('A queried element is not initialized.');
    }

    const tagsBBox = popularTagsElement.getBoundingClientRect();
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

    for (
      let i = 0;
      i < Math.min(MAX_POPULAR_TAGS, this.popularTags.length);
      i++
    ) {
      const curTag = document.createElement('tag');
      curTag.classList.add('tag');
      curTag.innerText = this.popularTags[i].tag;
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
    if (!this.promptContentElement || !this.promptLoaderElement) {
      throw Error('promptContentElement is undefined');
    }

    if (this.curSelectedTag === tag) {
      this.curSelectedTag = '';
    } else {
      this.curSelectedTag = tag;
    }

    // Reset the pagination
    this.curPage = 1;

    // Update the prompt list
    // Show the loader and disable scrolling
    this.promptLoaderElement.style.setProperty(
      'top',
      `${this.promptContentElement.scrollTop}px`
    );
    this.isWaitingForQueryResponse = true;
    const promptContentElement = this.promptContentElement;
    promptContentElement.classList.add('no-scroll');

    this.remotePromptManager
      .getPromptsByTag(this.curSelectedTag, this.curMode)
      .then(() => {
        this.isWaitingForQueryResponse = false;
        promptContentElement.classList.remove('no-scroll');
      });
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

  modalCloseClickHandler() {
    if (
      this.promptModalElement === undefined ||
      this.promptContentElement === undefined
    ) {
      throw Error('promptModalElement is undefined.');
    }

    this.promptModalElement.classList.add('hidden');

    // Enable scrolling
    this.promptContentElement.classList.remove('no-scroll');
  }

  headerModeButtonClicked(newMode: 'popular' | 'new') {
    if (this.curMode !== newMode) {
      if (!this.promptContentElement || !this.promptLoaderElement) {
        throw Error('promptContentElement is undefined');
      }

      // Show the loader and disable scrolling
      this.promptLoaderElement.style.setProperty(
        'top',
        `${this.promptContentElement.scrollTop}px`
      );
      this.isWaitingForQueryResponse = true;
      const promptContentElement = this.promptContentElement;
      promptContentElement.classList.add('no-scroll');

      this.remotePromptManager
        .getPromptsByTag(this.curSelectedTag, newMode)
        .then(() => {
          this.isWaitingForQueryResponse = false;
          promptContentElement.classList.remove('no-scroll');
        });
      this.curMode = newMode;
    }
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
      ? Math.min(MAX_POPULAR_TAGS, this.popularTags.length)
      : this.maxTagsOneLine;

    for (const tag of this.popularTags.slice(0, curMaxTag)) {
      popularTagList = html`${popularTagList}
        <span
          class="tag"
          ?is-selected="${this.curSelectedTag === tag.tag}"
          @click=${() => this.tagClicked(tag.tag)}
          >${tag.tag}</span
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
      if (curIndex > this.remotePrompts.length - 1) {
        break;
      }
      const curPromptData = this.remotePrompts[curIndex];
      promptCards = html`${promptCards}
        <wordflow-prompt-card
          .promptData=${curPromptData}
          .curSelectedTag=${this.curSelectedTag}
          @click=${() => {
            this.promptCardClicked(curPromptData);
          }}
          @tag-clicked=${(e: CustomEvent<string>) =>
            this.promptCardTagClickedHandler(e)}
        ></wordflow-prompt-card> `;
    }

    return html`
      <div class="panel-community">
        <div class="header">
          <div class="header-top">
            <span class="name"
              >${this.remotePrompts.length}${this.remotePromptManager
                .promptIsSubset
                ? '+'
                : ''}
              Prompts</span
            >
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
                @click=${() => this.headerModeButtonClicked('popular')}
                ?is-active=${this.curMode === 'popular'}
                >Popular</span
              >
              <span
                @click=${() => this.headerModeButtonClicked('new')}
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
          <div
            class="prompt-loader"
            ?is-hidden=${this.remotePrompts.length > 0 &&
            !this.isWaitingForQueryResponse}
          >
            <div class="loader-container">
              <span class="label">Loading Prompts</span>
              <div class="circle-loader"></div>
            </div>
          </div>

          <div class="prompt-container">${promptCards}</div>

          <div
            class="pagination"
            ?no-show=${this.remotePrompts.length <= NUM_CARDS_PER_PAGE}
          >
            <nightjar-pagination
              curPage=${this.curPage}
              totalPageNum=${Math.ceil(
                this.remotePrompts.length / NUM_CARDS_PER_PAGE
              )}
              pageWindowSize=${PAGINATION_WINDOW}
              @page-clicked=${(e: CustomEvent<number>) =>
                this.pageClickedHandler(e)}
            ></nightjar-pagination>
          </div>

          <div class="prompt-modal hidden">
            <wordflow-prompt-viewer
              .promptData=${this.selectedPrompt
                ? this.selectedPrompt
                : getEmptyPromptDataRemote()}
              .curSelectedTag=${this.curSelectedTag}
              @close-clicked=${() => this.modalCloseClickHandler()}
            ></wordflow-prompt-viewer>
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
    'wordflow-panel-community': WordflowPanelCommunity;
  }
}

export const getEmptyPromptDataRemote = () => {
  // Get user id
  let userID = localStorage.getItem('user-id');
  if (userID === null) {
    console.warn('userID is undefined. Creating a new userID.');
    userID = uuidv4();
    localStorage.setItem('user-id', userID);
  }

  const data: PromptDataRemote = {
    prompt: '',
    tags: [],
    temperature: 0.2,
    userID: userID,
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

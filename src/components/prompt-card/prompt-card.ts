import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Types
import type { PromptDataRemote } from '../../types/promptlet';

import componentCSS from './prompt-card.css?inline';

/**
 * Prompt card element.
 *
 */
@customElement('promptlet-prompt-card')
export class PromptLetPromptCard extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptData: PromptDataRemote;

  @property({ type: String })
  curSelectedTag = '';

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.promptData = getEmptyPromptData();
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
  /**
   * Tag clicked event handler
   * @param tag Clicked tag name
   */
  tagClicked(tag: string) {
    // Notify the parent
    const event = new CustomEvent('tag-clicked', {
      detail: tag,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compile the tag list
    let tagList = html``;
    for (const tag of this.promptData.tags) {
      tagList = html`${tagList}
        <span
          class="tag"
          ?is-selected=${this.curSelectedTag === tag}
          @click=${() => this.tagClicked(tag)}
          >${tag}</span
        >`;
    }
    return html`
      <div class="prompt-card">
        <div class="header">
          <span class="icon"><span>${this.promptData.icon}</span></span>
          <span class="name">${this.promptData.title}</span>
        </div>

        <div class="prompt">${this.promptData.prompt}</div>

        <div class="tag-list">${tagList}</div>
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
    'promptlet-prompt-card': PromptLetPromptCard;
  }
}

const getEmptyPromptData = () => {
  const data: PromptDataRemote = {
    prompt: '',
    tags: [],
    userID: '',
    userName: '',
    description: '',
    icon: '',
    forkFrom: '',
    promptRunCount: 0,
    created: '',
    title: ''
  };
  return data;
};

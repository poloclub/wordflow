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

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    return html`
      <div class="prompt-card">
        <div class="header">
          <span class="icon"><span>${this.promptData.icon}</span></span>
          <span class="name">${this.promptData.title}</span>
        </div>
        <div class="prompt">${this.promptData.prompt}</div>
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

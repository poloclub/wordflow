import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getEmptyPromptData } from '../panel-community/panel-community';
import d3 from '../../utils/d3-import';

// Types
import type { PromptDataRemote } from '../../types/promptlet';

import crossIcon from '../../images/icon-cross.svg?raw';

import componentCSS from './prompt-viewer.css?inline';

/**
 * Prompt viewer element.
 *
 */
@customElement('promptlet-prompt-viewer')
export class PromptLetPromptViewer extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptData: PromptDataRemote;

  @property({ type: String })
  curSelectedTag: string = '';

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
  tagClicked(e: MouseEvent, tag: string) {
    e.preventDefault();
    e.stopPropagation();

    // Notify the parent
    // const event = new CustomEvent('tag-clicked', {
    //   detail: tag,
    //   bubbles: true,
    //   composed: true
    // });
    // this.dispatchEvent(event);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the share info
    const numFormatter = d3.format(',');
    // '%m/%d/%Y';
    let dateFormatter = d3.timeFormat('%b %d, %Y');
    const fullTimeFormatter = d3.timeFormat('%b %d, %Y %H:%M');
    const date = d3.isoParse(this.promptData.created)!;
    const curDate = new Date();

    // Ignore the year if it is the same year as today
    if (date.getFullYear == curDate.getFullYear) {
      dateFormatter = d3.timeFormat('%b %d');
    }
    const user =
      this.promptData.userName === '' ? 'Anonymous' : this.promptData.userName;

    // Compose the tag list
    let tagList = html``;
    for (const tag of this.promptData.tags) {
      tagList = html`${tagList}
        <span
          class="tag"
          ?is-selected=${this.curSelectedTag === tag}
          @click=${(e: MouseEvent) => this.tagClicked(e, tag)}
          >${tag}</span
        >`;
    }

    return html`
      <div class="prompt-viewer">
        <div class="prompt-window">
          <div class="header">
            <div class="title-bar">
              <span class="icon"><span>${this.promptData.icon}</span></span>
              <span class="name">${this.promptData.title}</span>
              <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
            </div>

            <div class="info-bar">
              <span class="user-name">${user}</span>
              <div class="separator"></div>

              <span class="date" title=${fullTimeFormatter(date)}
                >${dateFormatter(date)}</span
              >
              <div class="separator"></div>

              <span class="run-info"
                >${numFormatter(this.promptData.promptRunCount)} runs</span
              >
            </div>
          </div>

          <div class="content">
            <section class="content-block">
              <div class="name">Description</div>
              <div class="content-text">${this.promptData.description}</div>
            </section>

            <section class="content-block">
              <div class="name">Prompt</div>
              <div class="content-text">${this.promptData.prompt}</div>
            </section>

            <section class="content-block">
              <div class="name">Tags</div>
              <div class="tag-list">${tagList}</div>
            </section>

            <section class="content-block">
              <div class="name">More Info</div>
              <div class="info-table"></div>
            </section>
          </div>
          <div class="footer">Add to library</div>
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
    'promptlet-prompt-viewer': PromptLetPromptViewer;
  }
}

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
import type { PromptDataLocal } from '../../types/promptlet';

import crossIcon from '../../images/icon-cross.svg?raw';
import infoIcon from '../../images/icon-info.svg?raw';
import arrowIcon from '../../images/icon-caret-down.svg?raw';
import componentCSS from './prompt-editor.css?inline';

interface InfoPair {
  key: string;
  value: string;
}

/**
 * Prompt editor element.
 *
 */
@customElement('promptlet-prompt-editor')
export class PromptLetPromptEditor extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptData: PromptDataLocal;

  @property({ type: String })
  curSelectedTag: string = '';

  @state()
  showAdvancedOptions = false;

  @state()
  showSharingOptions = false;

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

  accordionHeaderClicked(e: MouseEvent, type: 'advanced' | 'sharing') {
    e.preventDefault();
    console.log('clicked');
    if (type === 'advanced') {
      this.showAdvancedOptions = !this.showAdvancedOptions;
    } else if (type === 'sharing') {
      console.log('fliping');
      this.showSharingOptions = !this.showSharingOptions;
    }
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  /**
   * Create info as key-value pairs
   */
  getInfoPairs() {
    const infos: InfoPair[] = [];
    infos.push({ key: 'Models', value: 'gpt-3.5-turbo' });
    infos.push({ key: 'Injection mode', value: 'in-place' });
    infos.push({ key: 'Output parsing', value: '.*<output>(.+)</output>.*' });
    return infos;
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the share info
    const numFormatter = d3.format(',');
    // d3.timeFormat('%m/%d/%Y');
    const dateFormatter = d3.timeFormat('%b %d, %Y');
    const fullTimeFormatter = d3.timeFormat('%b %d, %Y %H:%M');
    const date = d3.isoParse(this.promptData.created)!;
    const curDate = new Date();

    return html`
      <div class="prompt-editor">
        <div class="prompt-window">
          <div class="header">
            <div class="title-bar">
              <span class="name">Edit Prompt</span>
              <span class="svg-icon">${unsafeHTML(crossIcon)}</span>
            </div>
          </div>

          <div class="content">
            <div class="two-section-container">
              <section class="content-block content-block-title">
                <div class="name-row">
                  <div class="name">Title</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <input type="text" class="content-text" />
              </section>

              <section class="content-block content-block-icon">
                <div class="name-row">
                  <div class="name">Icon</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <div class="content-icon-wrapper">
                  <input type="text" class="content-text" />
                </div>
              </section>
            </div>

            <section class="content-block content-block-prompt">
              <div class="name-row">
                <div class="name">Prompt</div>
                <span class="svg-icon info-icon">${unsafeHTML(infoIcon)}</span>
              </div>
              <textarea
                type="text"
                class="content-text prompt-input"
              ></textarea>
            </section>

            <div
              class="accordion-container"
              ?hide-content=${!this.showAdvancedOptions}
            >
              <div
                class="accordion-header"
                @click=${(e: MouseEvent) => {
                  this.accordionHeaderClicked(e, 'advanced');
                }}
              >
                <div class="name">Advanced Settings</div>
                <span class="svg-icon arrow-icon"
                  >${unsafeHTML(arrowIcon)}</span
                >
              </div>

              <div class="accordion-content">
                <section class="content-block">
                  <div class="name-row">
                    <div class="name">Output Parsing</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">Injection Mode</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>
              </div>
            </div>

            <div
              class="accordion-container"
              ?hide-content=${!this.showSharingOptions}
            >
              <div
                class="accordion-header"
                @click=${(e: MouseEvent) => {
                  this.accordionHeaderClicked(e, 'sharing');
                }}
              >
                <div class="name">Sharing Settings</div>
                <span class="svg-icon arrow-icon"
                  >${unsafeHTML(arrowIcon)}</span
                >
              </div>

              <div class="accordion-content">
                <section class="content-block">
                  <div class="name-row">
                    <div class="name">Output Parsing</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">Injection Mode</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>
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
    'promptlet-prompt-editor': PromptLetPromptEditor;
  }
}

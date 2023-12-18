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

// Assets
import crossIcon from '../../images/icon-cross.svg?raw';
import infoIcon from '../../images/icon-info.svg?raw';
import arrowIcon from '../../images/icon-caret-down.svg?raw';
import deleteIcon from '../../images/icon-delete.svg?raw';
import shareIcon from '../../images/icon-share.svg?raw';
import componentCSS from './prompt-editor.css?inline';

interface InfoPair {
  key: string;
  value: string;
}

interface LLMModel {
  label: string;
  name: string;
}

const ALL_MODELS: LLMModel[] = [
  { label: 'GPT 3.5', name: 'gpt-3.5' },
  { label: 'GPT 4', name: 'gpt-4' },
  { label: 'PALM 2', name: 'palm-2' },
  { label: 'Gemini Pro', name: 'gemini-pro' },
  { label: 'Claude 1', name: 'claude-1' },
  { label: 'Claude 2', name: 'claude-2' },
  { label: 'Llama 2', name: 'llama-2' }
];

const INJECTION_MODE_MAP = {
  replace: 'Replace input text',
  append: 'Append after input text'
};

const EMOJI_CANDIDATES = ['✍️', '✉️', '🎓', '😎', '🌱', '💛', '💧', '👓'];

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

  @state()
  availableModels: LLMModel[];

  @state()
  injectionMode: 'replace' | 'append' = 'replace';

  placeholderEmoji: string;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.promptData = getEmptyPromptData();

    this.availableModels = structuredClone(ALL_MODELS);
    this.placeholderEmoji =
      EMOJI_CANDIDATES[Math.floor(Math.random() * EMOJI_CANDIDATES.length)];
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
    if (type === 'advanced') {
      this.showAdvancedOptions = !this.showAdvancedOptions;
    } else if (type === 'sharing') {
      this.showSharingOptions = !this.showSharingOptions;
    }
  }

  closeButtonClicked() {
    // Notify the parent
    console.log('firing');
    const event = new Event('close-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
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

    // Compose the model checkbox lists
    let modelCheckboxes = html``;
    for (const model of this.availableModels) {
      modelCheckboxes = html`${modelCheckboxes}
        <div class="checkbox-group">
          <input
            type="checkbox"
            name="${model.name}"
            id="model-checkbox-${model.name}"
          />
          <label for="model-checkbox-${model.name}">${model.label}</label>
        </div> `;
    }

    return html`
      <div class="prompt-editor">
        <div class="prompt-window">
          <div class="header">
            <div class="title-bar">
              <span class="name">Edit Prompt</span>
              <span class="svg-icon" @click=${() => this.closeButtonClicked()}
                >${unsafeHTML(crossIcon)}</span
              >
            </div>
          </div>

          <div class="content">
            <div class="two-section-container">
              <section class="content-block content-block-title">
                <div class="name-row">
                  <div class="name required-name">Title</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                  <span class="name-info"
                    >Name for your prompt (&lt;40 characters)</span
                  >
                </div>
                <input
                  type="text"
                  class="content-text"
                  placeholder="Shorten the text"
                />
              </section>

              <section class="content-block content-block-icon">
                <div class="name-row">
                  <div class="name required-name">Icon</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <div class="content-icon-wrapper">
                  <input
                    type="text"
                    class="content-text"
                    placeholder="${this.placeholderEmoji}"
                  />
                </div>
              </section>
            </div>

            <section class="content-block content-block-prompt">
              <div class="name-row">
                <div class="name required-name">Prompt</div>
                <span class="svg-icon info-icon">${unsafeHTML(infoIcon)}</span>
                <span class="name-info">Prompt content</span>
              </div>
              <textarea
                type="text"
                class="content-text prompt-input"
                placeholder="You are an expert writer. Given an input text, you will make it succinct and clear."
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
                    <span class="name-info"
                      >Optional rule to parse LLM output</span
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
                    <span class="name-info"
                      >How should the LLM output be added?</span
                    >
                  </div>
                  <span class="injection-button">
                    <span class="injection-mode-text"
                      >${INJECTION_MODE_MAP[this.injectionMode]}</span
                    >
                    <select
                      class="injection-mode-select"
                      @change=${(e: InputEvent) => {
                        const select = e.currentTarget as HTMLSelectElement;
                        if (select.value === 'replace') {
                          this.injectionMode = 'replace';
                        } else {
                          this.injectionMode = 'append';
                        }
                      }}
                    >
                      <option value="replace">
                        ${INJECTION_MODE_MAP.replace}
                      </option>
                      <option value="append">
                        ${INJECTION_MODE_MAP.append}
                      </option>
                    </select>
                  </span>
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
                    <div class="name required-name share">Description</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info">What does your prompt do?</span>
                  </div>
                  <textarea
                    type="text"
                    class="content-text prompt-description"
                    placeholder="This prompt helps you shorten any English text."
                  ></textarea>
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name required-name share">Tags</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >One to three tags separated by comma</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    placeholder="shorten, summary"
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">User Name</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info">Optional user name</span>
                  </div>
                  <input type="text" class="content-text" />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">Recommended Models</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >Suggested LLMs to use this prompt</span
                    >
                  </div>
                  <form class="model-checkbox-container">
                    ${modelCheckboxes}
                  </form>
                </section>
              </div>
            </div>
          </div>

          <div class="footer">
            <button class="footer-button">
              <span class="svg-icon">${unsafeHTML(shareIcon)}</span>Share
            </button>
            <button class="footer-button">
              <span class="svg-icon">${unsafeHTML(deleteIcon)}</span>Delete
            </button>
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

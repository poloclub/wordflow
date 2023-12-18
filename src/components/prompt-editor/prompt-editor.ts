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
import { tooltipMouseEnter, tooltipMouseLeave } from '@xiaohk/utils';

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

interface FieldInfo {
  placeholder: string;
  description: string;
  tooltip: string;
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

enum Field {
  title = 'Title',
  icon = 'Icon',
  prompt = 'Prompt',
  outputParsing = 'Output Parsing',
  injectionMode = 'Injection Mode',
  description = 'Description',
  tags = 'Tags',
  userName = 'User Name',
  recommendedModels = 'Recommended Models'
}

const FIELD_INFO: Record<Field, FieldInfo> = {
  [Field.title]: {
    description: 'Name for your prompt (< 40 characters)',
    placeholder: 'Shorten the text',
    tooltip: 'Shorten the text'
  },
  [Field.icon]: {
    description: '',
    placeholder: '',
    tooltip: 'Shorten the text'
  },
  [Field.prompt]: {
    description: 'Prompt content',
    placeholder:
      'You are an experienced writer. Given some input text, you will make it succinct and clear.',
    tooltip: 'Shorten the text'
  },
  [Field.outputParsing]: {
    description: 'Optional rule to parse the LLM output',
    placeholder: '',
    tooltip: 'Shorten the text'
  },
  [Field.injectionMode]: {
    description: 'How should the LLM output be added?',
    placeholder: '',
    tooltip: 'Shorten the text'
  },
  [Field.description]: {
    description: 'What does your prompt do?',
    placeholder: 'This prompt helps users shorten any English text.',
    tooltip: 'Shorten the text'
  },
  [Field.tags]: {
    description: 'One to three tags separated by comma',
    placeholder: 'shorten, summary',
    tooltip: 'Shorten the text'
  },
  [Field.userName]: {
    description: 'Optional user name',
    placeholder: '',
    tooltip: 'Shorten the text'
  },
  [Field.recommendedModels]: {
    description: 'Suggested LLMs to use this prompt',
    placeholder: '',
    tooltip: 'Shorten the text'
  }
};

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

  infoIconMouseEntered() {}

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
                  <div class="name required-name">${Field.title}</div>
                  <span
                    class="svg-icon info-icon"
                    @mouseenter=${e => this.infoIconMouseEntered()}
                    >${unsafeHTML(infoIcon)}</span
                  >
                  <span class="name-info"
                    >${FIELD_INFO[Field.title].description}</span
                  >
                </div>
                <input
                  type="text"
                  class="content-text"
                  placeholder=${FIELD_INFO[Field.title].placeholder}
                />
              </section>

              <section class="content-block content-block-icon">
                <div class="name-row">
                  <div class="name required-name">${Field.icon}</div>
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
                <div class="name required-name">${Field.prompt}</div>
                <span class="svg-icon info-icon">${unsafeHTML(infoIcon)}</span>
                <span class="name-info"
                  >${FIELD_INFO[Field.prompt].description}</span
                >
              </div>
              <textarea
                type="text"
                class="content-text prompt-input"
                placeholder="${FIELD_INFO[Field.prompt].placeholder}"
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
                    <div class="name">${Field.outputParsing}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.outputParsing].description}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">${Field.injectionMode}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.injectionMode].description}</span
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
                    <div class="name required-name share">
                      ${Field.description}
                    </div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.description].description}</span
                    >
                  </div>
                  <textarea
                    type="text"
                    class="content-text prompt-description"
                    placeholder=${FIELD_INFO[Field.description].placeholder}
                  ></textarea>
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name required-name share">${Field.tags}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.tags].description}</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    placeholder=${FIELD_INFO[Field.tags].placeholder}
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">${Field.userName}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.userName].description}</span
                    >
                  </div>
                  <input type="text" class="content-text" />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div class="name">${Field.recommendedModels}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                    <span class="name-info"
                      >${FIELD_INFO[Field.recommendedModels].description}</span
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

      <div
        id="popper-tooltip-editor"
        class="popper-tooltip hidden"
        role="tooltip"
      >
        <span class="popper-content"></span>
        <div class="popper-arrow"></div>
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

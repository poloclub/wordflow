import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import emojiRegex from 'emoji-regex';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getEmptyPromptDataLocal } from '../panel-local/panel-local';
import { PromptManager } from '../wordflow/prompt-manager';
import { tooltipMouseEnter, tooltipMouseLeave, round } from '@xiaohk/utils';

import '../toast/toast';
import '../slider/slider';
import '../confirm-dialog/confirm-dialog';

// Types
import type { PromptDataLocal, PromptDataRemote } from '../../types/wordflow';
import type { TooltipConfig } from '@xiaohk/utils';
import type { NightjarToast } from '../toast/toast';
import type {
  NightjarConfirmDialog,
  DialogInfo
} from '../confirm-dialog/confirm-dialog';
import type { ValueChangedMessage, NightjarSlider } from '../slider/slider';

// Assets
import crossIcon from '../../images/icon-cross.svg?raw';
import infoIcon from '../../images/icon-info.svg?raw';
import arrowIcon from '../../images/icon-caret-down.svg?raw';
import deleteIcon from '../../images/icon-delete.svg?raw';
import shareIcon from '../../images/icon-share.svg?raw';
import saveIcon from '../../images/icon-check-circle.svg?raw';
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

export interface SharePromptMessage {
  data: PromptDataLocal;
  stopLoader: (status: number) => void;
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

const EMOJI_CANDIDATES = ['✍️', '✉️', '🎓', '😎', '🌱', '👾', '💧', '👓'];

const MAX_TITLE_LENGTH = 40;
const MAX_PROMPT_LENGTH = 2000;
const MAX_OUTPUT_PARSING_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS_LENGTH = 100;
const MAX_TAGS_COUNT = 3;
const MAX_USER_NAME_LENGTH = 40;
const EMOJI_REGEX = emojiRegex();

enum Field {
  title = 'Title',
  icon = 'Icon',
  prompt = 'Prompt',
  outputParsingPattern = 'Output Parsing - Pattern',
  outputParsingReplacement = 'Output Parsing - Replacement',
  injectionMode = 'Injection Mode',
  description = 'Description',
  tags = 'Tags',
  userName = 'User Name',
  recommendedModels = 'Recommended Models',
  temperature = 'Temperature'
}

const FIELD_INFO: Record<Field, FieldInfo> = {
  [Field.title]: {
    description: `Name for your prompt (< ${MAX_TITLE_LENGTH} characters)`,
    placeholder: 'Shorten the text',
    tooltip: `A short name for your prompt. It should have less than ${MAX_TITLE_LENGTH} characters.`
  },
  [Field.icon]: {
    description: '',
    placeholder: '',
    tooltip: 'Choose an emoji or a character as the icon for your prompt'
  },
  [Field.prompt]: {
    description: 'Prompt template',
    placeholder:
      'You are an experienced writer. Given some input text, you will make it succinct and clear.',
    tooltip:
      'By default, the input text will be added to the end of prompt. To place input text elsewhere, insert {{text}} in the prompt where you want the text.'
  },
  [Field.outputParsingPattern]: {
    description: 'Regex to parse the LLM output',
    placeholder: '(.*)',
    tooltip:
      'Regular expression pattern (JavaScript flavor) to parse the LLM output string.'
  },
  [Field.outputParsingReplacement]: {
    description: 'Regex match replacement',
    placeholder: '$1',
    tooltip:
      'Replacement string for the matched occurrence in the LLM output string'
  },
  [Field.injectionMode]: {
    description: 'How should the LLM output be added?',
    placeholder: '',
    tooltip:
      'Replace: replace the input text with the LLM output. Append: add the LLM output to the end of hte input text.'
  },
  [Field.description]: {
    description: 'What does your prompt do?',
    placeholder: 'This prompt helps users shorten any English text.',
    tooltip: 'A short description for your prompt.'
  },
  [Field.tags]: {
    description: 'One to three tags separated by comma',
    placeholder: 'shorten, summary',
    tooltip: 'One to three tags to help other users discover your prompt.'
  },
  [Field.userName]: {
    description: 'Optional user name',
    placeholder: '',
    tooltip: 'Optional user name associated with your prompt.'
  },
  [Field.recommendedModels]: {
    description: 'Suggested LLMs to use this prompt',
    placeholder: '',
    tooltip: 'Best LLM models to use with this prompt.'
  },
  [Field.temperature]: {
    description: 'LLM temperature',
    placeholder: '',
    tooltip:
      'Temperature controls randomness of the LLM output. As the value approaches 0, the output becomes deterministic and repetitive.'
  }
};

/**
 * Prompt editor element.
 *
 */
@customElement('wordflow-prompt-editor')
export class WordflowPromptEditor extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  promptData: PromptDataLocal;

  @property({ type: String })
  curSelectedTag: string = '';

  @property({ type: Boolean })
  isNewPrompt = false;

  @property({ attribute: false })
  promptManager!: PromptManager;

  @state()
  showAdvancedOptions = false;

  @state()
  showSharingOptions = false;

  @state()
  availableModels: LLMModel[];

  @state()
  injectionMode: 'replace' | 'append' = 'replace';

  @state()
  temperature: number = 0;

  @query('#popper-tooltip-editor')
  popperElement: HTMLElement | undefined;
  tooltipConfig: TooltipConfig | null = null;

  @state()
  titleLengthRemain = MAX_TITLE_LENGTH;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast')
  toastComponent: NightjarToast | undefined;

  @query('nightjar-slider')
  sliderComponent: NightjarSlider | undefined;

  @query('nightjar-confirm-dialog')
  confirmDialogComponent: NightjarConfirmDialog | undefined;

  placeholderEmoji: string;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.promptData = getEmptyPromptDataLocal();

    this.availableModels = structuredClone(ALL_MODELS);
    this.placeholderEmoji =
      EMOJI_CANDIDATES[Math.floor(Math.random() * EMOJI_CANDIDATES.length)];
  }

  firstUpdated() {
    // Bind the tooltip
    if (this.popperElement) {
      this.tooltipConfig = {
        tooltipElement: this.popperElement,
        mouseenterTimer: null,
        mouseleaveTimer: null
      };
    }
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('promptData')) {
      this.injectionMode = this.promptData.injectionMode;
      this.temperature = this.promptData.temperature;
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  /**
   * Create a prompt object by parsing the current form. This function does not
   * validate the user's inputs.
   */
  parseForm() {
    if (this.shadowRoot === null) {
      throw Error('Shadow root is null.');
    }

    const newPromptData = getEmptyPromptDataLocal();

    // Add the information that is not included in the input fields
    // `forkFrom`, `key`, `promptRunCount`
    // We will use a new `created` for the new data
    newPromptData.forkFrom = this.promptData.forkFrom;
    newPromptData.key = this.promptData.key;
    newPromptData.promptRunCount = this.promptData.promptRunCount;

    // Parse the title
    const title = (
      this.shadowRoot.querySelector('#text-input-title') as HTMLInputElement
    ).value;
    newPromptData.title = title.slice(0, MAX_TITLE_LENGTH);

    // Parse the icon
    const icon = (
      this.shadowRoot.querySelector('#text-input-icon') as HTMLInputElement
    ).value;

    const match = icon.match(EMOJI_REGEX);

    let iconChar = icon.slice(0, 1);
    if (match) {
      iconChar = match[0];
    }
    newPromptData.icon = iconChar;

    // If the user doesn't set an icon, use the placeholder instead
    if (newPromptData.icon === '') {
      newPromptData.icon = this.placeholderEmoji;
    }

    // Parse the prompt
    const prompt = (
      this.shadowRoot.querySelector('#text-input-prompt') as HTMLInputElement
    ).value;

    newPromptData.prompt = prompt.slice(0, MAX_PROMPT_LENGTH);

    // Parse the temperature
    newPromptData.temperature = this.temperature;

    // Parse output parsing - pattern
    const outputParsingPattern = (
      this.shadowRoot.querySelector(
        '#text-input-output-parsing-pattern'
      ) as HTMLInputElement
    ).value;
    newPromptData.outputParsingPattern = outputParsingPattern.slice(
      0,
      MAX_OUTPUT_PARSING_LENGTH
    );

    // Parse output parsing - replacement
    const outputParsingReplacement = (
      this.shadowRoot.querySelector(
        '#text-input-output-parsing-replacement'
      ) as HTMLInputElement
    ).value;
    newPromptData.outputParsingReplacement = outputParsingReplacement.slice(
      0,
      MAX_OUTPUT_PARSING_LENGTH
    );

    // Parse injection mode
    newPromptData.injectionMode = this.injectionMode;

    // Parse the prompt description
    const description = (
      this.shadowRoot.querySelector(
        '#text-input-description'
      ) as HTMLInputElement
    ).value;
    newPromptData.description = description.slice(0, MAX_DESCRIPTION_LENGTH);

    // Parse the tags
    const tags = (
      this.shadowRoot.querySelector('#text-input-tags') as HTMLInputElement
    ).value;
    if (tags.length > 0) {
      const tagsArray = tags.split(/\s*,\s*/);
      const formattedTags = tagsArray.map(tag =>
        tag.replace(/\s+/g, '-').toLowerCase()
      );
      newPromptData.tags = formattedTags.slice(0, MAX_TAGS_COUNT);
    }

    // Parse the user name
    const userName = (
      this.shadowRoot.querySelector('#text-input-user-name') as HTMLInputElement
    ).value;
    newPromptData.userName = userName.slice(0, MAX_USER_NAME_LENGTH);

    // Parse the recommended models
    const modelCheckboxes =
      this.shadowRoot.querySelectorAll<HTMLInputElement>('.model-checkbox');
    const recommendedModels: string[] = [];

    for (const checkbox of modelCheckboxes) {
      if (checkbox.checked) {
        recommendedModels.push(checkbox.name);
      }
    }
    newPromptData.recommendedModels = recommendedModels;

    return newPromptData;
  }

  /**
   * Save the user's input as a prompt. It creates a new prompt or updates an
   * existing prompt.
   */
  savePrompt() {
    if (this.toastComponent === undefined) {
      throw Error('toastComponent is undefined.');
    }

    // Parse the input fields
    const newPromptData = this.parseForm();

    // Validate the data
    if (newPromptData.title.length === 0) {
      this.toastMessage = "Title can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.icon.length === 0) {
      this.toastMessage = "Icon can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.prompt.length === 0) {
      this.toastMessage = "Prompt can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (this.isNewPrompt) {
      // Add the new prompt
      this.promptManager.addPrompt(newPromptData);
    } else {
      // Update the old prompt
      newPromptData.forkFrom = this.promptData.forkFrom;
      this.promptManager.setPrompt(newPromptData);
    }

    this.toastComponent.hide();
    this.closeButtonClicked();
  }

  /**
   * Share the current prompt.
   */
  sharePrompt() {
    if (this.toastComponent === undefined) {
      throw Error('toastComponent is undefined.');
    }

    if (this.shadowRoot === null) {
      throw Error('Shadow root is null');
    }

    if (this.confirmDialogComponent === undefined) {
      throw Error('confirmDialogComponent is undefined');
    }

    // Parse the input fields
    const newPromptData = this.parseForm();

    // Validate the data
    if (newPromptData.title.length === 0) {
      this.toastMessage = "Title can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.icon.length === 0) {
      this.toastMessage = "Icon can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.prompt.length === 0) {
      this.toastMessage = "Prompt can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.description.length === 0) {
      this.toastMessage =
        "Description (under Sharing Settings) can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.tags.length === 0) {
      this.toastMessage = "Tags (under Sharing Settings) can't be empty.";
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    if (newPromptData.tags.length > MAX_TAGS_COUNT) {
      this.toastMessage = `You can only enter at most ${MAX_TAGS_COUNT} tags.`;
      this.toastType = 'error';
      this.toastComponent.show();
      return;
    }

    for (const tag of newPromptData.tags) {
      if (tag.length < 2) {
        this.toastMessage = 'Each tag should have least 2 characters.';
        this.toastType = 'error';
        this.toastComponent.show();
        return;
      }

      if (tag.length > 20) {
        this.toastMessage = 'Each tag should have at most 20 characters.';
        this.toastType = 'error';
        this.toastComponent.show();
        return;
      }
    }

    // Try to share the prompt first
    if (this.isNewPrompt) {
      // Add the new prompt
      this.promptManager.addPrompt(newPromptData);
    } else {
      // Update the old prompt
      newPromptData.forkFrom = this.promptData.forkFrom;
      this.promptManager.setPrompt(newPromptData);
    }

    // Show the loader
    const contentElement = this.shadowRoot.querySelector(
      '.content'
    ) as HTMLElement;
    const loaderElement = this.shadowRoot.querySelector(
      '.prompt-loader'
    ) as HTMLElement;
    const toastComponent = this.toastComponent;

    loaderElement.style.setProperty('top', `${contentElement.scrollTop}px`);
    contentElement.classList.add('no-scroll');
    loaderElement.classList.remove('hidden');

    const stopLoader = (status: number) => {
      contentElement.classList.remove('no-scroll');
      loaderElement.style.setProperty('top', '0px');
      loaderElement.classList.add('hidden');

      // If the status code is 515, the prompt already exists. We should the toast
      if (status === 515) {
        this.toastMessage =
          'The same prompt has been shared by a user. Try a different prompt.';
        this.toastType = 'error';
        toastComponent.show();
      } else if (status === 201) {
        this.toastMessage = 'This prompt is shared.';
        this.toastType = 'success';
        toastComponent.show();
      } else if (status > 400 && status < 600) {
        this.toastMessage = 'Failed to share this prompt. Try again later.';
        this.toastType = 'error';
        toastComponent.show();
      }
    };

    const dialogInfo: DialogInfo = {
      header: 'Share Prompt',
      message:
        'Are you sure you want to share this prompt? You cannot unshare it. The shared content will be using a CC0 license.',
      yesButtonText: 'Share',
      actionKey: 'share-prompt-local'
    };

    const confirmAction = () => {
      const event = new CustomEvent<SharePromptMessage>('share-clicked', {
        bubbles: true,
        composed: true,
        detail: { data: newPromptData, stopLoader }
      });
      this.dispatchEvent(event);
    };

    const cancelAction = () => {
      stopLoader(204);
    };

    this.confirmDialogComponent.show(dialogInfo, confirmAction, cancelAction);
  }

  /**
   * Delete the current prompt.
   */
  deletePrompt() {
    if (this.confirmDialogComponent === undefined) {
      throw Error('confirmDialogComponent is undefined');
    }

    const dialogInfo: DialogInfo = {
      header: 'Delete Prompt',
      message:
        'Are you sure you want to delete this prompt? This action cannot be undone.',
      yesButtonText: 'Delete',
      actionKey: 'delete-prompt'
    };

    this.confirmDialogComponent.show(dialogInfo, () => {
      this.promptManager.deletePrompt(this.promptData);
      this.closeButtonClicked();
    });
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  /**
   * Event handler for clicking the accordion header
   * @param e Event
   * @param type Accordion type
   */
  async accordionHeaderClicked(e: MouseEvent, type: 'advanced' | 'sharing') {
    e.preventDefault();
    if (type === 'advanced') {
      if (!this.sliderComponent) {
        throw Error('sliderComponent is not initialized');
      }
      this.showAdvancedOptions = !this.showAdvancedOptions;

      // Need to force the slider to sync thumb, because its first time would fail
      // as all elements inside the accordion are not rendered yet.
      await this.updateComplete;
      this.sliderComponent.syncThumb();
    } else if (type === 'sharing') {
      this.showSharingOptions = !this.showSharingOptions;
    }
  }

  /**
   * Event handler for clicking the close button
   */
  closeButtonClicked() {
    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null');
    }

    // Notify the parent
    const event = new Event('close-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);

    // Clean up the input
    const formElement = this.shadowRoot.querySelector(
      'form.content'
    ) as HTMLFormElement;
    formElement.reset();

    // Collapse all accordions
    this.showAdvancedOptions = false;
    this.showSharingOptions = false;

    // Hide toast
    this.toastComponent?.hide();
  }

  /**
   * Event handler for mouse entering the info icon in each filed
   * @param e Mouse event
   * @param field Field type
   */
  infoIconMouseEntered(e: MouseEvent, field: Field) {
    const target = (e.currentTarget as HTMLElement).querySelector(
      '.info-icon'
    ) as HTMLElement;
    tooltipMouseEnter(
      e,
      FIELD_INFO[field].tooltip,
      'top',
      this.tooltipConfig,
      200,
      target,
      10
    );
  }

  /**
   * Event handler for mouse leaving the info icon in each filed
   */
  infoIconMouseLeft() {
    tooltipMouseLeave(this.tooltipConfig);
  }

  /**
   * Only allow users to enter one character or one emoji in the icon input
   * @param e Input event
   */
  iconInput(e: InputEvent) {
    const iconElement = e.currentTarget as HTMLInputElement;

    // Check if the delete key is pressed
    if (e.inputType === 'deleteContentBackward') {
      iconElement.value = ''; // Empty the input field
    } else {
      // Check if there is an emoji in the icon element
      const match = iconElement.value.match(EMOJI_REGEX);

      if (match === null) {
        // Use the first character
        iconElement.value = iconElement.value.slice(0, 1);
      } else {
        // Use the first emoji
        iconElement.value = match[0];
      }
    }
  }

  /**
   * Close the modal if the user clicks the background
   * @param e Mouse event
   */
  promptEditorBackgroundClicked(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('prompt-editor')) {
      this.closeButtonClicked();
    }
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the model checkbox lists
    let modelCheckboxes = html``;

    for (const model of this.availableModels) {
      // Check if the model is included in the recommended model list
      modelCheckboxes = html`${modelCheckboxes}
        <div class="checkbox-group">
          <input
            type="checkbox"
            name="${model.name}"
            class="model-checkbox"
            id="model-checkbox-${model.name}"
            ?checked=${this.promptData.recommendedModels.includes(model.name)}
          />
          <label for="model-checkbox-${model.name}">${model.label}</label>
        </div> `;
    }

    return html`
      <div
        class="prompt-editor"
        @click=${(e: MouseEvent) => this.promptEditorBackgroundClicked(e)}
      >
        <div class="prompt-window">
          <div class="toast-container">
            <nightjar-toast
              message=${this.toastMessage}
              type=${this.toastType}
            ></nightjar-toast>
          </div>

          <div class="header">
            <div class="title-bar">
              <span class="name"
                >${this.isNewPrompt ? 'New Prompt' : 'Edit Prompt'}</span
              >
              <span class="svg-icon" @click=${() => this.closeButtonClicked()}
                >${unsafeHTML(crossIcon)}</span
              >
            </div>
          </div>

          <form class="content">
            <div class="prompt-loader hidden">
              <div class="loader-container">
                <span class="label">Sharing Prompt</span>
                <div class="circle-loader"></div>
              </div>
            </div>

            <div class="two-section-container">
              <section class="content-block content-block-title">
                <div class="name-row">
                  <div
                    class="name-container"
                    @mouseenter=${(e: MouseEvent) =>
                      this.infoIconMouseEntered(e, Field.title)}
                    @mouseleave=${() => this.infoIconMouseLeft()}
                  >
                    <div class="name required-name">${Field.title}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                  <span class="name-info"
                    >${FIELD_INFO[Field.title].description}</span
                  >
                </div>
                <div class="length-input-container">
                  <input
                    type="text"
                    class="content-text title-input"
                    id="text-input-title"
                    value="${this.promptData.title}"
                    maxlength="${MAX_TITLE_LENGTH}"
                    placeholder=${FIELD_INFO[Field.title].placeholder}
                    @input=${(e: InputEvent) => {
                      const inputElement = e.currentTarget as HTMLInputElement;
                      this.titleLengthRemain =
                        MAX_TITLE_LENGTH - inputElement.value.length;
                    }}
                  />
                  <span class="length-counter title-length-counter"
                    >${this.titleLengthRemain}</span
                  >
                </div>
              </section>

              <section class="content-block content-block-icon">
                <div class="name-row">
                  <div
                    class="name-container"
                    @mouseenter=${(e: MouseEvent) =>
                      this.infoIconMouseEntered(e, Field.icon)}
                    @mouseleave=${() => this.infoIconMouseLeft()}
                  >
                    <div class="name required-name">${Field.icon}</div>
                    <span class="svg-icon info-icon"
                      >${unsafeHTML(infoIcon)}</span
                    >
                  </div>
                </div>
                <div class="content-icon-wrapper">
                  <input
                    type="text"
                    class="content-text"
                    id="text-input-icon"
                    value="${this.promptData.icon}"
                    @input=${(e: InputEvent) => this.iconInput(e)}
                    placeholder="${this.placeholderEmoji}"
                    maxlength="20"
                  />
                </div>
              </section>
            </div>

            <section class="content-block content-block-prompt">
              <div class="name-row">
                <div
                  class="name-container"
                  @mouseenter=${(e: MouseEvent) =>
                    this.infoIconMouseEntered(e, Field.prompt)}
                  @mouseleave=${() => this.infoIconMouseLeft()}
                >
                  <div class="name required-name">${Field.prompt}</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <span class="name-info"
                  >${FIELD_INFO[Field.prompt].description}</span
                >
              </div>
              <textarea
                type="text"
                class="content-text prompt-input"
                id="text-input-prompt"
                maxlength="${MAX_PROMPT_LENGTH}"
                placeholder="${FIELD_INFO[Field.prompt].placeholder}"
              >
${this.promptData.prompt}</textarea
              >
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
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.temperature)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.temperature}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.temperature].description}</span
                    >
                  </div>
                  <div class="slider-container">
                    <nightjar-slider
                      min=${0}
                      max=${1}
                      curValue=${this.temperature}
                      .styleConfig=${{
                        foregroundColor: 'var(--gray-500)',
                        backgroundColor: 'var(--gray-300)'
                      }}
                      @valueChanged=${(e: CustomEvent<ValueChangedMessage>) => {
                        this.temperature = e.detail.value;
                      }}
                    ></nightjar-slider>
                    <input
                      type="text"
                      class="content-text"
                      id="text-input-temperature"
                      value="${round(this.temperature, 2)}"
                      maxlength="${MAX_OUTPUT_PARSING_LENGTH}"
                      placeholder=${this.temperature}
                      @change=${(e: InputEvent) => {
                        const target = e.currentTarget as HTMLInputElement;
                        const value = parseFloat(target.value);
                        this.temperature = Math.min(1, Math.max(0, value));
                        target.value = `${round(this.temperature, 2)}`;
                      }}
                    />
                  </div>
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(
                          e,
                          Field.outputParsingPattern
                        )}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.outputParsingPattern}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.outputParsingPattern]
                        .description}</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    id="text-input-output-parsing-pattern"
                    value="${this.promptData.outputParsingPattern || ''}"
                    maxlength="${MAX_OUTPUT_PARSING_LENGTH}"
                    placeholder=${FIELD_INFO[Field.outputParsingPattern]
                      .placeholder}
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(
                          e,
                          Field.outputParsingReplacement
                        )}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.outputParsingReplacement}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.outputParsingReplacement]
                        .description}</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    id="text-input-output-parsing-replacement"
                    value="${this.promptData.outputParsingReplacement || ''}"
                    maxlength="${MAX_OUTPUT_PARSING_LENGTH}"
                    placeholder=${FIELD_INFO[Field.outputParsingReplacement]
                      .placeholder}
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.injectionMode)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.injectionMode}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
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
                      value="${this.injectionMode}"
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
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.description)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name required-name share">
                        ${Field.description}
                      </div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.description].description}</span
                    >
                  </div>
                  <textarea
                    type="text"
                    class="content-text prompt-description"
                    id="text-input-description"
                    maxlength="${MAX_DESCRIPTION_LENGTH}"
                    placeholder=${FIELD_INFO[Field.description].placeholder}
                  >
${this.promptData.description || ''}</textarea
                  >
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.tags)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name required-name share">${Field.tags}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.tags].description}</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    id="text-input-tags"
                    value="${this.promptData.tags !== undefined
                      ? this.promptData.tags.join(', ')
                      : ''}"
                    maxlength="${MAX_TAGS_LENGTH}"
                    placeholder=${FIELD_INFO[Field.tags].placeholder}
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.userName)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.userName}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.userName].description}</span
                    >
                  </div>
                  <input
                    type="text"
                    class="content-text"
                    id="text-input-user-name"
                    value="${this.promptData.userName || ''}"
                    maxlength="${MAX_USER_NAME_LENGTH}"
                  />
                </section>

                <section class="content-block">
                  <div class="name-row">
                    <div
                      class="name-container"
                      @mouseenter=${(e: MouseEvent) =>
                        this.infoIconMouseEntered(e, Field.recommendedModels)}
                      @mouseleave=${() => this.infoIconMouseLeft()}
                    >
                      <div class="name">${Field.recommendedModels}</div>
                      <span class="svg-icon info-icon"
                        >${unsafeHTML(infoIcon)}</span
                      >
                    </div>
                    <span class="name-info"
                      >${FIELD_INFO[Field.recommendedModels].description}</span
                    >
                  </div>
                  <div
                    class="model-checkbox-container"
                    id="form-recommended-models"
                  >
                    ${modelCheckboxes}
                  </div>
                </section>
              </div>
            </div>
          </form>

          <div class="footer">
            <div class="button-container">
              <button
                ?no-display=${this.isNewPrompt}
                class="footer-button"
                @click=${() => this.deletePrompt()}
              >
                <span class="svg-icon">${unsafeHTML(deleteIcon)}</span>Delete
              </button>
            </div>
            <div class="button-container">
              <button class="footer-button" @click=${() => this.sharePrompt()}>
                <span class="svg-icon">${unsafeHTML(shareIcon)}</span>Share
              </button>
              <button class="footer-button" @click=${() => this.savePrompt()}>
                <span class="svg-icon">${unsafeHTML(saveIcon)}</span>Save
              </button>
            </div>
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

      <nightjar-confirm-dialog></nightjar-confirm-dialog>
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
    'wordflow-prompt-editor': WordflowPromptEditor;
  }
}

import {
  LitElement,
  css,
  unsafeCSS,
  html,
  PropertyValues,
  TemplateResult
} from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  UserConfigManager,
  UserConfig,
  SupportedModel,
  ModelFamily,
  modelFamilyMap
} from '../wordflow/user-config';
import { textGenGpt } from '../../llms/gpt';
import { textGenPalm } from '../../llms/palm';
import { tooltipMouseEnter, tooltipMouseLeave } from '@xiaohk/utils';

import '../toast/toast';

import type { TooltipConfig } from '@xiaohk/utils';
import type { TextGenMessage } from '../../llms/gpt';
import type { NightjarToast } from '../toast/toast';

// Assets
import infoIcon from '../../images/icon-info.svg?raw';
import componentCSS from './panel-setting.css?inline';

const apiKeyMap: Record<SupportedModel, string> = {
  [SupportedModel['gpt-3.5']]: 'Open AI',
  [SupportedModel['gpt-3.5-free']]: 'Open AI',
  [SupportedModel['gpt-4']]: 'Open AI',
  [SupportedModel['gemini-pro']]: 'Gemini'
};

const apiKeyDescriptionMap: Record<ModelFamily, TemplateResult> = {
  [ModelFamily.openAI]: html`Get the key at
    <a href="https://platform.openai.com/api-keys" target="_blank"
      >Open AI API</a
    >`,
  [ModelFamily.google]: html`Get the key at
    <a href="https://makersuite.google.com/" target="_blank"
      >Google AI Studio</a
    >`
};

/**
 * Panel setting element.
 *
 */
@customElement('wordflow-panel-setting')
export class WordflowPanelSetting extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  userConfigManager!: UserConfigManager;

  @property({ attribute: false })
  userConfig!: UserConfig;

  @state()
  selectedModel: SupportedModel;

  get selectedFamily() {
    return modelFamilyMap[this.selectedModel];
  }

  selectedModelFamily: ModelFamily = ModelFamily.openAI;

  @state()
  apiInputValue = '';

  @state()
  showModelLoader = false;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast')
  toastComponent: NightjarToast | undefined;

  @query('#popper-tooltip-setting')
  popperElement: HTMLElement | undefined;
  tooltipConfig: TooltipConfig | null = null;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.selectedModel = SupportedModel['gpt-3.5-free'];
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('userConfig')) {
      if (this.selectedModel !== this.userConfig.preferredLLM) {
        this.selectedModel = this.userConfig.preferredLLM;
      }
    }
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

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  // ===== Event Methods ======
  textGenMessageHandler = (
    model: SupportedModel,
    apiKey: string,
    message: TextGenMessage
  ) => {
    switch (message.command) {
      case 'finishTextGen': {
        // If the textGen is initialized in the auth function, add the api key
        // to the local storage
        if (message.payload.requestID.includes('auth')) {
          const modelFamily = modelFamilyMap[model];

          // Add the api key to the storage
          this.userConfigManager.setAPIKey(modelFamily, apiKey);

          // Also use set this model as preferred model
          if (this.selectedModel === model) {
            this.userConfigManager.setPreferredLLM(model);
          }

          this.toastMessage = 'Successfully added an API key';
          this.toastType = 'success';
          this.toastComponent?.show();
        }
        break;
      }

      case 'error': {
        if (message.payload.originalCommand === 'startTextGen') {
          console.error(message);
          this.toastMessage = 'Invalid API key. Try a different key.';
          this.toastType = 'error';
          this.toastComponent?.show();
        }
        break;
      }

      default: {
        console.error('TextGen message handler: unknown message');
        break;
      }
    }
  };

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  addButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (
      this.userConfig.llmAPIKeys[this.selectedFamily] === this.apiInputValue ||
      this.apiInputValue === ''
    ) {
      return;
    }

    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null');
    }
    const requestID = 'auth-call';
    const prompt = 'The color of sky is';
    const temperature = 0.8;

    // Parse the api key
    const apiKey = this.apiInputValue;
    this.showModelLoader = true;

    switch (this.selectedModelFamily) {
      case ModelFamily.google: {
        textGenPalm(apiKey, requestID, prompt, temperature, false).then(
          value => {
            this.showModelLoader = false;
            this.textGenMessageHandler(this.selectedModel, apiKey, value);
          }
        );
        break;
      }

      case ModelFamily.openAI: {
        textGenGpt(
          apiKey,
          requestID,
          prompt,
          temperature,
          'gpt-3.5-turbo',
          false
        ).then(value => {
          this.showModelLoader = false;
          this.textGenMessageHandler(this.selectedModel, apiKey, value);
        });
        break;
      }

      default: {
        console.error(`Unknown model ${this.selectedModelFamily}`);
      }
    }
  }

  modelSelectChanged(e: InputEvent) {
    const select = e.currentTarget as HTMLSelectElement;

    // Update the UI
    this.selectedModel =
      SupportedModel[select.value as keyof typeof SupportedModel];
    this.apiInputValue = this.userConfig.llmAPIKeys[this.selectedFamily];

    // Save the preferred LLM if its API is set
    if (this.userConfig.llmAPIKeys[this.selectedFamily] !== '') {
      this.userConfigManager.setPreferredLLM(this.selectedModel);
    }
  }

  /**
   * Event handler for mouse entering the info icon in each filed
   * @param e Mouse event
   * @param field Field type
   */
  infoIconMouseEntered(e: MouseEvent, field: 'model' | 'api-key') {
    let message = '';

    switch (field) {
      case 'model': {
        message = 'Preferred LLM model to run the prompts';
        break;
      }

      case 'api-key': {
        message = 'Enter the API key to call the LLM model';
        break;
      }

      default: {
        console.error(`Unknown type ${field}`);
      }
    }

    const target = (e.currentTarget as HTMLElement).querySelector(
      '.info-icon'
    ) as HTMLElement;
    tooltipMouseEnter(e, message, 'top', this.tooltipConfig, 200, target, 10);
  }

  /**
   * Event handler for mouse leaving the info icon in each filed
   */
  infoIconMouseLeft() {
    tooltipMouseLeave(this.tooltipConfig);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the model select options
    let modelSelectOptions = html``;
    for (const [name, label] of Object.entries(SupportedModel)) {
      modelSelectOptions = html`${modelSelectOptions}
        <option value=${name}>${label}</option> `;
    }

    return html`
      <div class="panel-setting">
        <div class="toast-container">
          <nightjar-toast
            message=${this.toastMessage}
            type=${this.toastType}
          ></nightjar-toast>
        </div>

        <div class="header">
          <span class="name">Settings</span>
        </div>

        <form class="setting-form">
          <div class="two-section-container">
            <section class="content-block content-block-title">
              <div class="name-row">
                <div
                  class="name-container"
                  @mouseenter=${(e: MouseEvent) => {
                    this.infoIconMouseEntered(e, 'model');
                  }}
                  @mouseleave=${() => {
                    this.infoIconMouseLeft();
                  }}
                >
                  <div class="name">LLM Model</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
              </div>

              <span class="model-button">
                <span class="model-mode-text">${this.selectedModel}</span>
                <select
                  class="model-mode-select"
                  value="${this.selectedModel}"
                  @change=${(e: InputEvent) => this.modelSelectChanged(e)}
                >
                  ${modelSelectOptions}
                </select>
              </span>
            </section>

            <section
              class="content-block content-block-api"
              ?no-show=${this.selectedModel === SupportedModel['gpt-3.5-free']}
            >
              <div class="name-row">
                <div
                  class="name-container"
                  @mouseenter=${(e: MouseEvent) => {
                    this.infoIconMouseEntered(e, 'api-key');
                  }}
                  @mouseleave=${() => {
                    this.infoIconMouseLeft();
                  }}
                >
                  <div class="name">
                    ${apiKeyMap[this.selectedModel]} API Key
                  </div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <span class="name-info"
                  >${apiKeyDescriptionMap[this.selectedFamily]}</span
                >
              </div>

              <div class="length-input-container">
                <div class="input-container">
                  <input
                    type="text"
                    class="content-text api-input"
                    id="text-input-api"
                    value="${this.userConfig.llmAPIKeys[this.selectedFamily]}"
                    placeholder=""
                    @input=${(e: InputEvent) => {
                      const element = e.currentTarget as HTMLInputElement;
                      this.apiInputValue = element.value;
                    }}
                  />
                  <div class="right-loader">
                    <div
                      class="prompt-loader"
                      ?is-hidden=${!this.showModelLoader}
                    >
                      <div class="loader-container">
                        <div class="circle-loader"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  class="add-button"
                  ?has-set=${this.userConfig.llmAPIKeys[this.selectedFamily] ===
                    this.apiInputValue || this.apiInputValue === ''}
                  @click=${(e: MouseEvent) => this.addButtonClicked(e)}
                >
                  ${this.userConfig.llmAPIKeys[this.selectedFamily] === ''
                    ? 'Add'
                    : 'Update'}
                </button>
              </div>
            </section>
          </div>
        </form>

        <div
          id="popper-tooltip-setting"
          class="popper-tooltip hidden"
          role="tooltip"
        >
          <span class="popper-content"></span>
          <div class="popper-arrow"></div>
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
    'wordflow-panel-setting': WordflowPanelSetting;
  }
}

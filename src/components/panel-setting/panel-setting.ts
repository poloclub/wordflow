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
  SupportedRemoteModel,
  SupportedLocalModel,
  supportedModelReverseLookup,
  ModelFamily,
  modelFamilyMap
} from '../wordflow/user-config';
import { textGenGpt } from '../../llms/gpt';
import { textGenGemini } from '../../llms/gemini';
import { tooltipMouseEnter, tooltipMouseLeave } from '@xiaohk/utils';
import { hasLocalModelInCache, detectGPUDevice } from '../../llms/web-llm';

import '../toast/toast';
import '../progress-bar/progress-bar';

import type { TooltipConfig } from '@xiaohk/utils';
import type { TextGenMessage } from '../../llms/gpt';
import type { NightjarToast } from '../toast/toast';
import type { NightjarProgressBar } from '../progress-bar/progress-bar';
import type { TextGenLocalWorkerMessage } from '../../llms/web-llm';

// Assets
import infoIcon from '../../images/icon-info.svg?raw';
import componentCSS from './panel-setting.css?inline';

const apiKeyMap: Record<SupportedRemoteModel, string> = {
  [SupportedRemoteModel['gpt-3.5']]: 'Open AI',
  [SupportedRemoteModel['gpt-3.5-free']]: 'Open AI',
  [SupportedRemoteModel['gpt-4']]: 'Open AI',
  [SupportedRemoteModel['gemini-pro']]: 'Gemini'
};

const apiKeyDescriptionMap: Record<ModelFamily, TemplateResult> = {
  [ModelFamily.openAI]: html`Get the key at
    <a href="https://platform.openai.com/api-keys" target="_blank"
      >Open AI API</a
    >`,
  [ModelFamily.google]: html`Get the key at
    <a href="https://makersuite.google.com/" target="_blank"
      >Google AI Studio</a
    >`,
  [ModelFamily.local]: html``
};

const localModelSizeMap: Record<SupportedLocalModel, string> = {
  [SupportedLocalModel['tinyllama-1.1b']]: '630 MB',
  [SupportedLocalModel['llama-2-7b']]: '3.6 GB',
  [SupportedLocalModel['phi-2']]: '1.5 GB'
  // [SupportedLocalModel['gpt-2']]: '311 MB'
  // [SupportedLocalModel['mistral-7b-v0.2']]: '3.5 GB'
};

const LOCAL_MODEL_MESSAGES = {
  default: html`Run LLMs privately in your browser with
    <a href=" https://webllm.mlc.ai/" target="_blank">Web LLM</a>`,
  downloading: html`You can use other models during installation process</a>`,
  incompatible: html`Browser unsupported (see
    <a href=" https://webllm.mlc.ai/" target="_blank">Web LLM</a> for more info)`
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

  @property({ attribute: false })
  textGenLocalWorker!: Worker;

  @state()
  selectedModel: SupportedRemoteModel | SupportedLocalModel;

  get selectedModelFamily() {
    return modelFamilyMap[this.selectedModel];
  }

  @state()
  selectedLocalModelInCache = false;

  @state()
  curDeviceSupportsLocalModel = false;

  @state()
  apiInputValue = '';

  @state()
  showModelLoader = false;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast')
  toastComponent: NightjarToast | undefined | null;

  @query('nightjar-progress-bar')
  progressBarComponent: NightjarProgressBar | undefined | null;
  showLocalModelProgressBar = false;

  @state()
  localModelMessage = LOCAL_MODEL_MESSAGES.default;

  @query('#popper-tooltip-setting')
  popperElement: HTMLElement | undefined;
  tooltipConfig: TooltipConfig | null = null;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.selectedModel = SupportedRemoteModel['gpt-3.5-free'];
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('userConfig')) {
      if (this.selectedModel !== this.userConfig.preferredLLM) {
        this.selectedModel = this.userConfig.preferredLLM;

        // Need to manually update the select element
        const selectElement = this.shadowRoot!.querySelector(
          '.model-mode-select'
        ) as HTMLSelectElement;
        selectElement.value = supportedModelReverseLookup[this.selectedModel];

        this._updateSelectedLocalModelInCache().then(() => {
          // Case 1: If the user has set preferred model to a local model in the
          // previous session and the model is in cache => activate it
          if (this.selectedModelFamily === ModelFamily.local) {
            if (this.selectedLocalModelInCache) {
              // Request the worker to start loading the model
              const message: TextGenLocalWorkerMessage = {
                command: 'startLoadModel',
                payload: {
                  temperature: 0.2,
                  model: this.selectedModel as SupportedLocalModel
                }
              };
              this.textGenLocalWorker.postMessage(message);
            } else {
              // Case 2: If the user has set preferred model to a local model in the
              // previous session but the model is not longer in cache => revert to gpt 3.5 (free)
              this.selectedModel = SupportedRemoteModel['gpt-3.5-free'];
              selectElement.value =
                supportedModelReverseLookup[this.selectedModel];
              this.userConfigManager.setPreferredLLM(this.selectedModel);
            }
          }
        });
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

    // Add event listener to the local text gen worker
    this.textGenLocalWorker.addEventListener(
      'message',
      (e: MessageEvent<TextGenLocalWorkerMessage>) => {
        this.textGenLocalWorkerMessageHandler(e);
      }
    );

    this._updateSelectedLocalModelInCache();

    // Check if the current device supports WebLLM
    try {
      detectGPUDevice().then(result => {
        if (result !== undefined) {
          this.curDeviceSupportsLocalModel = true;
        } else {
          this.curDeviceSupportsLocalModel = false;
          this.localModelMessage = LOCAL_MODEL_MESSAGES.incompatible;
        }
      });
    } catch (error) {
      console.error(error);
      this.curDeviceSupportsLocalModel = false;
      this.localModelMessage = LOCAL_MODEL_MESSAGES.incompatible;
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  // ===== Event Methods ======
  textGenMessageHandler = (
    model: SupportedRemoteModel,
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

  /**
   * Event handler for the text gen local worker
   * @param e Text gen message
   */
  textGenLocalWorkerMessageHandler(e: MessageEvent<TextGenLocalWorkerMessage>) {
    switch (e.data.command) {
      case 'finishTextGen': {
        break;
      }

      case 'progressLoadModel': {
        this.progressBarComponent?.updateProgress(e.data.payload.progress);
        break;
      }

      case 'finishLoadModel': {
        // Show the default message
        this.localModelMessage = LOCAL_MODEL_MESSAGES.default;
        this.showLocalModelProgressBar = false;

        // Case 1: The user is using other models when the model finishes loading.
        // Do nothing, wait for the users to switch to this model again.
        if (e.data.payload.model !== this.selectedModel) {
          // Pass
        } else {
          // Case 2: The user is actively waiting for this model to finish loading.
          // Switch preferred model this model
          this.userConfigManager.setPreferredLLM(this.selectedModel);
        }

        break;
      }

      case 'error': {
        break;
      }

      default: {
        console.error('Worker: unknown message', e.data.command);
        break;
      }
    }
  }

  localModelButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (!this.curDeviceSupportsLocalModel) return;
    if (this.userConfig.preferredLLM === this.selectedModel) return;

    // Request the worker to start loading the model
    const message: TextGenLocalWorkerMessage = {
      command: 'startLoadModel',
      payload: {
        temperature: 0.2,
        model: this.selectedModel as SupportedLocalModel
      }
    };
    this.textGenLocalWorker.postMessage(message);

    // Show the downloading message
    this.localModelMessage = LOCAL_MODEL_MESSAGES.downloading;
    this.showLocalModelProgressBar = true;
  }

  addButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (
      this.userConfig.llmAPIKeys[this.selectedModelFamily] ===
        this.apiInputValue ||
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
        textGenGemini(apiKey, requestID, prompt, temperature, false).then(
          value => {
            this.showModelLoader = false;
            this.textGenMessageHandler(
              this.selectedModel as SupportedRemoteModel,
              apiKey,
              value
            );
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
          this.textGenMessageHandler(
            this.selectedModel as SupportedRemoteModel,
            apiKey,
            value
          );
        });
        break;
      }

      case ModelFamily.local: {
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
    if (
      SupportedRemoteModel[
        select.value as keyof typeof SupportedRemoteModel
      ] !== undefined
    ) {
      // Handle remote model selection
      this.selectedModel =
        SupportedRemoteModel[select.value as keyof typeof SupportedRemoteModel];
      this.apiInputValue = this.userConfig.llmAPIKeys[this.selectedModelFamily];

      if (this.selectedModel === SupportedRemoteModel['gpt-3.5-free']) {
        this.userConfigManager.setPreferredLLM(this.selectedModel);
      } else {
        // Save the preferred LLM if its API is set
        if (this.userConfig.llmAPIKeys[this.selectedModelFamily] !== '') {
          this.userConfigManager.setPreferredLLM(this.selectedModel);
        }
      }
    } else if (
      SupportedLocalModel[select.value as keyof typeof SupportedLocalModel] !==
      undefined
    ) {
      // Handle local model selection
      this.selectedModel =
        SupportedLocalModel[select.value as keyof typeof SupportedLocalModel];
      this.apiInputValue = this.userConfig.llmAPIKeys[this.selectedModelFamily];

      // Check if this model is in cache
      this._updateSelectedLocalModelInCache();

      // Only set preferred LLM to this model after activation
    } else {
      console.error('Unknown model selected');
    }
  }

  /**
   * Event handler for mouse entering the info icon in each filed
   * @param e Mouse event
   * @param field Field type
   */
  infoIconMouseEntered(
    e: MouseEvent,
    field: 'model' | 'api-key' | 'local-llm'
  ) {
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

      case 'local-llm': {
        message =
          'Install open-source LLM models to run them directly in your browser';
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
  async _updateSelectedLocalModelInCache() {
    if (this.selectedModelFamily !== ModelFamily.local) {
      this.selectedLocalModelInCache = false;
    } else {
      this.selectedLocalModelInCache = await hasLocalModelInCache(
        this.selectedModel as SupportedLocalModel
      );
    }
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compose the model select options
    let remoteModelSelectOptions = html``;
    let localModelSelectOptions = html``;

    // Remote models
    for (const [name, label] of Object.entries(SupportedRemoteModel)) {
      remoteModelSelectOptions = html`${remoteModelSelectOptions}
        <option value=${name}>${label}</option> `;
    }

    // Local models
    for (const [name, label] of Object.entries(SupportedLocalModel)) {
      localModelSelectOptions = html`${localModelSelectOptions}
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
                  <div class="name">Preferred Model</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
              </div>

              <span class="model-button">
                <span class="model-mode-text">${this.selectedModel}</span>
                <select
                  class="model-mode-select"
                  value="${supportedModelReverseLookup[this.selectedModel]}"
                  @change=${(e: InputEvent) => this.modelSelectChanged(e)}
                >
                  <optgroup label="Remote LLMs">
                    ${remoteModelSelectOptions}
                  </optgroup>

                  <optgroup label="Local LLMs">
                    ${localModelSelectOptions}
                  </optgroup>
                </select>
              </span>
            </section>

            <section
              class="content-block content-block-api"
              ?no-show=${this.selectedModel ===
                SupportedRemoteModel['gpt-3.5-free'] ||
              this.selectedModelFamily === ModelFamily.local}
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
                    ${apiKeyMap[this.selectedModel as SupportedRemoteModel]} API
                    Key
                  </div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <span class="name-info"
                  >${apiKeyDescriptionMap[this.selectedModelFamily]}</span
                >
              </div>

              <div class="length-input-container">
                <div class="input-container">
                  <input
                    type="text"
                    class="content-text api-input"
                    id="text-input-api"
                    value="${this.userConfig.llmAPIKeys[
                      this.selectedModelFamily
                    ]}"
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
                  ?has-set=${this.userConfig.llmAPIKeys[
                    this.selectedModelFamily
                  ] === this.apiInputValue || this.apiInputValue === ''}
                  @click=${(e: MouseEvent) => this.addButtonClicked(e)}
                >
                  ${this.userConfig.llmAPIKeys[this.selectedModelFamily] === ''
                    ? 'Add'
                    : 'Update'}
                </button>
              </div>
            </section>

            <section
              class="content-block content-block-local"
              ?no-show=${this.selectedModelFamily !== ModelFamily.local}
            >
              <div class="name-row">
                <div
                  class="name-container"
                  @mouseenter=${(e: MouseEvent) => {
                    this.infoIconMouseEntered(e, 'local-llm');
                  }}
                  @mouseleave=${() => {
                    this.infoIconMouseLeft();
                  }}
                >
                  <div class="name">Local LLM</div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <span class="name-info">${this.localModelMessage}</span>
              </div>

              <div class="download-info-container">
                <button
                  class="add-button"
                  @mouseenter=${(e: MouseEvent) => {
                    const element = e.currentTarget as HTMLElement;
                    tooltipMouseEnter(
                      e,
                      'Installing local LLMs for the first time can take several minutes. Once installed, activating them would be much faster.',
                      'top',
                      this.tooltipConfig,
                      200,
                      element,
                      10
                    );
                  }}
                  @mouseleave=${() => {
                    this.infoIconMouseLeft();
                  }}
                  ?has-set=${this.userConfig.preferredLLM ===
                  this.selectedModel}
                  ?is-disabled=${!this.curDeviceSupportsLocalModel}
                  @click=${(e: MouseEvent) => this.localModelButtonClicked(e)}
                >
                  ${this.userConfig.preferredLLM === this.selectedModel
                    ? 'Activated'
                    : this.selectedLocalModelInCache
                      ? 'Activate'
                      : 'Install'}
                  (${localModelSizeMap[
                    this.selectedModel as SupportedLocalModel
                  ]})
                </button>

                <nightjar-progress-bar
                  ?is-shown=${this.showLocalModelProgressBar}
                ></nightjar-progress-bar>
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

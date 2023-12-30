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
import { UserConfig, SupportedModel } from '../wordflow/user-config';
import { textGenGpt } from '../../llms/gpt';
import { textGenPalm } from '../../llms/palm';

import '../toast/toast';

import type { TextGenMessage } from '../../llms/palm';
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

enum ModelFamily {
  google = 'Google',
  openAI = 'Open AI'
}

const modelFamilyMap: Record<SupportedModel, ModelFamily> = {
  [SupportedModel['gpt-3.5']]: ModelFamily.openAI,
  [SupportedModel['gpt-3.5-free']]: ModelFamily.openAI,
  [SupportedModel['gpt-4']]: ModelFamily.openAI,
  [SupportedModel['gemini-pro']]: ModelFamily.google
};

const apiKeyDescriptionMap: Record<ModelFamily, TemplateResult> = {
  [ModelFamily.openAI]: html`Get the key at
    <a href="https://platform.openai.com/api-keys" target="_blank"
      >Open AI API</a
    >`,
  [ModelFamily.google]: html`Get the key at <a href="" target="_blank">here</a>`
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
  userConfig!: UserConfig;

  @state()
  selectedModel: SupportedModel = SupportedModel['gpt-3.5-free'];

  @state()
  showModelLoader = false;

  @state()
  toastMessage = '';

  @state()
  toastType: 'success' | 'warning' | 'error' = 'success';

  @query('nightjar-toast')
  toastComponent: NightjarToast | undefined;

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
  willUpdate(changedProperties: PropertyValues<this>) {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  // ===== Event Methods ======
  addButtonClicked(e: MouseEvent) {
    e.preventDefault();

    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null');
    }
    const requestID = 'auth-call';
    const prompt = 'The color of sky is';
    const temperature = 0.8;
    const modelFamily = modelFamilyMap[this.selectedModel];

    // Parse the api key
    const apiInputElement = this.shadowRoot.querySelector(
      'input#text-input-api'
    ) as HTMLInputElement;
    const apiKey = apiInputElement.value;
    this.showModelLoader = true;

    switch (modelFamily) {
      case ModelFamily.google: {
        textGenPalm(apiKey, requestID, prompt, temperature, false).then(
          value => {
            this.showModelLoader = false;
            this.textGenMessageHandler(apiKey, value);
          }
        );
        break;
      }

      case ModelFamily.openAI: {
        textGenGpt(apiKey, requestID, prompt, temperature, false).then(
          value => {
            this.showModelLoader = false;
            this.textGenMessageHandler(apiKey, value);
          }
        );
        break;
      }

      default: {
        console.error(`Unknown model ${modelFamily}`);
      }
    }
  }

  textGenMessageHandler = (apiKey: string, message: TextGenMessage) => {
    switch (message.command) {
      case 'finishTextGen': {
        // If the textGen is initialized in the auth function, add the api key
        // to the local storage
        if (message.payload.requestID.includes('auth')) {
          // Add the api key to the local storage
          // localStorage.setItem(`${model}APIKey`, apiKey);
          // Store the key in the data structure
          console.log(apiKey);
        }
        break;
      }

      case 'error': {
        if (message.payload.originalCommand === 'startTextGen') {
          console.error(message);
          console.log('no!');
          this.toastMessage = 'Invalid API key. Try a different key.';
          this.toastType = 'error';
          this.toastComponent.show();
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
                  @mouseenter=${() => {}}
                  @mouseleave=${() => {}}
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
                  @change=${(e: InputEvent) => {
                    const select = e.currentTarget as HTMLSelectElement;
                    this.selectedModel =
                      SupportedModel[
                        select.value as keyof typeof SupportedModel
                      ];
                  }}
                >
                  ${modelSelectOptions}
                </select>
              </span>
            </section>

            <section class="content-block content-block-api">
              <div class="name-row">
                <div
                  class="name-container"
                  @mouseenter=${() => {}}
                  @mouseleave=${() => {}}
                >
                  <div class="name">
                    ${apiKeyMap[this.selectedModel]} API Key
                  </div>
                  <span class="svg-icon info-icon"
                    >${unsafeHTML(infoIcon)}</span
                  >
                </div>
                <span class="name-info"
                  >${apiKeyDescriptionMap[
                    modelFamilyMap[this.selectedModel]
                  ]}</span
                >
              </div>

              <div class="length-input-container">
                <div class="input-container">
                  <input
                    type="text"
                    class="content-text api-input"
                    id="text-input-api"
                    value=""
                    placeholder=""
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
                  class="form-button"
                  @click=${(e: MouseEvent) => this.addButtonClicked(e)}
                >
                  Add
                </button>
              </div>
            </section>
          </div>
        </form>
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

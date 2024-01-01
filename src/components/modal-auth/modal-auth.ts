import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { textGenPalm } from '../../llms/palm';
import { textGenGpt } from '../../llms/gpt';
import type { TextGenMessage } from '../../llms/gpt';

import componentCSS from './modal-auth.css?inline';

const USE_CACHE = true;
const SUCCESS_MESSAGE = 'API key added.';

type Model = 'palm' | 'gpt';

export interface ModelAuthMessage {
  model: Model;
  apiKey: string;
}

/**
 * Modal auth element.
 *
 */
@customElement('wordflow-modal-auth')
export class WordflowModalAuth extends LitElement {
  // ===== Properties ======
  @property({ type: String })
  apiKey = '';

  @query('.modal-auth')
  modalElement!: HTMLElement | null;

  @state()
  modelSetMap: Record<Model, boolean>;

  @state()
  modelMessageMap: Record<Model, string>;

  textGenWorkerRequestID = 1;

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    this.modelSetMap = {
      palm: false,
      gpt: false
    };

    this.modelMessageMap = {
      palm: 'Verifying...',
      gpt: 'Verifying...'
    };
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.updateComplete.then(_ => {
      // Check if the user has already entered the API key.
      const models: Model[] = ['palm', 'gpt'];

      for (const model of models) {
        const apiKey = USE_CACHE
          ? localStorage.getItem(`${model}APIKey`)
          : null;

        if (apiKey === null) {
          this.modelSetMap[model] = false;
        } else {
          this.modelSetMap[model] = true;
          const event = new CustomEvent<ModelAuthMessage>('api-key-added', {
            detail: {
              model,
              apiKey
            }
          });
          this.dispatchEvent(event);
          break;
        }
      }

      this.requestUpdate();

      // Show the modal if there is no API key found.
      const atLeastOneModelSet = Object.values(this.modelSetMap).some(d => d);
      if (!atLeastOneModelSet) {
        setTimeout(() => {
          this.modalElement?.classList.add('displayed');
        }, 300);
      }
    });
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    // Stop showing the modal if the API key is set from a different venue
    if (changedProperties.has('apiKey')) {
      if (this.apiKey !== '') {
        this.modalElement?.classList.remove('displayed');
      }
    }
  }

  // ===== Custom Methods ======
  initData = async () => {};

  authVerificationFailed = (
    model: Model,
    messageElement: HTMLElement,
    message: string
  ) => {
    // Show the error message in the auth dialog
    messageElement.classList.remove('loading');
    messageElement.classList.remove('success');
    messageElement.classList.add('error');
    this.modelMessageMap[model] = 'Invalid, try a different key';
    this.requestUpdate();
    console.error(message);
  };

  authVerificationSucceeded = (
    model: Model,
    messageElement: HTMLElement,
    apiKey: string
  ) => {
    // Add the api key to the local storage
    if (USE_CACHE) {
      localStorage.setItem(`${model}APIKey`, apiKey);
    }

    const event = new CustomEvent<ModelAuthMessage>('api-key-added', {
      detail: {
        model,
        apiKey
      }
    });
    this.dispatchEvent(event);
    this.modelSetMap[model] = true;
    this.modelMessageMap[model] = SUCCESS_MESSAGE;
    messageElement.classList.remove('loading');
    messageElement.classList.remove('error');
    messageElement.classList.add('success');
    this.requestUpdate();
  };

  // ===== Event Methods ======
  submitButtonClicked = (model: Model) => {
    const messageElement = this.renderRoot.querySelector<HTMLElement>(
      `#message-${model}`
    );
    const apiInputElement = this.renderRoot.querySelector<HTMLInputElement>(
      `#api-input-${model}`
    );

    if (messageElement === null || apiInputElement === null) {
      throw Error("Can't locate the input elements");
    }

    const apiKey = apiInputElement.value;
    if (apiKey === undefined || apiKey === '') {
      return;
    }

    // Start to verify the given key
    messageElement.classList.remove('error');
    messageElement.classList.remove('success');
    messageElement.classList.add('displayed');
    messageElement.classList.add('loading');
    this.modelMessageMap[model] = 'Verifying';
    this.requestUpdate();

    const requestID = `auth-${this.textGenWorkerRequestID++}`;
    const prompt = 'The color of sky is';
    const temperature = 0.8;

    switch (model) {
      case 'palm': {
        textGenPalm(apiKey, requestID, prompt, temperature, false).then(
          value => {
            this.textGenMessageHandler(model, messageElement, value);
          }
        );
        break;
      }

      case 'gpt': {
        textGenGpt(
          apiKey,
          requestID,
          prompt,
          temperature,
          'gpt-3.5-turbo',
          false
        ).then(value => {
          console.log(value);
          this.textGenMessageHandler(model, messageElement, value);
        });
        break;
      }

      default: {
        console.error(`Unknown model ${model}`);
      }
    }
  };

  doneButtonClicked = () => {
    // Remove the auth dialog window
    this.modalElement?.classList.remove('displayed');
  };

  textGenMessageHandler = (
    model: Model,
    messageElement: HTMLElement,
    message: TextGenMessage
  ) => {
    switch (message.command) {
      case 'finishTextGen': {
        // If the textGen is initialized in the auth function, add the api key
        // to the local storage
        if (message.payload.requestID.includes('auth')) {
          this.authVerificationSucceeded(
            model,
            messageElement,
            message.payload.apiKey
          );
        }
        break;
      }

      case 'error': {
        // Error handling for the PaLM API calls
        if (message.payload.originalCommand === 'startTextGen') {
          this.authVerificationFailed(
            model,
            messageElement,
            message.payload.message
          );
        }
        break;
      }

      default: {
        console.error('TextGen message handler: unknown message');
        break;
      }
    }
  };

  // ===== Templates and Styles ======
  render() {
    const getInputButtonLabel = (model: Model) => {
      if (this.modelSetMap[model]) {
        return 'Edit';
      } else {
        return 'Add';
      }
    };

    return html`
      <div class="modal-auth">
        <div class="dialog-window">
          <div class="header">Enter At Least an LLM API Key</div>

          <div class="content">
            <div class="row">
              <span class="info-text">
                <strong>PaLM 2</strong> (<a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  >reference</a
                >)
              </span>
              <div class="input-form">
                <input id="api-input-palm" placeholder="API Key" />
                <button
                  class="primary"
                  @click="${() => this.submitButtonClicked('palm')}"
                >
                  ${getInputButtonLabel('palm')}
                </button>
              </div>
              <div class="message" id="message-palm">
                ${this.modelMessageMap['palm']}
              </div>
            </div>

            <div class="row">
              <span class="info-text">
                <strong>GPT 3.5</strong> (<a
                  href="https://platform.openai.com/docs/guides/gpt"
                  target="_blank"
                  >reference</a
                >)
              </span>
              <div class="input-form">
                <input id="api-input-gpt" placeholder="API Key" />
                <button
                  class="primary"
                  @click="${() => this.submitButtonClicked('gpt')}"
                >
                  ${getInputButtonLabel('gpt')}
                </button>
              </div>
              <div class="message" id="message-gpt">
                ${this.modelMessageMap['gpt']}
              </div>
            </div>
          </div>

          <div class="footer">
            <button
              class="primary"
              ?disabled=${!Object.values(this.modelSetMap).some(d => d)}
              @click="${() => this.doneButtonClicked()}"
            >
              Done
            </button>
            <button disabled>Cancel</button>
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
    'wordflow-modal-auth': WordflowModalAuth;
  }
}

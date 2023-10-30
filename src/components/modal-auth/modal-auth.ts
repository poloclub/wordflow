import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { textGenPalm } from '../../llms/palm';
import { textGenGpt } from '../../llms/gpt';
import type { TextGenMessage } from '../../llms/palm';

import componentCSS from './modal-auth.css?inline';

const USE_CACHE = true;

type Model = 'palm' | 'gpt';

export interface ModelAuthMessage {
  model: Model;
  apiKey: string;
}

/**
 * Modal auth element.
 *
 */
@customElement('promptlet-modal-auth')
export class PromptletModalAuth extends LitElement {
  // ===== Properties ======
  @property({ type: String })
  apiKey = '';

  @query('.modal-auth')
  modalElement!: HTMLElement | null;

  @state()
  message = 'Verifying...';

  textGenWorkerRequestID = 1;

  // ===== Lifecycle Methods ======
  constructor() {
    super();

    // this.textGenWorker = new TextGenWorkerInline();
    // this.textGenWorker.onmessage = (e: MessageEvent<TextGenWorkerMessage>) =>
    //   this.textGenWorkerMessageHandler(e);
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.updateComplete.then(_ => {
      // Check if the user has already entered the API key. Show the modal if
      // there is no API key found.
      const checkIfAPIAdded = (model: Model) => {
        const apiKey = USE_CACHE
          ? localStorage.getItem(`${model}APIKey`)
          : null;

        if (apiKey === null) {
          setTimeout(() => {
            this.modalElement?.classList.add('displayed');
          }, 300);
          return false;
        } else {
          const event = new CustomEvent<ModelAuthMessage>('api-key-added', {
            detail: {
              model,
              apiKey
            }
          });
          this.dispatchEvent(event);
          return true;
        }
      };

      // Try PaLM first
      const resultPalm = checkIfAPIAdded('palm');
      if (!resultPalm) {
        checkIfAPIAdded('gpt');
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

  authVerificationFailed = (messageElement: HTMLElement, message: string) => {
    // Show the error message in the auth dialog
    messageElement.classList.remove('loading');
    messageElement.classList.add('error');
    this.message = 'Invalid, try a different key';
    console.error(message);
  };

  authVerificationSucceeded = (model: Model, apiKey: string) => {
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

    // Remove the auth dialog window
    this.modalElement?.classList.remove('displayed');
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
    messageElement.classList.add('displayed');
    messageElement.classList.add('loading');
    this.message = 'Verifying';

    const requestID = `auth-${this.textGenWorkerRequestID++}`;
    const prompt = 'The color of sky is';
    const temperature = 0.8;

    textGenPalm(apiKey, requestID, prompt, temperature, false).then(value => {
      console.log(value);
      this.textGenMessageHandler(model, messageElement, value);
    });
  };

  doneButtonClicked = () => {
    console.log('done');
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
          this.authVerificationSucceeded(model, message.payload.apiKey);
        }
        break;
      }

      case 'error': {
        // Error handling for the PaLM API calls
        if (message.payload.originalCommand === 'startTextGen') {
          this.authVerificationFailed(messageElement, message.payload.message);
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
                  Add
                </button>
              </div>
              <div class="message" id="message-palm">${this.message}</div>
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
                  Add
                </button>
              </div>
              <div class="message" id="message-gpt">${this.message}</div>
            </div>
          </div>

          <div class="footer">
            <button
              class="primary"
              ?disabled=${true}
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
    'promptlet-modal-auth': PromptletModalAuth;
  }
}

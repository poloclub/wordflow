import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { gdprContent, prcConsent } from './consent-content';

import componentCSS from './privacy-dialog.css?inline';

import arrowIcon from '../../images/icon-caret-down.svg?raw';

/**
 * Confirm dialog element.
 *
 */
@customElement('wordflow-privacy-dialog-simple')
export class PrivacyDialogSimple extends LitElement {
  // ===== Class properties ======
  @query('dialog')
  dialogElement: HTMLDialogElement | undefined;

  @state()
  showGDPR = false;

  @state()
  showPRC = false;

  confirmAction: () => void;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
    this.confirmAction = () => {};
  }

  firstUpdated() {
    window.setTimeout(() => {}, 1000);
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  initData = async () => {};

  show(confirmAction: () => void) {
    this.confirmAction = confirmAction;

    if (this.dialogElement) {
      this.dialogElement.showModal();
    }
  }

  // ===== Event Methods ======
  dialogClicked(e: MouseEvent) {
    if (e.target === this.dialogElement) {
      this.dialogElement.close();
    }
  }

  cancelClicked(e: MouseEvent) {
    e.stopPropagation();
    if (this.dialogElement) {
      this.dialogElement.close();
    }
  }

  // ===== Templates and Styles ======
  render() {
    return html`
      <dialog
        class="confirm-dialog"
        @click=${(e: MouseEvent) => this.dialogClicked(e)}
      >
        <div class="header">
          <div class="header-name">Wordflow Privacy</div>
        </div>

        <div class="content">
          <div class="message">
            <p>
              We <strong><u>DO NOT</u></strong> store your input text or any
              sensitive data (e.g., name, email address, IP address, and
              location). We only store community-shared prompts and the number
              of times a prompt is run.
            </p>
          </div>
        </div>

        <div class="button-block">
          <button
            class="cancel-button"
            @click=${(e: MouseEvent) => this.cancelClicked(e)}
          >
            Okay
          </button>
        </div>
      </dialog>
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
    'wordflow-confirm-dialog-simple': PrivacyDialogSimple;
  }
}

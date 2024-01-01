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
@customElement('wordflow-privacy-dialog')
export class PrivacyDialog extends LitElement {
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

  confirmClicked(e: MouseEvent) {
    e.stopPropagation();

    if (this.dialogElement) {
      localStorage.setItem('has-confirmed-privacy', 'true');
      this.confirmAction();
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
          <div class="header-name">Usage Data Collection Acknowledgement</div>
        </div>

        <div class="content">
          <div class="message">
            <p>
              You are being asked to be a volunteer in a research study. The
              purpose of this study is to understand user interaction patterns
              and preferences when using large language models.
            </p>
            <p>
              <strong
                >When you use this web app to run or share a prompt, the prompt
                prefix, timestamp, and AI model configurations (e.g.,
                temperature) will be collected. We <u>DO NOT</u> collect your
                input text or any sensitive data (e.g., username, email address,
                IP address, location). Please do not include personal
                information in the prompt prefix.</strong
              >
            </p>
            <p>
              The risks involved are no greater than those involved in daily
              activities. You will not benefit or be compensated for joining
              this study. We will comply with any applicable laws and
              regulations regarding confidentiality. To make sure that this
              research is being carried out in the proper way, the Georgia
              Institute of Technology IRB may review study records. The Office
              of Human Research Protections may also look at study records. If
              you have any questions about the study, you may contact the PI at
              email polo@gatech.edu. If you have any questions about your rights
              as a research subject, you may contact Georgia Institute of
              Technology Office of Research Integrity Assurance at
              IRB@gatech.edu. Thank you for participating in this study! By
              proceeding to use this web app, you indicate your consent to be in
              the study.
            </p>
          </div>

          <div class="accordion-container" ?hide-content=${!this.showGDPR}>
            <div
              class="accordion-header"
              @click=${() => {
                this.showGDPR = !this.showGDPR;
                if (this.showGDPR) {
                  this.showPRC = false;
                }
              }}
            >
              <div class="name">
                General Data Protection Regulation (GDPR) Consent
              </div>
              <span class="svg-icon arrow-icon">${unsafeHTML(arrowIcon)}</span>
            </div>

            <div class="accordion-content">${gdprContent}</div>
          </div>

          <div class="accordion-container" ?hide-content=${!this.showPRC}>
            <div
              class="accordion-header"
              @click=${() => {
                this.showPRC = !this.showPRC;
                if (this.showPRC) {
                  this.showGDPR = false;
                }
              }}
            >
              <div class="name">
                Republic of China (PRC) Personal Information Protection Law
                Consent
              </div>
              <span class="svg-icon arrow-icon">${unsafeHTML(arrowIcon)}</span>
            </div>

            <div class="accordion-content">${prcConsent}</div>
          </div>
        </div>

        <div class="button-block">
          <button
            class="cancel-button"
            @click=${(e: MouseEvent) => this.cancelClicked(e)}
          >
            Cancel
          </button>
          <button
            class="confirm-button"
            @click=${(e: MouseEvent) => this.confirmClicked(e)}
          >
            Agree
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
    'wordflow-confirm-dialog': PrivacyDialog;
  }
}

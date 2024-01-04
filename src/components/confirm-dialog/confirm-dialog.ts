import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './confirm-dialog.css?inline';

export interface DialogInfo {
  header: string;
  message: string;
  yesButtonText: string;
  /**
   * Used to identify actions to skip
   */
  actionKey: string;
}

/**
 * Confirm dialog element.
 *
 */
@customElement('nightjar-confirm-dialog')
export class NightjarConfirmDialog extends LitElement {
  // ===== Class properties ======
  @query('dialog')
  dialogElement: HTMLDialogElement | undefined;

  @state()
  header = 'Delete Item';

  @state()
  message =
    'Are you sure you want to delete this item? This action cannot be undone.';

  @state()
  yesButtonText = 'Delete';

  actionKey = 'deletion';
  confirmAction: () => void;
  cancelAction: () => void;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
    this.confirmAction = () => {};
    this.cancelAction = () => {};
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

  show(
    dialogInfo: DialogInfo,
    confirmAction: () => void,
    cancelAction?: () => void
  ) {
    this.header = dialogInfo.header;
    this.message = dialogInfo.message;
    this.yesButtonText = dialogInfo.yesButtonText;
    this.actionKey = dialogInfo.actionKey;
    this.confirmAction = confirmAction;

    if (cancelAction === undefined) {
      this.cancelAction = () => {};
    } else {
      this.cancelAction = cancelAction;
    }

    // First check if the user has skipped this action
    const skipDialog = localStorage.getItem(`<skip-confirm>${this.actionKey}`);

    if (skipDialog === 'true') {
      this.confirmAction();
    } else {
      if (this.dialogElement) {
        this.dialogElement.showModal();
      }
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
      this.cancelAction();
    }
  }

  confirmClicked(e: MouseEvent) {
    e.stopPropagation();

    if (this.dialogElement) {
      // Update the local storage if user chooses to skip the action
      const checkbox = this.dialogElement.querySelector<HTMLInputElement>(
        '#checkbox-skip-confirmation'
      );
      if (checkbox && checkbox.checked) {
        const key = `<skip-confirm>${this.actionKey}`;
        localStorage.setItem(key, 'true');
      }

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
          <div class="header-name">${this.header}</div>
        </div>

        <div class="content">
          <div class="message">${this.message}</div>
          <div class="skip-bar">
            <input
              type="checkbox"
              id="checkbox-skip-confirmation"
              name="checkbox-skip-confirmation"
            />
            <label for="checkbox-skip-confirmation"
              >Don't ask me again about this action</label
            >
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
            ${this.yesButtonText}
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
    'nightjar-confirm-dialog': NightjarConfirmDialog;
  }
}

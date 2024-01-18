import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './progress-bar.css?inline';

/**
 * Progress bar element.
 *
 */
@customElement('nightjar-progress-bar')
export class NightjarProgressBar extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ type: Number })
  progress = 0;
  _progress = 0;
  totalWidth = 0;

  @state()
  curProgressWidth = 0;

  @state()
  labelAlign: 'left' | 'right' = 'left';

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
  }

  firstUpdated() {
    if (!this.shadowRoot) {
      throw Error('shadowRoot is undefined.');
    }
    const progressBar = this.shadowRoot.querySelector(
      '.progress-bar'
    ) as HTMLElement;

    const initTotalWidth = () => {
      setTimeout(() => {
        const bbox = progressBar.getBoundingClientRect();
        if (bbox.width === 0) {
          initTotalWidth();
        } else {
          this.totalWidth = bbox.width;
          this.updateProgress(this.progress);
        }
      }, 20);
    };
    initTotalWidth();
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('progress')) {
      this.updateProgress(this.progress);
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  alignProgressLabel() {
    if (!this.shadowRoot) {
      throw Error('shadowRoot is undefined.');
    }

    // Add a temp label to mock its size
    const tempLabel = document.createElement('span');
    tempLabel.classList.add('progress-label');
    tempLabel.classList.add('temp');
    tempLabel.innerText = `${Math.floor(this._progress * 100)}%`;
    this.shadowRoot.appendChild(tempLabel);

    const labelWidth = tempLabel.getBoundingClientRect().width;
    tempLabel.remove();

    if (labelWidth < this.curProgressWidth) {
      this.labelAlign = 'right';
    } else {
      this.labelAlign = 'left';
    }
  }

  /**
   * Update the current progress
   * @param progress Progress form 0 to 1
   */
  updateProgress(progress: number) {
    this._progress = Math.min(1, Math.max(0, progress));
    this.curProgressWidth = this.totalWidth * this._progress;
    this.alignProgressLabel();
  }

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
    return html`
      <div class="progress-bar">
        <div
          class="current-progress"
          ?is-done=${this._progress >= 1}
          style="width: ${this.curProgressWidth}px;"
        >
          <span class="progress-label" ?align-left=${this.labelAlign === 'left'}
            >${Math.floor(this._progress * 100)}%</span
          >
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
    'nightjar-progress-bar': NightjarProgressBar;
  }
}

import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './toast.css?inline';

const ERROR_SVG = html`<svg
  width="100%"
  height="100%"
  viewBox="0 0 80 80"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xml:space="preserve"
  xmlns:serif="http://www.serif.com/"
  style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
>
  <g id="icon-cross-circle-solid">
    <path
      d="M39.904,79.15C18.42,79.15 0.5,61.279 0.5,39.746C0.5,18.213 18.371,0.342 39.855,0.342C61.389,0.342 79.357,18.213 79.357,39.746C79.357,61.279 61.437,79.15 39.904,79.15ZM27.062,56.25C28.088,56.25 29.016,55.908 29.65,55.225L39.904,44.873L50.207,55.225C50.842,55.908 51.77,56.25 52.746,56.25C54.797,56.25 56.408,54.639 56.408,52.588C56.408,51.611 56.066,50.732 55.334,50.049L45.031,39.795L55.383,29.443C56.164,28.711 56.457,27.881 56.457,26.904C56.457,24.902 54.846,23.34 52.844,23.34C51.916,23.34 51.135,23.682 50.402,24.365L39.904,34.766L29.553,24.414C28.869,23.779 28.088,23.438 27.062,23.438C25.109,23.438 23.498,24.951 23.498,27.002C23.498,27.93 23.889,28.809 24.523,29.492L34.826,39.795L24.523,50.098C23.889,50.781 23.498,51.66 23.498,52.588C23.498,54.639 25.109,56.25 27.062,56.25Z"
    />
  </g>
</svg> `;

const SUCCESS_SVG = html`<svg
  width="100%"
  height="100%"
  viewBox="0 0 80 80"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xml:space="preserve"
  xmlns:serif="http://www.serif.com/"
  style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
>
  <g id="icon-check-circle-solid">
    <path
      d="M39.618,79.15C18.134,79.15 0.214,61.279 0.214,39.746C0.214,18.213 18.085,0.342 39.569,0.342C61.102,0.342 79.071,18.213 79.071,39.746C79.071,61.279 61.151,79.15 39.618,79.15ZM35.321,58.545C36.786,58.545 38.056,57.861 38.983,56.396L56.366,28.857C56.952,27.978 57.489,26.953 57.489,25.977C57.489,23.877 55.731,22.607 53.778,22.607C52.606,22.607 51.483,23.291 50.702,24.658L35.126,49.854L28.095,40.478C27.02,39.014 26.044,38.623 24.823,38.623C22.772,38.623 21.308,40.234 21.308,42.236C21.308,43.213 21.649,44.189 22.333,45.019L31.415,56.396C32.587,57.959 33.808,58.545 35.321,58.545Z"
    />
  </g>
</svg> `;

const WARN_SVG = html`<svg
  width="100%"
  height="100%"
  viewBox="0 0 80 80"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xml:space="preserve"
  xmlns:serif="http://www.serif.com/"
  style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
>
  <g id="icon-warning-circle-solid">
    <path
      d="M40.391,79.15C18.907,79.15 0.987,61.279 0.987,39.746C0.987,18.213 18.858,0.342 40.343,0.342C61.876,0.342 79.845,18.213 79.845,39.746C79.845,61.279 61.925,79.15 40.391,79.15ZM40.391,46.973C42.589,46.973 43.809,45.752 43.858,43.457L44.444,22.705C44.493,20.41 42.735,18.701 40.343,18.701C37.95,18.701 36.241,20.361 36.29,22.656L36.876,43.457C36.925,45.703 38.145,46.973 40.391,46.973ZM40.391,60.205C42.882,60.205 45.079,58.301 45.079,55.762C45.079,53.223 42.931,51.269 40.391,51.269C37.901,51.269 35.753,53.271 35.753,55.762C35.753,58.252 37.95,60.205 40.391,60.205Z"
    />
  </g>
</svg>`;

const CROSS_SVG = html`<svg
  width="100%"
  height="100%"
  viewBox="0 0 62 62"
  version="1.1"
  xml:space="preserve"
  style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
>
  <g id="icon-cross">
    <path
      d="M1.299,60.421C2.861,61.935 5.4,61.935 6.914,60.421L30.84,36.447L54.814,60.421C56.279,61.935 58.867,61.935 60.381,60.421C61.894,58.859 61.894,56.32 60.381,54.855L36.406,30.88L60.381,6.955C61.894,5.441 61.943,2.853 60.381,1.339C58.818,-0.125 56.279,-0.125 54.814,1.339L30.84,25.314L6.914,1.339C5.4,-0.125 2.812,-0.174 1.299,1.339C-0.166,2.902 -0.166,5.441 1.299,6.955L25.273,30.88L1.299,54.855C-0.166,56.32 -0.215,58.908 1.299,60.421Z"
      style="fill-rule:nonzero;"
    />
  </g>
</svg> `;

/**
 * Toast element.
 *
 */
@customElement('nightjar-toast')
export class NightjarToast extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ type: String })
  type: 'success' | 'warning' | 'error' = 'error';

  @property({ type: String })
  message = 'Title cannot be empty';

  @property({ type: Number })
  duration = 6000;

  @state()
  isHidden = true;

  timer: null | number = null;

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

  /**
   * Show the toast message
   */
  show() {
    if (this.isHidden) {
      this.isHidden = false;
    }

    // Hide the element after delay
    if (this.duration > 0) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.hide();
      }, this.duration);
    }
  }

  /**
   * Hide the toast message
   */
  hide() {
    if (this.isHidden) return;
    if (this.shadowRoot === null) {
      throw Error('Shadow root is null');
    }

    const toastElement = this.shadowRoot.querySelector('.toast') as HTMLElement;

    // Fade the element first
    const fadeOutAnimation = toastElement.animate(
      { opacity: [1, 0] },
      { duration: 200, easing: 'ease-in-out' }
    );

    // Hide the element after animation
    fadeOutAnimation.onfinish = () => {
      this.isHidden = true;
    };
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
    let curIcon = SUCCESS_SVG;
    if (this.type === 'warning') {
      curIcon = WARN_SVG;
    } else if (this.type === 'error') {
      curIcon = ERROR_SVG;
    }

    return html`
      <div class="toast" toast-type=${this.type} ?is-hidden=${this.isHidden}>
        <div class="svg-icon">${curIcon}</div>
        <div class="message">${this.message}</div>
        <div
          class="svg-icon cross-icon"
          @click=${() => {
            this.hide();
          }}
        >
          ${CROSS_SVG}
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
    'nightjar-toast': NightjarToast;
  }
}

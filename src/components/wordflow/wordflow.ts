import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAsync
} from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '../text-editor/text-editor';
import '../sidebar-menu/sidebar-menu';
import componentCSS from './wordflow.css?inline';

/**
 * Wordflow element.
 *
 */
@customElement('promptlet-wordflow')
export class PromptLetWordflow extends LitElement {
  // ===== Class properties ======
  @state()
  leftPopperBox: HTMLElement | undefined;

  @queryAsync('#right-popper-box')
  rightPopperBox: Promise<HTMLElement> | undefined;

  // @state()
  // rightPopperBox: HTMLElement | undefined;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
  }

  firstUpdated() {
    // this.rightPopperBox = this.renderRoot.querySelector(
    //   '#right-popper-box'
    // ) as HTMLElement;
    // this.leftPopperBox = this.renderRoot.querySelector(
    //   '#left-popper-box'
    // ) as HTMLElement;
    console.log(this.rightPopperBox);
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  // ===== Custom Methods ======
  initData = async () => {};

  // ===== Event Methods ======

  // ===== Templates and Styles ======
  render() {
    return html`
      <div class="wordflow">
        <div class="left-panel">
          <div class="popper-box" id="left-popper-box">
            <!-- <promptlet-sidebar-menu
              id="left-sidebar-menu"
            ></promptlet-sidebar-menu> -->
          </div>
        </div>
        <div class="center-panel">
          <div class="editor-content">
            <promptlet-text-editor
              .rightPopperBox=${this.rightPopperBox}
            ></promptlet-text-editor>
          </div>
        </div>
        <div class="right-panel">
          <div class="popper-box" id="right-popper-box">
            <promptlet-sidebar-menu
              id="right-sidebar-menu"
            ></promptlet-sidebar-menu>
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
    'promptlet-wordflow': PromptLetWordflow;
  }
}

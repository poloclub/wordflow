import { Extension } from '@tiptap/core';
import { Editor, posToDOMRect } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';

interface VirtualElement {
  getBoundingClientRect: () => DOMRect;
}

export interface SidebarMenuPluginProps {
  pluginKey: PluginKey | string;
  editor: Editor;
  rightPopperBox: Promise<HTMLElement> | null;
  shouldShow?:
    | ((props: {
        editor: Editor;
        view: EditorView;
        state: EditorState;
        oldState?: EditorState;
      }) => boolean)
    | null;
}

export type SidebarMenuViewProps = SidebarMenuPluginProps & {
  view: EditorView;
};

export class SidebarMenuView {
  editor: Editor;
  rightPopperBox: Promise<HTMLElement>;
  view: EditorView;
  preventHide = false;

  shouldShow: Exclude<SidebarMenuPluginProps['shouldShow'], null> = props => {
    const editor = props.editor;

    if (editor.isActive('edit-highlight') || editor.isActive('collapse')) {
      return true;
    } else {
      return false;
    }
  };

  constructor({
    editor,
    rightPopperBox,
    view,
    shouldShow
  }: SidebarMenuViewProps) {
    if (!rightPopperBox) {
      throw Error('rightPopperBox is not given.');
    }

    this.editor = editor;
    this.view = view;
    this.rightPopperBox = rightPopperBox;

    if (shouldShow) {
      this.shouldShow = shouldShow;
    }

    this.editor.on('focus', this.focusHandler);
    this.editor.on('blur', this.blurHandler);
  }

  focusHandler = () => {
    // we use `setTimeout` to make sure `selection` is already updated
    setTimeout(() => this.update(this.editor.view));
  };

  blurHandler = ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;

      return;
    }

    // Do not hide if the user shifts focus to the menu
    // if (
    //   event?.relatedTarget &&
    //   this.element.parentNode?.contains(event.relatedTarget as Node)
    // ) {
    //   return;
    // }

    this.hide();
  };

  tippyBlurHandler = (event: FocusEvent) => {
    this.blurHandler({ event });
  };

  createTooltip() {
    const { element: editorElement } = this.editor.options;
    const editorIsAttached = !!editorElement.parentElement;
  }

  async update(view: EditorView, oldState?: EditorState) {
    const { state } = view;
    const { doc, selection } = state;
    const { $from } = selection;
    const isSame =
      oldState && oldState.doc.eq(doc) && oldState.selection.eq(selection);

    if (isSame) {
      return;
    }

    const shouldShow = this.shouldShow?.({
      editor: this.editor,
      view,
      state,
      oldState
    });

    if (!shouldShow) {
      this.hide();
      return;
    }

    const rightPopperBoxElement = await this.rightPopperBox;
    // Depending on the active element, we need to get the edit-highlight mark
    // or the collapse node in the selection
    if (this.editor.isActive('edit-highlight')) {
      const mark = $from.marks()[0];
      const markElement = this.editor.options.element.querySelector(
        `mark#${mark.attrs.id}`
      );

      if (markElement === null) {
        throw Error(`Can't find mark#${mark.attrs.id}`);
      }
      updatePopperPopover(rightPopperBoxElement, markElement, 'right');
    } else if (this.editor.isActive('collapse')) {
      const node = $from.nodeAfter;
      if (node === null) {
        throw Error(`Can't find node at ${$from.pos}`);
      }

      const nodeElement = this.editor.options.element.querySelector(
        `span.collapse-item#${node.attrs.id}`
      );

      if (nodeElement === null) {
        throw Error(`Can't find span#${node.attrs.id}`);
      }
      updatePopperPopover(rightPopperBoxElement, nodeElement, 'right');
    }

    this.show();
  }

  show() {
    // this.tippy?.show();
  }

  hide() {
    // this.tippy?.hide();
  }

  destroy() {
    // if (this.tippy?.popper.firstChild) {
    //   (this.tippy.popper.firstChild as HTMLElement).removeEventListener(
    //     'blur',
    //     this.tippyBlurHandler
    //   );
    // }
    // this.tippy?.destroy();
    // this.element.removeEventListener('mousedown', this.mousedownHandler, {
    //   capture: true
    // });
    this.editor.off('focus', this.focusHandler);
    this.editor.off('blur', this.blurHandler);
  }
}

/**
 * Update the popper for the highlighted prompt point
 * @param popperElement Popper element
 * @param anchor Anchor point for the popper element
 */
const updatePopperPopover = (
  popperElement: HTMLElement,
  anchor: Element | VirtualElement,
  placement: 'bottom' | 'left' | 'top' | 'right'
) => {
  computePosition(anchor, popperElement, {
    placement: placement,
    middleware: [offset(6), flip(), shift()]
  }).then(({ x, y }) => {
    popperElement.style.left = `${x}px`;
    popperElement.style.top = `${y}px`;
  });
};

export const SidebarMenuPlugin = (options: SidebarMenuPluginProps) => {
  return new Plugin({
    key:
      typeof options.pluginKey === 'string'
        ? new PluginKey(options.pluginKey)
        : options.pluginKey,
    view: view => new SidebarMenuView({ view, ...options })
  });
};

export type SidebarMenuOptions = Omit<
  SidebarMenuPluginProps,
  'editor' | 'element'
>;

export const SidebarMenu = Extension.create<SidebarMenuOptions>({
  name: 'sidebar-menu',

  addOptions() {
    return {
      tippyOptions: {},
      pluginKey: 'sidebar-menu',
      rightPopperBox: null,
      shouldShow: null
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.rightPopperBox) {
      return [];
    }

    return [
      SidebarMenuPlugin({
        pluginKey: this.options.pluginKey,
        editor: this.editor,
        shouldShow: this.options.shouldShow,
        rightPopperBox: this.options.rightPopperBox
      })
    ];
  }
});

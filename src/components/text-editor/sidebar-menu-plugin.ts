import { Extension } from '@tiptap/core';
import { Editor, posToDOMRect } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { config } from '../../config/config';

const MENU_X_OFFSET = config.layout.sidebarMenuXOffset;

interface VirtualElement {
  getBoundingClientRect: () => DOMRect;
}

export interface PopperOptions {
  containerBBox: DOMRect;
  rightPopperBox: Promise<HTMLElement>;
}

type ShouldShow = (props: {
  editor: Editor;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
}) => boolean;

export interface SidebarMenuPluginProps {
  pluginKey: PluginKey | string;
  editor: Editor;
  popperOptions: PopperOptions;
}

export type SidebarMenuViewProps = SidebarMenuPluginProps & {
  view: EditorView;
};

export class SidebarMenuView {
  editor: Editor;
  popperOptions: PopperOptions;
  view: EditorView;
  preventHide = false;

  shouldShow: ShouldShow = props => {
    const editor = props.editor;

    if (editor.isActive('edit-highlight') || editor.isActive('collapse')) {
      return true;
    } else {
      return false;
    }
  };

  constructor(props: SidebarMenuViewProps) {
    const { editor, popperOptions, view } = props;
    console.log(props);

    if (popperOptions === undefined) {
      throw Error('popperOptions is null');
    }

    this.editor = editor;
    this.view = view;
    this.popperOptions = popperOptions;

    this.editor.on('focus', this.focusHandler);
    this.editor.on('blur', this.blurHandler);
  }

  focusHandler = ({ event }: { event: FocusEvent }) => {
    // we use `setTimeout` to make sure `selection` is already updated
    setTimeout(() => this.update(this.editor.view));
  };

  blurHandler = async ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;

      return;
    }

    // Do not hide if the user shifts focus to the menu
    const rightPopperBox = await this.popperOptions.rightPopperBox;
    if (
      event?.relatedTarget &&
      rightPopperBox.parentNode?.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    this.hide();
  };

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

    // Determine to show the menu box on the left or right based on the cursor
    // position
    const anchorCoord = view.coordsAtPos(selection.$anchor.pos);
    let boxPosition: 'left' | 'right' = 'right';
    if (
      anchorCoord.left <=
      this.popperOptions.containerBBox.x +
        this.popperOptions.containerBBox.width / 2
    ) {
      boxPosition = 'left';
    }

    const rightPopperBoxElement = await this.popperOptions.rightPopperBox;
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
      updatePopperPopover(
        rightPopperBoxElement,
        markElement,
        this.popperOptions.containerBBox,
        boxPosition
      );
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
      updatePopperPopover(
        rightPopperBoxElement,
        nodeElement,
        this.popperOptions.containerBBox,
        boxPosition
      );
    }

    this.show();
  }

  async show() {
    const rightPopperBoxElement = await this.popperOptions.rightPopperBox;
    rightPopperBoxElement.classList.remove('hidden');
  }

  async hide() {
    const rightPopperBoxElement = await this.popperOptions.rightPopperBox;
    rightPopperBoxElement.classList.add('hidden');
  }

  destroy() {
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
  containerBBox: DOMRect,
  boxPosition: 'left' | 'right'
) => {
  computePosition(anchor, popperElement, {
    placement: 'right',
    middleware: [offset(0), flip(), shift()]
  }).then(({ y }) => {
    if (boxPosition === 'left') {
      const offsetParentBBox =
        popperElement.offsetParent!.getBoundingClientRect();
      popperElement.style.left = 'unset';
      popperElement.style.right = `${
        offsetParentBBox.width - containerBBox.x + MENU_X_OFFSET
      }px`;
    } else {
      popperElement.style.right = 'unset';
      popperElement.style.left = `${
        containerBBox.x + containerBBox.width + MENU_X_OFFSET
      }px`;
    }
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
    const getDefaultPopperOptions = () => {
      const phantomElement = document.createElement('div');
      const rightPopperBox = Promise.resolve(phantomElement);
      const containerBBox: DOMRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        bottom: 0,
        left: 0,
        top: 0,
        right: 0,
        toJSON: () => ''
      };
      const defaultPopperOption: PopperOptions = {
        containerBBox,
        rightPopperBox
      };
      return defaultPopperOption;
    };

    return {
      pluginKey: 'sidebar-menu',
      popperOptions: getDefaultPopperOptions()
    };
  },

  addProseMirrorPlugins() {
    return [
      SidebarMenuPlugin({
        pluginKey: this.options.pluginKey,
        editor: this.editor,
        popperOptions: this.options.popperOptions
      })
    ];
  }
});

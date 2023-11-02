import { Extension } from '@tiptap/core';
import { Editor, posToDOMRect } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { config } from '../../config/config';
import { PromptLetSidebarMenu } from '../sidebar-menu/sidebar-menu';
import type { Mode } from '../sidebar-menu/sidebar-menu';
import type { EditHighlightAttributes } from './edit-highlight';
import type { CollapseAttributes } from './collapse-node';
import type { Node as PMNode } from '@tiptap/pm/model';

const MENU_X_OFFSET = config.layout.sidebarMenuXOffset;

interface VirtualElement {
  getBoundingClientRect: () => DOMRect;
}

export interface PopperOptions {
  containerBBox: DOMRect;
  popperSidebarBox: Promise<HTMLElement>;
}

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
  curShownActiveID: string | null = null;
  mode: Mode = 'add';
  oldText = '';
  newText = '';
  curBoxPosition: 'left' | 'right' = 'left';

  constructor(props: SidebarMenuViewProps) {
    const { editor, popperOptions, view } = props;

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
    setTimeout(() => {
      this.update(this.editor.view);
    });
  };

  blurHandler = async ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;

      return;
    }

    // Do not hide if the user shifts focus to the menu
    const popperSidebarBox = await this.popperOptions.popperSidebarBox;
    if (
      event?.relatedTarget &&
      popperSidebarBox.parentNode?.contains(event.relatedTarget as Node)
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

    let shouldShow = false;

    if (this.editor.isActive('edit-highlight')) {
      if ($from.marks().length > 0) {
        shouldShow = true;
      }
    } else if (this.editor.isActive('collapse')) {
      if ($from.nodeAfter !== null) {
        shouldShow = true;
      }
    }

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

    // Always show the box on the left for now
    boxPosition = 'left';

    const popperSidebarBoxElement = await this.popperOptions.popperSidebarBox;
    // Depending on the active element, we need to get the edit-highlight node
    // or the collapse node in the selection
    if (this.editor.isActive('edit-highlight')) {
      const mark = $from.marks()[0];
      const markAttribute = mark.attrs as EditHighlightAttributes;

      // Do not shift around the box if user has already selected the element
      if (markAttribute.id === this.curShownActiveID) {
        boxPosition = this.curBoxPosition;
      }

      // Extract the content of the current mark
      let markNode: PMNode | undefined;
      doc.content.descendants(n => {
        if (
          n.marks.some(
            m => (m.attrs as EditHighlightAttributes).id === markAttribute.id
          )
        ) {
          markNode = n;
          return false;
        }
      });

      if (markNode === undefined || markNode.text === undefined) {
        throw Error('Cannot find mark node.');
      }

      this.oldText = markAttribute.oldText;
      this.newText = markNode.text;

      // Determine the mode of this edit
      // If there no original text => add
      // If there is original text => replace
      if (markAttribute.oldText.length === 0) {
        this.mode = 'add';
      } else {
        this.mode = 'replace';
      }
      const markElement = this.editor.options.element.querySelector(
        `mark#${mark.attrs.id}`
      );
      this.curShownActiveID = mark.attrs.id as string;

      if (markElement === null) {
        throw Error(`Can't find mark#${mark.attrs.id}`);
      }

      // Update popper
      this.updatePopperPopover(
        popperSidebarBoxElement,
        markElement,
        boxPosition
      );
      this.curBoxPosition = boxPosition;
    } else if (this.editor.isActive('collapse')) {
      const node = $from.nodeAfter;
      if (node === null) {
        throw Error(`Can't find node at ${$from.pos}`);
      }
      const nodeAttrs = node.attrs as CollapseAttributes;
      this.mode = 'delete';
      this.oldText = nodeAttrs['deleted-text'];
      this.newText = '';

      // Do not shift around the box if user has already selected the element
      if (nodeAttrs.id === this.curShownActiveID) {
        boxPosition = this.curBoxPosition;
      }

      const nodeElement = this.editor.options.element.querySelector(
        `span.collapse-item#${nodeAttrs.id}`
      );
      this.curShownActiveID = nodeAttrs.id as string;

      if (nodeElement === null) {
        throw Error(`Can't find span#${nodeAttrs.id}`);
      }

      // Update popper
      this.updatePopperPopover(
        popperSidebarBoxElement,
        nodeElement,
        boxPosition
      );
      this.curBoxPosition = boxPosition;
    }

    this.show();
  }

  async show() {
    const popperSidebarBoxElement = await this.popperOptions.popperSidebarBox;
    popperSidebarBoxElement.classList.remove('hidden');
  }

  async hide() {
    this.curShownActiveID = null;
    const popperSidebarBoxElement = await this.popperOptions.popperSidebarBox;
    popperSidebarBoxElement.classList.add('hidden');
  }

  destroy() {
    this.editor.off('focus', this.focusHandler);
    this.editor.off('blur', this.blurHandler);
  }

  /**
   * Update the popper for the highlighted prompt point
   * @param popperElement Popper element
   * @param anchor Anchor point for the popper element
   */
  updatePopperPopover = (
    popperElement: HTMLElement,
    anchor: Element | VirtualElement,
    boxPosition: 'left' | 'right'
  ) => {
    const containerBBox = this.popperOptions.containerBBox;

    const menuElement = popperElement.querySelector(
      'promptlet-sidebar-menu'
    ) as PromptLetSidebarMenu;

    // Pass data to the menu component
    menuElement.mode = this.mode;
    menuElement.oldText = this.oldText;
    menuElement.newText = this.newText;

    computePosition(anchor, popperElement, {
      placement: 'right',
      middleware: [offset(0), flip(), shift()]
    }).then(({ y }) => {
      if (boxPosition === 'left') {
        // Set the 'is-on-left' property of the component
        menuElement.isOnLeft = true;

        const offsetParentBBox =
          popperElement.offsetParent!.getBoundingClientRect();
        popperElement.style.left = 'unset';
        popperElement.style.right = `${
          offsetParentBBox.width - containerBBox.x + MENU_X_OFFSET
        }px`;
      } else {
        // Set the 'is-on-left' property of the component
        menuElement.isOnLeft = false;

        popperElement.style.right = 'unset';
        popperElement.style.left = `${
          containerBBox.x + containerBBox.width + MENU_X_OFFSET
        }px`;
      }
      popperElement.style.top = `${y}px`;
    });
  };
}

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
      const phantomPromise = Promise.resolve(phantomElement);
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
        popperSidebarBox: phantomPromise
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

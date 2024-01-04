import { Extension } from '@tiptap/core';
import { Editor, posToDOMRect } from '@tiptap/core';
import { EditorState, Plugin, PluginKey, PluginView } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

// Types
import type { Mode, SidebarSummaryCounter } from '../sidebar-menu/sidebar-menu';
import type { EditHighlightAttributes } from './edit-highlight';
import type { CollapseAttributes } from './collapse-node';
import type { Node as PMNode, Mark } from '@tiptap/pm/model';
import type { UpdateSidebarMenuProps } from '../wordflow/wordflow';

export interface PopperOptions {
  containerBBox: DOMRect;
  popperSidebarBox: Promise<HTMLElement>;
  updateSidebarMenu: (props: UpdateSidebarMenuProps) => Promise<void>;
}

export interface SidebarMenuPluginProps {
  pluginKey: PluginKey | string;
  editor: Editor;
  popperOptions: PopperOptions;
}

export type SidebarMenuViewProps = SidebarMenuPluginProps & {
  view: EditorView;
};

interface MarkCounter {
  addMarks: Mark[];
  replaceMarks: Mark[];
  deleteNodes: PMNode[];
}

const _getDefaultDomRect = (): DOMRect => {
  return {
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
};

export class SidebarMenuView implements PluginView {
  editor: Editor;
  popperOptions: PopperOptions;
  popperParentBBox: DOMRect;
  view: EditorView;
  preventHide = false;
  curShownActiveID: string | null = null;
  mode: Mode = 'add';
  oldText = '';
  newText = '';
  summaryCounter: SidebarSummaryCounter | null = null;
  curBoxPosition: 'left' | 'right' = 'left';

  constructor(props: SidebarMenuViewProps) {
    const { editor, popperOptions, view } = props;

    if (popperOptions === undefined) {
      throw Error('popperOptions is null');
    }

    this.editor = editor;
    this.view = view;
    this.popperOptions = popperOptions;
    this.popperParentBBox = _getDefaultDomRect();

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
    const { $from, $to } = selection;

    const isSame =
      oldState && oldState.doc.eq(doc) && oldState.selection.eq(selection);

    if (isSame) {
      return;
    }

    let shouldShow = false;

    // Check if the user has clicked the highlighted text
    if (this.editor.isActive('edit-highlight')) {
      if ($from.marks().length > 0) {
        shouldShow = true;
      }
    } else if (this.editor.isActive('collapse')) {
      if ($from.nodeAfter !== null) {
        shouldShow = true;
      }
    }

    // Check if the selected region includes special nodes
    const counter: MarkCounter = {
      addMarks: [],
      replaceMarks: [],
      deleteNodes: []
    };

    if (selection) {
      state.doc.nodesBetween($from.pos, $to.pos, node => {
        for (const mark of node.marks) {
          const markAttribute = mark.attrs as EditHighlightAttributes;
          if (mark.type.name === 'edit-highlight') {
            if (markAttribute.oldText.length === 0) {
              counter.addMarks.push(mark);
            } else {
              counter.replaceMarks.push(mark);
            }
            break;
          }
        }

        if (node.type.name === 'collapse') {
          counter.deleteNodes.push(node);
        }
      });

      if (
        counter.addMarks.length +
          counter.replaceMarks.length +
          counter.deleteNodes.length >
        0
      ) {
        shouldShow = true;
      }
    }

    if (!shouldShow) {
      this.hide();
      return;
    }

    await this.updatePosition(view, counter);
    this.show();
  }

  async updatePosition(view: EditorView, markCounter: MarkCounter) {
    const { state } = view;
    const { doc, selection } = state;
    const { $from } = selection;

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

    // Depending on the active element, we need to get the edit-highlight node
    // or the collapse node in the selection
    if (this.editor.isActive('edit-highlight')) {
      const mark = $from.marks()[0];
      if (mark === undefined) return;

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
      await this.popperOptions.updateSidebarMenu({
        anchor: markElement,
        boxPosition,
        editor: this.editor,
        newText: this.newText,
        oldText: this.oldText,
        mode: this.mode,
        summaryCounter: null
      });
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
      this.popperOptions.updateSidebarMenu({
        anchor: nodeElement,
        boxPosition,
        editor: this.editor,
        newText: this.newText,
        oldText: this.oldText,
        mode: this.mode,
        summaryCounter: null
      });
      this.curBoxPosition = boxPosition;
    } else if (
      markCounter.addMarks.length +
        markCounter.replaceMarks.length +
        markCounter.deleteNodes.length >
      0
    ) {
      // Allow users to accept all and reject all
      this.mode = 'summary';
      this.oldText = '';
      this.newText = '';

      // Use the first highlight or collapse node to anchor the sidebar
      let nodeElement: Element | null = null;

      if (
        markCounter.addMarks.length > 0 ||
        markCounter.replaceMarks.length > 0
      ) {
        const mark = markCounter.addMarks[0] || markCounter.replaceMarks[0];
        nodeElement = this.editor.options.element.querySelector(
          `mark#${mark.attrs.id}`
        );
        this.curBoxPosition = boxPosition;

        if (nodeElement === null) {
          throw Error(`Can't find span#${mark.attrs.id}`);
        }
      } else {
        const node = markCounter.deleteNodes[0];
        nodeElement = this.editor.options.element.querySelector(
          `span.collapse-item#${node.attrs.id}`
        );
        this.curBoxPosition = boxPosition;

        if (nodeElement === null) {
          throw Error(`Can't find span#${node.attrs.id}`);
        }
      }

      // Update popper
      this.popperOptions.updateSidebarMenu({
        anchor: nodeElement,
        boxPosition,
        editor: this.editor,
        newText: this.newText,
        oldText: this.oldText,
        mode: this.mode,
        summaryCounter: {
          add: markCounter.addMarks.length,
          replace: markCounter.replaceMarks.length,
          delete: markCounter.deleteNodes.length
        }
      });
    }
  }

  async show() {
    const popperSidebarBoxElement = await this.popperOptions.popperSidebarBox;
    popperSidebarBoxElement.classList.remove('hidden');

    // Also set the component's attribute to set button's cursor to default when hidden
    const sidebarComponent = popperSidebarBoxElement.querySelector(
      'wordflow-sidebar-menu'
    );
    sidebarComponent?.removeAttribute('isHidden');
  }

  async hide() {
    this.curShownActiveID = null;
    const popperSidebarBoxElement = await this.popperOptions.popperSidebarBox;
    popperSidebarBoxElement.classList.add('hidden');

    // Also set the component's attribute to set button's cursor to default when hidden
    const sidebarComponent = popperSidebarBoxElement.querySelector(
      'wordflow-sidebar-menu'
    );
    sidebarComponent?.setAttribute('isHidden', 'true');
  }

  destroy() {
    this.editor.off('focus', this.focusHandler);
    this.editor.off('blur', this.blurHandler);
  }
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
      const containerBBox: DOMRect = _getDefaultDomRect();
      const defaultPopperOption: PopperOptions = {
        containerBBox,
        popperSidebarBox: phantomPromise,
        updateSidebarMenu: () => Promise.resolve()
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

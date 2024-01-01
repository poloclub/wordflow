import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { Editor } from '@tiptap/core';

export interface EventHandlerProps {
  floatingMenuBox: Promise<HTMLElement>;
}

export const EventHandler = Extension.create<EventHandlerProps>({
  name: 'eventHandler',

  onSelectionUpdate() {
    updateFloatingMenuPosition(this.options, this.editor, this.editor.view);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('eventHandler'),
        props: {}
      })
    ];
  }
});

/**
 * Update the position of the floating menu
 * @param options Props
 * @param editor Editor
 * @param view Editor view
 */
const updateFloatingMenuPosition = async (
  options: EventHandlerProps,
  editor: Editor,
  view: EditorView
) => {
  const floatingMenuBox = await options.floatingMenuBox;
  const $from = view.state.selection.$from;
  const cursorCoordinate = view.coordsAtPos($from.pos);

  // Need to bound the box inside the view
  const floatingMenuBoxBBox = floatingMenuBox.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const invisibleHeight = window.scrollY;

  // Get the line height in the editor element
  const lineHeight = parseInt(
    window.getComputedStyle(editor.options.element).lineHeight
  );

  const PADDING_OFFSET = 5;
  const minTop =
    invisibleHeight + floatingMenuBoxBBox.height / 2 + PADDING_OFFSET;
  const maxTop =
    windowHeight +
    invisibleHeight -
    floatingMenuBoxBBox.height / 2 -
    PADDING_OFFSET;
  const idealTop = cursorCoordinate.top + invisibleHeight + lineHeight / 2;
  const boundedTop = Math.min(maxTop, Math.max(minTop, idealTop));

  floatingMenuBox.style.marginTop = `${boundedTop}px`;
};

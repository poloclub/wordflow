import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { Editor } from '@tiptap/core';

export interface EventHandlerProps {
  containerBBox: DOMRect;
  floatingMenuBox: Promise<HTMLElement>;
}

export const EventHandler = Extension.create<EventHandlerProps>({
  name: 'eventHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('eventHandler'),
        props: {
          handleClick: (view, pos, event) => {
            clickHandler(this.options, this.editor, view, pos, event);
          }
        }
      })
    ];
  }
});

const clickHandler = async (
  options: EventHandlerProps,
  editor: Editor,
  view: EditorView,
  pos: number,
  _event: MouseEvent
) => {
  const containerBBox = options.containerBBox;
  const floatingMenuBox = await options.floatingMenuBox;
  const cursorCoordinate = view.coordsAtPos(pos);

  // Need to bound the box inside the view
  const floatingMenuBoxBBox = floatingMenuBox.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  // Get the line height in the editor element
  const lineHeight = parseInt(
    window.getComputedStyle(editor.options.element).lineHeight
  );

  const PADDING_OFFSET = 5;
  const minTop = floatingMenuBoxBBox.height / 2 + PADDING_OFFSET;
  const maxTop = windowHeight - floatingMenuBoxBBox.height / 2 - PADDING_OFFSET;
  const idealTop = cursorCoordinate.top + lineHeight / 2;
  const boundedTop = Math.min(maxTop, Math.max(minTop, idealTop));

  floatingMenuBox.style.left = `${containerBBox.x + containerBBox.width}px`;
  floatingMenuBox.style.top = `${boundedTop}px`;
};

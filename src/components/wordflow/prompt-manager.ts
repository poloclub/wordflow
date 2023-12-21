import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';

import fakePromptsJSON from '../../data/fake-prompts-100.json';

// Constants
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

export class PromptManager {
  localPrompts: PromptDataLocal[];
  localPromptsUpdateCallback: (newLocalPrompts: PromptDataLocal[]) => void;
  favPromptsUpdateCallback: (newFavPrompts: PromptDataLocal[]) => void;

  favPrompts: PromptDataLocal[];

  constructor(
    localPromptsUpdateCallback: (newLocalPrompts: PromptDataLocal[]) => void,
    favPromptsUpdateCallback: (newFavPrompts: PromptDataLocal[]) => void
  ) {
    this.localPrompts = fakePrompts.slice(0, 4);
    this.localPromptsUpdateCallback = localPromptsUpdateCallback;
    this.localPromptsUpdateCallback(this.localPrompts);

    this.favPrompts = fakePrompts.slice(0, 3);
    this.favPromptsUpdateCallback = favPromptsUpdateCallback;
    this.favPromptsUpdateCallback(this.favPrompts);
  }

  addPrompt(newPrompt: PromptDataLocal) {
    this.localPrompts.push(newPrompt);
    this.localPromptsUpdateCallback(this.localPrompts);
  }
}

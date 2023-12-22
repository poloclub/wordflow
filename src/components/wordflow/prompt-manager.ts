import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';
import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';

import fakePromptsJSON from '../../data/fake-prompts-100.json';

const PREFIX = 'local-prompt';

// Constants
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

for (const p of fakePrompts) {
  p.key = uuidv4();
}

export class PromptManager {
  localPrompts: PromptDataLocal[];
  localPromptsUpdateCallback: (newLocalPrompts: PromptDataLocal[]) => void;

  favPrompts: PromptDataLocal[];
  favPromptsUpdateCallback: (newFavPrompts: PromptDataLocal[]) => void;

  promptKeys: string[] = [];
  favPromptKeys: string[] = [];

  restoreFinished: Promise<void>;

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

    // Reconstruct the prompts from the indexed db
    this.restoreFinished = this.restoreFromStorage().then(() => {
      // Use recency as the default order
      this.sortPrompts('created');
    });

    // this._cleanStorage();
    // this._syncStorage();
  }

  /**
   * Reconstruct the prompts from the local storage.
   */
  async restoreFromStorage() {
    // Restore the local prompts
    const promptKeys = (await get(`${PREFIX}-keys`)) as string[] | undefined;

    if (promptKeys !== undefined) {
      this.promptKeys = [];
      this.localPrompts = [];

      this.promptKeys = promptKeys;
      for (const key of this.promptKeys) {
        const prompt = (await get(`${PREFIX}-${key}`)) as
          | PromptDataLocal
          | undefined;
        if (prompt === undefined) {
          throw Error(`Can't access prompt with key ${key}`);
        }
        this.localPrompts.push(prompt);
      }
    }

    // Notify the consumers
    this.localPromptsUpdateCallback(this.localPrompts);

    // Restore the fav prompts
    const favPromptKeys = (await get(`${PREFIX}-fav-keys`)) as
      | string[]
      | undefined;

    if (favPromptKeys !== undefined) {
      this.favPromptKeys = favPromptKeys;
    }

    console.log(this.promptKeys);
    console.log(this.localPrompts);
    console.log(this.favPromptKeys);
  }

  /**
   * Add a new prompt
   * @param newPrompt New prompt
   */
  addPrompt(newPrompt: PromptDataLocal) {
    this.promptKeys.unshift(newPrompt.key);
    this.localPrompts.unshift(newPrompt);

    // Save the prompt and new keys in indexed db
    set(`${PREFIX}-${newPrompt.key}`, newPrompt);
    set(`${PREFIX}-keys`, this.promptKeys);

    this.localPromptsUpdateCallback(this.localPrompts);
  }

  /**
   * Update the prompt at the index of localPrompts. This method doesn't change
   * the prompt key.
   * @param index Index of the prompt in localPrompts to update
   * @param newPrompt New prompt
   */
  setPrompt(index: number, newPrompt: PromptDataLocal) {
    this.localPrompts[index] = newPrompt;

    // Update the prompt in local storage
    const key = this.promptKeys[index];
    set(`${PREFIX}-${key}`, newPrompt);

    this.localPromptsUpdateCallback(this.localPrompts);
  }

  /**
   * Delete a prompt in the localPrompts
   * @param index Index of the prompt in localPrompts
   */
  deletePrompt(index: number) {
    const key = this.promptKeys[index];

    this.localPrompts.splice(index, 1);
    this.promptKeys.splice(index, 1);

    // Remove the prompt from indexed db
    del(`${PREFIX}-${key}`);
    set(`${PREFIX}-keys`, this.promptKeys);

    this.localPromptsUpdateCallback(this.localPrompts);
  }

  /**
   * Update the prompt at the index of favPrompts
   * @param index Index of the prompt in favPrompts to update (fav slot index)
   * @param newPrompt New prompt
   */
  setFavPrompt(index: number, newPrompt: PromptDataLocal) {
    this.favPrompts[index] = newPrompt;
    this.favPromptKeys[index] = newPrompt.key;

    // Update indexed db
    set(`${PREFIX}-fav-keys`, this.favPromptKeys);

    this.favPromptsUpdateCallback(this.favPrompts);
  }

  /**
   * Sort the local prompts by an order
   * @param order Order of the new local prompts
   */
  sortPrompts(order: 'name' | 'created' | 'runCount') {
    switch (order) {
      case 'name': {
        this.localPrompts.sort((a, b) => a.title.localeCompare(b.title));

        break;
      }

      case 'created': {
        // Recent prompts at front
        this.localPrompts.sort((a, b) => b.created.localeCompare(a.created));
        break;
      }

      case 'runCount': {
        this.localPrompts.sort((a, b) => b.promptRunCount - a.promptRunCount);
        break;
      }

      default: {
        throw Error(`Unknown order ${order}`);
      }
    }

    this.promptKeys = this.localPrompts.map(d => d.key);
    set(`${PREFIX}-keys`, this.promptKeys);

    this.localPromptsUpdateCallback(structuredClone(this.localPrompts));
    console.log(this.localPrompts);
  }

  /**
   * Remove all local storage set by PromptManager.
   */
  _cleanStorage() {
    clear();
  }

  /**
   * Sync localPrompts and keys to storage
   */
  _syncStorage() {
    this.promptKeys = [];
    for (const [_, prompt] of this.localPrompts.entries()) {
      this.promptKeys.push(prompt.key);
      set(`${PREFIX}-${prompt.key}`, prompt);
    }

    this.favPromptKeys = [];
    for (const prompt of this.favPrompts) {
      this.favPromptKeys.push(prompt.key);
    }

    set(`${PREFIX}-keys`, this.promptKeys);
    set(`${PREFIX}-fav-keys`, this.favPromptKeys);
  }
}

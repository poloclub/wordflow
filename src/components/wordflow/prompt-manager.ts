import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';
import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';

import fakePromptsJSON from '../../data/fake-prompts-100.json';

const PREFIX = 'local-prompt';

// Constants
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

for (const p of fakePrompts) {
  p.key = uuidv4();
  p.injectionMode = 'replace';
  p.temperature = 0.2;
  p.recommendedModels = [];
}

export class PromptManager {
  localPrompts: PromptDataLocal[] = [];
  localPromptsProjection: PromptDataLocal[] | null = null;
  localPromptsUpdateCallback: (newLocalPrompts: PromptDataLocal[]) => void;
  localPromptCount = 0;

  favPrompts: [
    PromptDataLocal | null,
    PromptDataLocal | null,
    PromptDataLocal | null
  ] = [null, null, null];
  favPromptsUpdateCallback: (
    newFavPrompts: [
      PromptDataLocal | null,
      PromptDataLocal | null,
      PromptDataLocal | null
    ]
  ) => void;

  promptKeys: string[] = [];
  favPromptKeys: [string | null, string | null, string | null] = [
    null,
    null,
    null
  ];

  restoreFinished: Promise<void>;

  constructor(
    localPromptsUpdateCallback: (newLocalPrompts: PromptDataLocal[]) => void,
    favPromptsUpdateCallback: (
      newFavPrompts: [
        PromptDataLocal | null,
        PromptDataLocal | null,
        PromptDataLocal | null
      ]
    ) => void
  ) {
    this.localPrompts = fakePrompts.slice(0, 4);
    this.localPromptsUpdateCallback = localPromptsUpdateCallback;
    this.localPromptsUpdateCallback(structuredClone(this.localPrompts));

    this.favPrompts = [null, null, null];
    this.favPrompts[0] = fakePrompts[0];
    this.favPrompts[1] = fakePrompts[1];
    this.favPrompts[2] = fakePrompts[2];

    this.favPromptsUpdateCallback = favPromptsUpdateCallback;
    this.favPromptsUpdateCallback(structuredClone(this.favPrompts));

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

    // Restore the fav prompts
    const favPromptKeys = (await get(`${PREFIX}-fav-keys`)) as
      | [string | null, string | null, string | null]
      | undefined;

    if (favPromptKeys !== undefined) {
      this.favPromptKeys = favPromptKeys;

      this.favPrompts = [null, null, null];
      for (const [i, key] of this.favPromptKeys.slice(0, 3).entries()) {
        if (key !== null) {
          const promptIndex = this.promptKeys.indexOf(key);
          this.favPrompts[i] = this.localPrompts[promptIndex];
        }
      }
    }

    // Notify the consumers
    this._broadcastLocalPrompts();
    this._broadcastFavPrompts();

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

    // If the user is in the search mode, add the new prompt to the search
    // result regardless its content
    if (this.localPromptsProjection !== null) {
      this.localPromptsProjection.unshift(newPrompt);
      this._broadcastLocalPromptsProjection();
    } else {
      this._broadcastLocalPrompts();
    }
  }

  /**
   * Update the prompt in the localPrompts. This method doesn't change
   * the prompt key.
   * @param newPrompt New prompt
   */
  setPrompt(newPrompt: PromptDataLocal) {
    // Find the index of this prompt based on its key
    let index = -1;
    for (const [i, p] of this.localPrompts.entries()) {
      if (p.key === newPrompt.key) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      throw Error(`Can't find they key ${newPrompt.key}.`);
    }

    this.localPrompts[index] = newPrompt;

    // Update the prompt in indexed db
    const key = this.promptKeys[index];
    set(`${PREFIX}-${key}`, newPrompt);

    // If the user is in the search mode, also update the prompt in the search projection
    if (this.localPromptsProjection !== null) {
      for (const [i, p] of this.localPromptsProjection.entries()) {
        if (p.key === newPrompt.key) {
          this.localPromptsProjection[i] = newPrompt;
          break;
        }
      }
      this._broadcastLocalPromptsProjection();
    } else {
      this._broadcastLocalPrompts();
    }

    // If this prompt is a fav prompt, also update them from fav prompts
    const allFavIndexes = this.favPromptKeys.reduce(
      (
        indexes: number[],
        currentValue: string | null,
        currentIndex: number
      ) => {
        if (currentValue === newPrompt.key) {
          indexes.push(currentIndex);
        }
        return indexes;
      },
      []
    );

    if (allFavIndexes.length !== 0) {
      for (const favIndex of allFavIndexes) {
        this.favPrompts[favIndex] = newPrompt;
      }
      this._broadcastFavPrompts();
    }
  }

  /**
   * Delete a prompt in the localPrompts
   * @param prompt The prompt to delete
   */
  deletePrompt(prompt: PromptDataLocal) {
    // Find the index of this prompt based on its key
    let index = -1;
    for (const [i, p] of this.localPrompts.entries()) {
      if (p.key === prompt.key) {
        index = i;
      }
    }

    if (index === -1) {
      throw Error(`Can't find they key ${prompt.key}.`);
    }

    // Remove it from local prompts
    this.localPrompts.splice(index, 1);
    this.promptKeys.splice(index, 1);

    // Remove the prompt from indexed db
    del(`${PREFIX}-${prompt.key}`);
    set(`${PREFIX}-keys`, this.promptKeys);

    // If the user is in the searching mode, also delete the prompt there if possible
    if (this.localPromptsProjection !== null) {
      for (const [i, p] of this.localPromptsProjection.entries()) {
        if (p.key === prompt.key) {
          this.localPromptsProjection.splice(i, 1);
          break;
        }
      }

      this._broadcastLocalPromptsProjection();
    } else {
      this._broadcastLocalPrompts();
    }

    // If this prompt is a fav prompt, also remove it from fav prompts
    const allFavIndexes = this.favPromptKeys.reduce(
      (
        indexes: number[],
        currentValue: string | null,
        currentIndex: number
      ) => {
        if (currentValue === prompt.key) {
          indexes.push(currentIndex);
        }
        return indexes;
      },
      []
    );

    if (allFavIndexes.length !== 0) {
      for (const favIndex of allFavIndexes) {
        this.favPromptKeys[favIndex] = null;
        this.favPrompts[favIndex] = null;
      }

      set(`${PREFIX}-fav-keys`, this.favPromptKeys);
      this._broadcastFavPrompts();
    }
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

    this._broadcastFavPrompts();
  }

  /**
   * Sort the local prompts by an order
   * @param order Order of the new local prompts
   */
  sortPrompts(order: 'name' | 'created' | 'runCount') {
    switch (order) {
      case 'name': {
        this.localPrompts.sort((a, b) => a.title.localeCompare(b.title));
        this.localPromptsProjection?.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        break;
      }

      case 'created': {
        // Recent prompts at front
        this.localPrompts.sort((a, b) => b.created.localeCompare(a.created));
        this.localPromptsProjection?.sort((a, b) =>
          b.created.localeCompare(a.created)
        );
        break;
      }

      case 'runCount': {
        this.localPrompts.sort((a, b) => b.promptRunCount - a.promptRunCount);
        this.localPromptsProjection?.sort(
          (a, b) => b.promptRunCount - a.promptRunCount
        );
        break;
      }

      default: {
        throw Error(`Unknown order ${order}`);
      }
    }

    this.promptKeys = this.localPrompts.map(d => d.key);
    set(`${PREFIX}-keys`, this.promptKeys);

    if (this.localPromptsProjection !== null) {
      // The user is in the search mode
      this._broadcastLocalPromptsProjection();
    } else {
      this._broadcastLocalPrompts();
    }
  }

  /**
   * Search all prompts and only show prompts including the query
   * @param query Search query
   */
  searchPrompt(query: string) {
    if (query === '') {
      // Cancel the search
      this.localPromptsProjection = null;
      this._broadcastLocalPrompts();
    } else {
      // Create a projection of the local prompts that only include search results
      this.localPromptsProjection = [];
      const queryLower = query.toLowerCase();

      for (const prompt of this.localPrompts) {
        const promptInfoString = JSON.stringify(prompt).toLocaleLowerCase();
        if (promptInfoString.includes(queryLower)) {
          this.localPromptsProjection.push(prompt);
        }
      }

      this._broadcastLocalPromptsProjection();
    }
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

    this.favPromptKeys = [null, null, null];
    for (const prompt of this.favPrompts) {
      this.favPromptKeys.push(prompt ? prompt.key : null);
    }

    set(`${PREFIX}-keys`, this.promptKeys);
    set(`${PREFIX}-fav-keys`, this.favPromptKeys);
  }

  /**
   * Pass the localPrompts to consumers as their localPrompts
   */
  _broadcastLocalPrompts() {
    this.localPromptCount = this.localPrompts.length;
    this.localPromptsUpdateCallback(structuredClone(this.localPrompts));
  }

  /**
   * Pass the localPromptsProjection to consumers as their localPrompts
   */
  _broadcastLocalPromptsProjection() {
    if (this.localPromptsProjection === null) {
      throw Error('localPromptsProjection is null');
    }
    this.localPromptCount = this.localPrompts.length;
    this.localPromptsUpdateCallback(
      structuredClone(this.localPromptsProjection)
    );
  }

  /**
   * Pass the favPrompts to consumers as their favPrompts
   */
  _broadcastFavPrompts() {
    this.favPromptsUpdateCallback(structuredClone(this.favPrompts));
  }
}

import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';

import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';
import fakePromptsJSON from '../../data/fake-prompts-100.json';

interface PromptPOSTBody extends PromptDataLocal {
  created: never;
  promptRunCount: never;
  key: never;
}

// Constants
const PREFIX = 'remote-prompt';
const ENDPOINT =
  'https://hlbrqjhb52.execute-api.localhost.localstack.cloud:4566/prod/records';
const fakePrompts = fakePromptsJSON as PromptDataLocal[];

const userID = localStorage.getItem('user-id')!;
for (const p of fakePrompts) {
  p.key = uuidv4();
  p.injectionMode = 'replace';
  p.temperature = 0.2;
  p.recommendedModels = [];
  p.outputParsingPattern = '';
  p.outputParsingReplacement = '';
  p.userID = userID;
  p.recommendedModels = [
    'gpt-3.5',
    'palm-2',
    'gpt-4',
    'gemini-pro',
    'llama-2',
    'gemini-ultra'
  ];
}

export class RemotePromptManager {
  remotePrompts: PromptDataRemote[] = [];
  remotePromptsUpdateCallback: (newRemotePrompts: PromptDataRemote[]) => void;

  promptIsSubset = false;

  constructor(
    remotePromptsUpdateCallback: (newRemotePrompts: PromptDataRemote[]) => void
  ) {
    this.remotePromptsUpdateCallback = remotePromptsUpdateCallback;

    // console.log('Start populating prompts...');
    // console.time('Populating prompts');
    // this._populateRemotePrompts().then(() => {
    //   // Use fake data for testing
    //   this.getPopularPrompts();
    //   console.timeEnd('Populating prompts');
    // });
  }

  /**
   * Load the most popular remote prompts
   */
  async getPopularPrompts() {
    const url = new URL(ENDPOINT);

    url.searchParams.append('tag', '');
    url.searchParams.append('mostPopular', 'true');

    const response = await fetch(url.toString());
    this.remotePrompts = (await response.json()) as PromptDataRemote[];

    // Check if the response is not complete
    const isSubset = response.headers.get('x-has-pagination');
    this.promptIsSubset = isSubset === 'true';

    this._broadcastRemotePrompts();
  }

  /**
   * Get the newest prompts.
   */
  async getNewPrompts() {
    const url = new URL(ENDPOINT);

    url.searchParams.append('tag', '');
    url.searchParams.append('mostRecent', 'true');

    const response = await fetch(url.toString());
    this.remotePrompts = (await response.json()) as PromptDataRemote[];

    // Check if the response is not complete
    const isSubset = response.headers.get('x-has-pagination');
    this.promptIsSubset = isSubset === 'true';

    this._broadcastRemotePrompts();
  }

  /**
   * Get a list of the most popular tags.
   */
  getPopularTags() {
    // TODO
  }

  /**
   * Query prompts based on tags
   * @param tags Array of tag strings
   */
  getPromptByTag(tags: string[]) {
    // TODO
  }

  /**
   * Fork a remote prompt into local library
   * @param prompt Remote prompt
   */
  forkPrompt(prompt: PromptDataRemote) {
    // TODO
  }

  /**
   * Share a local prompt to the server
   * @param prompt Local prompt
   */
  async sharePrompt(prompt: PromptDataLocal) {
    const url = new URL(ENDPOINT);
    url.searchParams.append('type', 'prompt');

    const promptBody = { ...prompt } as PromptPOSTBody;
    delete promptBody.created;
    delete promptBody.promptRunCount;
    delete promptBody.key;

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promptBody)
    };

    await fetch(url.toString(), requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Request error:', error);
      });
  }

  /**
   * Inference the local prompt
   * @param prompt Local prompt
   * @param inputText input text string
   */
  runPrompt(prompt: PromptDataLocal, inputText: string) {
    // TODO
  }

  /**
   * Load all records
   */
  async _getAllRecords() {
    const url = new URL(ENDPOINT);
    url.searchParams.append('getAll', 'true');

    const response = await fetch(url.toString());
    const data = (await response.json()) as PromptDataRemote[];
    return data;
  }

  /**
   * Pass the remotePrompts to consumers as their remotePrompts
   */
  _broadcastRemotePrompts() {
    this.remotePromptsUpdateCallback(structuredClone(this.remotePrompts));
  }

  /**
   * Initialize remote servers with fake prompts
   */
  async _populateRemotePrompts() {
    const promises: Promise<void>[] = [];
    for (const p of fakePrompts.slice(0, 10)) {
      const promise = this.sharePrompt(p);
      promises.push(promise);
    }
    await Promise.all(promises);
  }
}

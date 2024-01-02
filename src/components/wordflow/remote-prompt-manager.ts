import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';

import type {
  PromptDataLocal,
  PromptDataRemote,
  TagData
} from '../../types/wordflow';
import fakePromptsJSON from '../../data/fake-prompts-100.json';
import { config } from '../../config/config';

interface PromptPOSTBody extends PromptDataLocal {
  created: never;
  promptRunCount: never;
  key: never;
}

// Constants
const PREFIX = 'remote-prompt';
const ENDPOINT = config.urls.wordflowEndpoint;
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

  popularTags: TagData[] = [];
  popularTagsUpdateCallback: (popularTags: TagData[]) => void;

  constructor(
    remotePromptsUpdateCallback: (newRemotePrompts: PromptDataRemote[]) => void,
    popularTagsUpdateCallback: (popularTags: TagData[]) => void
  ) {
    this.remotePromptsUpdateCallback = remotePromptsUpdateCallback;
    this.popularTagsUpdateCallback = popularTagsUpdateCallback;

    // console.log('Start populating prompts...');
    // console.time('Populating prompts');
    // this._populateRemotePrompts(55).then(() => {
    //   // Use fake data for testing
    //   this.getPromptsByTag('', 'popular');
    //   this.getPopularTags();
    //   console.timeEnd('Populating prompts');
    // });
  }

  /**
   * Get a list of the most popular tags.
   */
  async getPopularTags() {
    const url = new URL(ENDPOINT);
    url.searchParams.append('popularTags', 'true');

    const requestOptions: RequestInit = {
      method: 'GET',
      credentials: 'include'
    };
    const response = await fetch(url.toString(), requestOptions);
    this.popularTags = (await response.json()) as TagData[];

    // Filter ou the empty tag
    this.popularTags = this.popularTags.filter(d => d.tag !== '');
    this._broadcastPopularTags();
  }

  /**
   * Query prompts based on tags.
   * @param tag A tag string. If tag is '', query all prompts.
   * @param orderMode Prompt query order
   */
  async getPromptsByTag(tag: string, orderMode: 'new' | 'popular') {
    const url = new URL(ENDPOINT);

    url.searchParams.append('tag', tag);

    if (orderMode === 'new') {
      url.searchParams.append('mostRecent', 'true');
    } else {
      url.searchParams.append('mostPopular', 'true');
    }

    const requestOptions: RequestInit = {
      method: 'GET',
      credentials: 'include'
    };
    const response = await fetch(url.toString(), requestOptions);
    this.remotePrompts = (await response.json()) as PromptDataRemote[];

    // Check if the response is not complete
    const isSubset = response.headers.get('x-has-pagination');
    this.promptIsSubset = isSubset === 'true';

    this._broadcastRemotePrompts();
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
      body: JSON.stringify(promptBody),
      credentials: 'include'
    };

    const response = await fetch(url.toString(), requestOptions);
    return response.status;
  }

  /**
   * Pass the remotePrompts to consumers as their remotePrompts
   */
  _broadcastRemotePrompts() {
    this.remotePromptsUpdateCallback(structuredClone(this.remotePrompts));
  }

  /**
   * Pass the popularTags to consumers as their popularTags
   */
  _broadcastPopularTags() {
    this.popularTagsUpdateCallback(structuredClone(this.popularTags));
  }

  /**
   * Initialize remote servers with fake prompts
   */
  async _populateRemotePrompts(size: number) {
    for (const p of fakePrompts.slice(0, size)) {
      await this.sharePrompt(p);
    }
  }
}

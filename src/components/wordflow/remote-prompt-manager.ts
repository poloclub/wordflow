import { v4 as uuidv4 } from 'uuid';
import { random } from '@xiaohk/utils';
import d3 from '../../utils/d3-import';
import { get, set, del, clear } from 'idb-keyval';

const DEV_MODE = import.meta.env.DEV;

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
    // this._populateRemotePrompts(100).then(() => {
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

    // Add random dates and run count in dev mode
    // if (DEV_MODE) {
    //   const shuffler = d3.shuffler(d3.randomLcg(10));
    //   const rng = d3.randomExponential(1 / 300);
    //   this.remotePrompts = shuffler(this.remotePrompts);

    //   const randomRunCounts = Array(this.remotePrompts.length)
    //     .fill(0)
    //     .map(() => Math.floor(rng()))
    //     .sort((a, b) => b - a);

    //   const toTitleCase = (str: string) => {
    //     return str.toLowerCase().replace(/(?:^|\s)\w/g, match => {
    //       return match.toUpperCase();
    //     });
    //   };

    //   for (const [i, prompt] of this.remotePrompts.entries()) {
    //     if (orderMode === 'popular') {
    //       prompt.promptRunCount = randomRunCounts[i];
    //     } else {
    //       prompt.promptRunCount = random(0, 555);
    //     }
    //     prompt.created = getRandomISODateString();
    //     if (random(1, 10) < 8) {
    //       prompt.userName = '';
    //     }
    //     prompt.title = toTitleCase(prompt.title);
    //   }

    //   const oldPrompt = this.remotePrompts[1];
    //   const oldPrompt2 = this.remotePrompts[3];
    //   this.remotePrompts[1] = this.remotePrompts[2];
    //   this.remotePrompts[2] = oldPrompt2;
    //   this.remotePrompts[3] = oldPrompt;

    //   for (const p of fakePrompts) {
    //     if (p.title === 'Improve Academic Writing') {
    //       const oldCount = this.remotePrompts[0].promptRunCount;
    //       this.remotePrompts[0] = p;
    //       this.remotePrompts[0].promptRunCount = oldCount;
    //     }
    //   }

    //   this.remotePrompts[0].promptRunCount = 1497;
    //   this.remotePrompts[1].promptRunCount = 833;
    //   this.remotePrompts[2].promptRunCount = 580;
    //   this.remotePrompts[3].promptRunCount = 505;
    //   this.remotePrompts[0].icon = '✍️';
    //   this.remotePrompts[1].icon = '🌍';
    //   this.remotePrompts[2].icon = '🌊';
    //   this.remotePrompts[3].icon = '🧑🏽‍💻';

    //   this.remotePrompts[1].title = 'Inspirational Travel Guide';
    //   this.remotePrompts[2].title = 'Improve Text Flow';
    //   this.remotePrompts[2].prompt = 'Improve the flow of the following text.';
    //   this.remotePrompts[2].tags = ['general', 'writing', 'flow'];
    // }

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

    try {
      const response = await fetch(url.toString(), requestOptions);
      return response.status;
    } catch {
      return 401;
    }
  }

  /**
   * Get a particular prompt
   * @param promptID Remote prompt ID
   */
  async getPrompt(promptID: string) {
    const url = new URL(ENDPOINT);
    url.searchParams.append('getPrompt', promptID);

    const requestOptions: RequestInit = {
      method: 'GET',
      credentials: 'include'
    };
    const response = await fetch(url.toString(), requestOptions);

    if (response.status === 200) {
      const remotePrompt = (await response.json()) as PromptDataRemote;
      return remotePrompt;
    } else {
      return null;
    }
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

/**
 * Generates a random ISO date string in 2023
 *
 * @returns {string} The generated random ISO date string.
 */
const getRandomISODateString = () => {
  const start = new Date('2023-01-01'); // January 1, 2023
  const end = new Date('2023-12-31T23:59:59'); // December 31, 2023
  const randomDate = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return randomDate.toISOString();
};

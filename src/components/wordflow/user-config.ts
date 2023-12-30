import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';
import type { PromptDataLocal, PromptDataRemote } from '../../types/wordflow';

const PREFIX = 'user-config';

export enum SupportedModel {
  'gpt-3.5-free' = 'GPT 3.5 (free)',
  'gpt-3.5' = 'GPT 3.5',
  'gpt-4' = 'GPT 4',
  'gemini-pro' = 'Gemini Pro'
}

// const SUPPORTED_MODEL_LABELS: { label: string; name: SupportedModel }[] = [
//   { label: 'GPT 3.5 (free)', name: 'gpt-3.5-free' },
//   { label: 'GPT 3.5', name: 'gpt-3.5' },
//   { label: 'GPT 4', name: 'gpt-4' },
//   { label: 'Gemini Pro', name: 'gemini-pro' }
// ];

export class UserConfig {
  restoreFinished: Promise<void>;
  llmAPIKeys: Record<SupportedModel, string>;

  constructor() {
    this.llmAPIKeys = {
      [SupportedModel['gpt-3.5-free']]: '',
      [SupportedModel['gpt-3.5']]: '',
      [SupportedModel['gpt-4']]: '',
      [SupportedModel['gemini-pro']]: ''
    };
    this.restoreFinished = this.restoreFromStorage();
  }

  /**
   * Reconstruct the prompts from the local storage.
   */
  async restoreFromStorage() {
    // Restore the local prompts
  }

  /**
   * Pass the localPrompts to consumers as their localPrompts
   */
  _broadcastLocalPrompts() {}
}

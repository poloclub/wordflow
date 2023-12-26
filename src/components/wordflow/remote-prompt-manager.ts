import { v4 as uuidv4 } from 'uuid';
import { get, set, del, clear } from 'idb-keyval';
import type { PromptDataLocal, PromptDataRemote } from '../../types/promptlet';

// Constants
const PREFIX = 'remote-prompt';
const ENDPOINT =
  'https://9vix5sh1k9.execute-api.localhost.localstack.cloud:4566/prod/';

export class RemotePromptManager {
  remotePrompts: PromptDataRemote[] = [];
  remotePromptsUpdateCallback: (newRemotePrompts: PromptDataRemote[]) => void;

  constructor(
    remotePromptsUpdateCallback: (newRemotePrompts: PromptDataRemote[]) => void
  ) {
    this.remotePromptsUpdateCallback = remotePromptsUpdateCallback;
  }

  getPopularPrompts() {
    // TODO
  }

  getNewPrompts() {
    // TODO
  }

  getPopularTags() {
    // TODO
  }

  getPromptByTag(tags: string[]) {
    // TODO
  }

  forkPrompt(prompt: PromptDataRemote) {
    // TODO
  }

  sharePrompt(prompt: PromptDataLocal) {
    // TODO
  }

  runPrompt(prompt: PromptDataLocal) {
    // TODO
  }

  /**
   * Pass the remotePrompts to consumers as their remotePrompts
   */
  _broadcastRemotePrompts() {
    this.remotePromptsUpdateCallback(structuredClone(this.remotePrompts));
  }
}

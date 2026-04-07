import { clear, del, get, set } from 'idb-keyval';

const PREFIX = 'user-config';

export enum SupportedLocalModel {
  'gemma-2b' = 'Gemma (2B)',
  'llama-2-7b' = 'Llama 2 (7B)',
  'phi-2' = 'Phi 2 (2.7B)',
  'tinyllama-1.1b' = 'TinyLlama (1.1B)'
}

export enum SupportedRemoteModel {
  'gpt-5.4' = 'GPT 5.4',
  'gpt-5.4-pro' = 'GPT 5.4 Pro',
  'gpt-5.4-mini' = 'GPT 5.4 Mini',
  'gpt-5.4-nano' = 'GPT 5.4 Nano',
  'gpt-5-mini' = 'GPT 5 Mini',
  'gpt-5-nano' = 'GPT 5 Nano',
  'gpt-5-nano-free' = 'GPT 5 Nano (free)',
  'gpt-5' = 'GPT 5',
  'gpt-4.1' = 'GPT 4.1',
  'gemini-pro' = 'Gemini Pro'
}

export const supportedModelReverseLookup: Record<
  SupportedRemoteModel | SupportedLocalModel,
  keyof typeof SupportedRemoteModel | keyof typeof SupportedLocalModel
> = {
  [SupportedRemoteModel['gpt-5.4']]: 'gpt-5.4',
  [SupportedRemoteModel['gpt-5.4-pro']]: 'gpt-5.4-pro',
  [SupportedRemoteModel['gpt-5.4-mini']]: 'gpt-5.4-mini',
  [SupportedRemoteModel['gpt-5.4-nano']]: 'gpt-5.4-nano',
  [SupportedRemoteModel['gpt-5-mini']]: 'gpt-5-mini',
  [SupportedRemoteModel['gpt-5-nano']]: 'gpt-5-nano',
  [SupportedRemoteModel['gpt-5-nano-free']]: 'gpt-5-nano-free',
  [SupportedRemoteModel['gpt-5']]: 'gpt-5',
  [SupportedRemoteModel['gpt-4.1']]: 'gpt-4.1',
  [SupportedRemoteModel['gemini-pro']]: 'gemini-pro',
  [SupportedLocalModel['tinyllama-1.1b']]: 'tinyllama-1.1b',
  [SupportedLocalModel['llama-2-7b']]: 'llama-2-7b',
  [SupportedLocalModel['phi-2']]: 'phi-2',
  [SupportedLocalModel['gemma-2b']]: 'gemma-2b'
};

export enum ModelFamily {
  google = 'Google',
  openAI = 'Open AI',
  local = 'Local'
}

export const modelFamilyMap: Record<
  SupportedRemoteModel | SupportedLocalModel,
  ModelFamily
> = {
  [SupportedRemoteModel['gpt-5.4']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5.4-pro']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5.4-mini']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5.4-nano']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5-mini']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5-nano']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5-nano-free']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-5']]: ModelFamily.openAI,
  [SupportedRemoteModel['gpt-4.1']]: ModelFamily.openAI,
  [SupportedRemoteModel['gemini-pro']]: ModelFamily.google,
  [SupportedLocalModel['tinyllama-1.1b']]: ModelFamily.local,
  [SupportedLocalModel['llama-2-7b']]: ModelFamily.local,
  [SupportedLocalModel['gemma-2b']]: ModelFamily.local,
  [SupportedLocalModel['phi-2']]: ModelFamily.local
};

export interface UserConfig {
  llmAPIKeys: Record<ModelFamily, string>;
  preferredLLM: SupportedRemoteModel | SupportedLocalModel;
}

export class UserConfigManager {
  restoreFinished: Promise<void>;
  updateUserConfig: (userConfig: UserConfig) => void;

  #llmAPIKeys: Record<ModelFamily, string>;
  #preferredLLM: SupportedRemoteModel | SupportedLocalModel;

  constructor(updateUserConfig: (userConfig: UserConfig) => void) {
    this.updateUserConfig = updateUserConfig;

    this.#llmAPIKeys = {
      [ModelFamily.openAI]: '',
      [ModelFamily.google]: '',
      [ModelFamily.local]: ''
    };
    this.#preferredLLM = SupportedRemoteModel['gpt-5-nano-free'];
    this._broadcastUserConfig();

    this.restoreFinished = this._restoreFromStorage();

    // this._cleanStorage();
  }

  setAPIKey(modelFamily: ModelFamily, key: string) {
    this.#llmAPIKeys[modelFamily] = key;
    this._syncStorage();
    this._broadcastUserConfig();
  }

  setPreferredLLM(model: SupportedRemoteModel | SupportedLocalModel) {
    this.#preferredLLM = model;
    this._syncStorage();
    this._broadcastUserConfig();
  }

  /**
   * Reconstruct the prompts from the local storage.
   */
  async _restoreFromStorage() {
    // Restore the local prompts
    const config = (await get(PREFIX)) as UserConfig | undefined;
    if (config) {
      this.#llmAPIKeys = {
        ...this.#llmAPIKeys,
        ...config.llmAPIKeys
      };
      this.#preferredLLM =
        supportedModelReverseLookup[config.preferredLLM] !== undefined
          ? config.preferredLLM
          : SupportedRemoteModel['gpt-5-nano-free'];
    }
    this._broadcastUserConfig();
  }

  /**
   * Store the current config to local storage
   */
  async _syncStorage() {
    const config = this._constructConfig();
    await set(PREFIX, config);
  }

  /**
   * Create a copy of the user config
   * @returns User config
   */
  _constructConfig(): UserConfig {
    const config: UserConfig = {
      llmAPIKeys: this.#llmAPIKeys,
      preferredLLM: this.#preferredLLM
    };
    return config;
  }

  /**
   * Clean the local storage
   */
  async _cleanStorage() {
    await del(PREFIX);
  }

  /**
   * Update the public user config
   */
  _broadcastUserConfig() {
    const newConfig = this._constructConfig();
    this.updateUserConfig(newConfig);
  }
}

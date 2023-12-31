import { get, set, del, clear } from 'idb-keyval';

const PREFIX = 'user-config';

export enum SupportedModel {
  'gpt-3.5-free' = 'GPT 3.5 (free)',
  'gpt-3.5' = 'GPT 3.5',
  'gpt-4' = 'GPT 4',
  'gemini-pro' = 'Gemini Pro'
}

export const supportedModelReverse: Record<
  SupportedModel,
  keyof typeof SupportedModel
> = {
  [SupportedModel['gpt-3.5-free']]: 'gpt-3.5-free',
  [SupportedModel['gpt-3.5']]: 'gpt-3.5',
  [SupportedModel['gpt-4']]: 'gpt-4',
  [SupportedModel['gemini-pro']]: 'gemini-pro'
};

export enum ModelFamily {
  google = 'Google',
  openAI = 'Open AI'
}

export const modelFamilyMap: Record<SupportedModel, ModelFamily> = {
  [SupportedModel['gpt-3.5']]: ModelFamily.openAI,
  [SupportedModel['gpt-3.5-free']]: ModelFamily.openAI,
  [SupportedModel['gpt-4']]: ModelFamily.openAI,
  [SupportedModel['gemini-pro']]: ModelFamily.google
};

export interface UserConfig {
  llmAPIKeys: Record<ModelFamily, string>;
  preferredLLM: SupportedModel;
}

export class UserConfigManager {
  restoreFinished: Promise<void>;
  updateUserConfig: (userConfig: UserConfig) => void;

  #llmAPIKeys: Record<ModelFamily, string>;
  #preferredLLM: SupportedModel;

  constructor(updateUserConfig: (userConfig: UserConfig) => void) {
    this.updateUserConfig = updateUserConfig;

    this.#llmAPIKeys = {
      [ModelFamily.openAI]: '',
      [ModelFamily.google]: ''
    };
    this.#preferredLLM = SupportedModel['gpt-3.5-free'];
    this._broadcastUserConfig();

    this.restoreFinished = this._restoreFromStorage();

    // this._cleanStorage();
  }

  setAPIKey(modelFamily: ModelFamily, key: string) {
    this.#llmAPIKeys[modelFamily] = key;
    this._syncStorage();
    this._broadcastUserConfig();
  }

  setPreferredLLM(model: SupportedModel) {
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
      this.#llmAPIKeys = config.llmAPIKeys;
      this.#preferredLLM = config.preferredLLM;
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

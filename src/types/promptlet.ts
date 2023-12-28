export interface TagData {
  tag: string;
  promptCount: number;
}

/**
 * Prompt data to communicate with the server
 */
export interface PromptDataRemote {
  prompt: string;
  tags: string[];
  temperature: number;
  userID: string;
  userName: string;
  description: string;
  icon: string;
  forkFrom: string;
  promptRunCount: number;
  created: string;
  title: string;
  outputParsingPattern: string;
  outputParsingReplacement: string;
  recommendedModels: string[];
  injectionMode: 'replace' | 'append';
}

export interface PromptDataLocal extends PromptDataRemote {
  key: string;
}

/**
 * Prompt data to communicate with the server
 */
export interface PromptDataRemote {
  prompt: string;
  tags: string[];
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

export interface PromptDataLocal {
  prompt: string;
  tags?: string[];
  userID: string;
  userName?: string;
  description?: string;
  icon: string;
  forkFrom?: string;
  promptRunCount: number;
  created: string;
  title: string;
  outputParsingPattern?: string;
  outputParsingReplacement?: string;
  recommendedModels: string[];
  injectionMode: 'replace' | 'append';
}

/**
 * Promptlet object describing a prompt functionality.
 */
export interface Promptlet {
  /** Short name of the promptlet */
  title: string;

  /** Detailed description of the promptlet */
  description: string;

  /** The associated prompt */
  prompt: string;

  /** Desired temperature of the prompt*/
  temperature: number;

  /** Associated tags */
  tags: string[];

  /** A simple regex rule to parse the output */
  outputParser: RegExp;

  /** A unicode character used as an icon for the promptlet (can be emoji) */
  icon: string;
}

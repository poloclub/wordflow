// Types for Wordflow

import type { ChatCompletion } from '../types/gpt-types';
import {
  SupportedLocalModel,
  SupportedRemoteModel
} from '../components/wordflow/user-config';

export type PromptRunSuccessResponse = {
  command: 'finishTextGen';
  completion: ChatCompletion;
  payload: {
    result: string;
    fullPrompt: string;
    detail: string;
  };
};

export type PromptRunErrorResponse = {
  message: string;
};

export interface PromptRunPostBody {
  prompt: string;
  text: string;
  temperature: number;
  userID: string;
  model: keyof typeof SupportedLocalModel | keyof typeof SupportedRemoteModel;
}

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

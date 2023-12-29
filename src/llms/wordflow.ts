import type { PromptRunPostBody, PromptRunResponse } from '../types/wordflow';
import { config } from '../config/config';

// Constants
const ENDPOINT = config.urls.wordflowEndpoint;

export type TextGenMessage =
  | {
      command: 'finishTextGen';
      payload: {
        requestID: string;
        apiKey: string;
        result: string;
        prompt: string;
        detail: string;
      };
    }
  | {
      command: 'error';
      payload: {
        requestID: string;
        originalCommand: string;
        message: string;
      };
    };

/**
 * Use Wordflow to generate text based on a given prompt
 * @param requestID Worker request ID
 * @param prompt Prompt prefix
 * @param inputText Input text
 * @param temperature Model temperature
 * @param userID User ID
 * @param detail Extra string information to include (will be returned)
 */
export const textGenWordflow = async (
  requestID: string,
  prompt: string,
  inputText: string,
  temperature: number,
  userID: string,
  useCache: boolean = true,
  detail: string = ''
) => {
  // Check if the model output is cached
  const cachedValue = localStorage.getItem('[wordflow]' + prompt);
  if (useCache && cachedValue !== null) {
    console.log('Use cached output (text gen)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey: '',
        result: cachedValue,
        prompt,
        detail
      }
    };
    return message;
  }

  // Run the prompt through wordflow API

  const body: PromptRunPostBody = {
    prompt,
    text: inputText,
    temperature,
    userID
  };

  const url = new URL(ENDPOINT);
  url.searchParams.append('type', 'run');

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch(url.toString(), requestOptions);
    const data = (await response.json()) as PromptRunResponse;
    if (response.status !== 200) {
      throw Error('Wordflow API error' + JSON.stringify(data));
    }

    // Send back the data to the main thread
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey: '',
        result: data.payload.result,
        prompt: data.payload.fullPrompt,
        detail: detail
      }
    };

    // Also cache the model output
    if (useCache) {
      if (localStorage.getItem('[wordflow]' + prompt) === null) {
        localStorage.setItem('[wordflow]' + prompt, data.payload.result);
      }
    }

    return message;
  } catch (error) {
    // Throw the error to the main thread
    const message: TextGenMessage = {
      command: 'error',
      payload: {
        requestID,
        originalCommand: 'startTextGen',
        message: error as string
      }
    };
    return message;
  }
};

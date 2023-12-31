import type {
  ChatCompletionRequest,
  ChatCompletion,
  ChatMessage
} from '../types/gpt-types';

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
 * Use GPT API to generate text based on a given prompt
 * @param apiKey GPT API key
 * @param requestID Worker request ID
 * @param prompt Prompt to give to the GPT model
 * @param temperature Model temperature
 * @param stopSequences Strings to stop the generation
 * @param detail Extra string information to include (will be returned)
 * @param model GPT 3.5 or GPT 4
 */
export const textGenGpt = async (
  apiKey: string,
  requestID: string,
  prompt: string,
  temperature: number,
  model: 'gpt-3.5-turbo' | 'gpt-4-1106-preview',
  useCache: boolean = false,
  stopSequences: string[] = [],
  detail: string = ''
) => {
  // Compile the prompt into a chat format
  const message: ChatMessage = {
    role: 'user',
    content: prompt
  };

  const body: ChatCompletionRequest = {
    model,
    messages: [message],
    temperature,
    stop: stopSequences
  };

  // Check if the model output is cached
  const cachedValue = localStorage.getItem('[gpt]' + prompt);
  if (useCache && cachedValue !== null) {
    console.log('Use cached output (text gen)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    // await new Promise(resolve => setTimeout(resolve, 100000));
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey,
        result: cachedValue,
        prompt: prompt,
        detail: detail
      }
    };
    return message;
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = (await response.json()) as ChatCompletion;
    if (response.status !== 200) {
      throw Error('GPT API error' + JSON.stringify(data));
    }

    if (data.choices.length < 1) {
      throw Error('GPT API error' + JSON.stringify(data));
    }

    // Send back the data to the main thread
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey,
        result: data.choices[0].message.content,
        prompt: prompt,
        detail: detail
      }
    };

    // Also cache the model output
    if (useCache && localStorage.getItem('[gpt]' + prompt) === null) {
      localStorage.setItem('[gpt]' + prompt, data.choices[0].message.content);
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

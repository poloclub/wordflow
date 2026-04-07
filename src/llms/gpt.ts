import type {
  ChatCompletion,
  ResponsesCompletion,
  ResponsesCompletionRequest
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
 * @param temperature Ignored for OpenAI Responses API GPT calls
 * @param stopSequences Ignored for OpenAI Responses API GPT calls
 * @param detail Extra string information to include (will be returned)
 * @param model OpenAI GPT model
 */
export type GptModel =
  | 'gpt-5.4'
  | 'gpt-5.4-pro'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-5'
  | 'gpt-4.1';

const extractResponseText = (data: ChatCompletion | ResponsesCompletion) => {
  if ('output_text' in data && data.output_text) {
    return data.output_text;
  }

  if ('output' in data && data.output !== undefined) {
    const text = data.output
      .flatMap(item => item.content ?? [])
      .filter(item => item.type === 'output_text' && item.text !== undefined)
      .map(item => item.text)
      .join('');

    if (text !== '') {
      return text;
    }
  }

  const messageContent = data.choices?.[0]?.message.content;
  if (messageContent !== undefined) {
    return messageContent;
  }

  throw Error('GPT API error: response did not include final text');
};

export const textGenGpt = async (
  apiKey: string,
  requestID: string,
  prompt: string,
  temperature: number,
  model: GptModel,
  useCache: boolean = false,
  stopSequences: string[] = [],
  detail: string = ''
) => {
  const body: ResponsesCompletionRequest = {
    model,
    input: prompt
  };

  if (stopSequences.length > 0) {
    console.warn(
      'Ignoring stop sequences because the Responses API does not support the stop parameter.'
    );
  }

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

  const url = 'https://api.openai.com/v1/responses';

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = (await response.json()) as ResponsesCompletion;
    if (response.status !== 200) {
      throw Error('GPT API error' + JSON.stringify(data));
    }

    const result = extractResponseText(data);

    // Send back the data to the main thread
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey,
        result,
        prompt: prompt,
        detail: detail
      }
    };

    // Also cache the model output
    if (useCache && localStorage.getItem('[gpt]' + prompt) === null) {
      localStorage.setItem('[gpt]' + prompt, result);
    }
    return message;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Throw the error to the main thread
    const message: TextGenMessage = {
      command: 'error',
      payload: {
        requestID,
        originalCommand: 'startTextGen',
        message: errorMessage
      }
    };
    return message;
  }
};

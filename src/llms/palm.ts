import type { TextGenMessage } from './gpt';
import { HarmCategory, HarmBlockThreshold } from '../types/palm-api-types';
import type {
  PalmGenerateTextRequestBody,
  PalmGenerateTextResponseBody,
  SafetySetting
} from '../types/palm-api-types';

/**
 * Use PaLM API to generate text based on a given prompt
 * @param apiKey PaLM API key
 * @param requestID Worker request ID
 * @param prompt Prompt to give to the PaLM model
 * @param temperature Model temperature
 * @param stopSequences Strings to stop the generation
 * @param detail Extra string information to include (will be returned)
 */
export const textGenPalm = async (
  apiKey: string,
  requestID: string,
  prompt: string,
  temperature: number,
  useCache: boolean = true,
  stopSequences: string[] = [],
  detail: string = ''
) => {
  // Configure safety setting to allow low-probability unsafe responses
  const safetySettings: SafetySetting[] = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_DEROGATORY,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_MEDICAL,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUAL,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_TOXICITY,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_VIOLENCE,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    }
  ];

  const parameter: PalmGenerateTextRequestBody = {
    prompt: { text: prompt },
    safetySettings,
    temperature,
    stopSequences
  };

  // Check if the model output is cached
  const cachedValue = localStorage.getItem('[palm]' + prompt);
  if (useCache && cachedValue !== null) {
    console.log('Use cached output (text gen)');
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  const model = 'text-bison-001';
  let url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText`;
  const urlParam = new URLSearchParams();
  urlParam.append('key', apiKey);
  url += `?${urlParam.toString()}`;

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameter)
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = (await response.json()) as PalmGenerateTextResponseBody;
    if (response.status !== 200) {
      throw Error('PaLM API error' + JSON.stringify(data));
    }

    if (data.candidates === undefined) {
      console.error('PaLM API is blocked, feedback: ', data.filters[0], data);
      throw Error('PaLM API Error' + JSON.stringify(data));
    }

    // Send back the data to the main thread
    const message: TextGenMessage = {
      command: 'finishTextGen',
      payload: {
        requestID,
        apiKey,
        result: data.candidates[0].output,
        prompt: prompt,
        detail: detail
      }
    };

    // Also cache the model output
    if (localStorage.getItem('[palm]' + prompt) === null) {
      localStorage.setItem('[palm]' + prompt, data.candidates[0].output);
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

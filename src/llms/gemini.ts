import { HarmCategory, HarmBlockThreshold } from '../types/gemini-api-types';
import type { TextGenMessage } from './gpt';
import type {
  GeminiGenerateTextRequestBody,
  GeminiGenerateTextResponseBody,
  SafetySetting
} from '../types/gemini-api-types';

/**
 * Use Gemini API to generate text based on a given prompt
 * @param apiKey Gemini API key
 * @param requestID Worker request ID
 * @param prompt Prompt to give to the Gemini model
 * @param temperature Model temperature
 * @param useCache Whether to use local cache
 * @param stopSequences Strings to stop the generation
 * @param detail Extra string information to include (will be returned)
 */
export const textGenGemini = async (
  apiKey: string,
  requestID: string,
  prompt: string,
  temperature: number,
  useCache: boolean = false,
  stopSequences: string[] = [],
  detail: string = ''
) => {
  // Configure safety setting to allow low-probability unsafe responses
  const safetySettings: SafetySetting[] = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    }
  ];

  const parameter: GeminiGenerateTextRequestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    safetySettings,
    generationConfig: {
      temperature,
      stopSequences
    }
  };

  // Check if the model output is cached
  const cachedValue = localStorage.getItem('[gemini]' + prompt);
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

  const model = 'gemini-pro';
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
    const data = (await response.json()) as GeminiGenerateTextResponseBody;
    if (response.status !== 200) {
      throw Error('Gemini API error' + JSON.stringify(data));
    }

    if (data.candidates === undefined) {
      console.error(
        'Gemini API is blocked, feedback: ',
        data.promptFeedback.safetyRatings,
        data
      );
      throw Error('Gemini API Error' + JSON.stringify(data));
    }

    // Send back the data to the main thread
    const result = data.candidates[0].content.parts[0].text;
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
    if (useCache && localStorage.getItem('[gemini]' + prompt) === null) {
      localStorage.setItem('[gemini]' + prompt, result);
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

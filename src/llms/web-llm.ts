import * as webllm from '@mlc-ai/web-llm';
import { SupportedLocalModel } from '../components/wordflow/user-config';
import type { TextGenWorkerMessage } from '../types/common-types';

export type TextGenLocalWorkerMessage =
  | TextGenWorkerMessage
  | {
      command: 'progressLoadModel';
      payload: {
        progress: number;
        timeElapsed: number;
      };
    }
  | {
      command: 'startLoadModel';
      payload: {
        temperature: number;
        model: SupportedLocalModel;
      };
    }
  | {
      command: 'finishLoadModel';
      payload: {
        temperature: number;
        model: SupportedLocalModel;
      };
    };

//==========================================================================||
//                          Worker Initialization                           ||
//==========================================================================||
const appConfig: webllm.AppConfig = {
  model_list: [
    {
      model_url:
        'https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC/resolve/main/',
      local_id: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/TinyLlama-1.1B-Chat-v0.4/TinyLlama-1.1B-Chat-v0.4-q4f16_1-ctx1k-webgpu.wasm'
    }
  ]
};

const modelMap: Record<SupportedLocalModel, string> = {
  [SupportedLocalModel['tinyllama-1.1b']]: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1'
};

const chat = new webllm.ChatModule();

// To reset temperature, WebLLM requires to reload the model. Therefore, we just
// fix the temperature for now.
let _temperature = 0.2;

let _modelLoadingComplete: Promise<void> | null = null;

chat.setInitProgressCallback((report: webllm.InitProgressReport) => {
  // Update the main thread about the progress
  const message: TextGenLocalWorkerMessage = {
    command: 'progressLoadModel',
    payload: {
      progress: report.progress,
      timeElapsed: report.timeElapsed
    }
  };
  postMessage(message);
});

//==========================================================================||
//                          Worker Event Handlers                           ||
//==========================================================================||

/**
 * Helper function to handle calls from the main thread
 * @param e Message event
 */
self.onmessage = (e: MessageEvent<TextGenLocalWorkerMessage>) => {
  switch (e.data.command) {
    case 'startLoadModel': {
      startLoadModel(e.data.payload.model, e.data.payload.temperature);
      break;
    }

    case 'startTextGen': {
      startTextGen(e.data.payload.prompt, e.data.payload.temperature);
      break;
    }

    default: {
      console.error('Worker: unknown message', e.data.command);
      break;
    }
  }
};

/**
 * Reload a WebLLM model
 * @param model Local LLM model
 * @param temperature LLM temperature for all subsequent generation
 */
const startLoadModel = async (
  model: SupportedLocalModel,
  temperature: number
) => {
  _temperature = temperature;
  const curModel = modelMap[model];
  const chatOption: webllm.ChatOptions = {
    temperature: temperature
  };
  _modelLoadingComplete = chat.reload(curModel, chatOption, appConfig);
  await _modelLoadingComplete;

  try {
    // Send back the data to the main thread
    const message: TextGenLocalWorkerMessage = {
      command: 'finishLoadModel',
      payload: {
        model,
        temperature
      }
    };
    postMessage(message);
  } catch (error) {
    // Throw the error to the main thread
    const message: TextGenLocalWorkerMessage = {
      command: 'error',
      payload: {
        requestID: 'web-llm',
        originalCommand: 'startLoadModel',
        message: error as string
      }
    };
    postMessage(message);
  }
};

/**
 * Use Web LLM to generate text based on a given prompt
 * @param prompt Prompt to give to the PaLM model
 * @param temperature Model temperature
 */
const startTextGen = async (prompt: string, temperature: number) => {
  try {
    if (_modelLoadingComplete) {
      await _modelLoadingComplete;
    }

    const response = await chat.generate(prompt);

    // Send back the data to the main thread
    const message: TextGenLocalWorkerMessage = {
      command: 'finishTextGen',
      payload: {
        requestID: 'web-llm',
        apiKey: '',
        result: response,
        prompt: prompt,
        detail: ''
      }
    };
    postMessage(message);
  } catch (error) {
    // Throw the error to the main thread
    const message: TextGenLocalWorkerMessage = {
      command: 'error',
      payload: {
        requestID: 'web-llm',
        originalCommand: 'startTextGen',
        message: error as string
      }
    };
    postMessage(message);
  }
};

//==========================================================================||
//                          Module Methods                                  ||
//==========================================================================||

export const hasLocalModelInCache = async (model: SupportedLocalModel) => {
  const curModel = modelMap[model];
  const inCache = await webllm.hasModelInCache(curModel, appConfig);
  return inCache;
};

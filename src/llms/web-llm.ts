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

// Below helper functions are from TVM
// https:github.com/mlc-ai/relax/blob/71e8089ff3d26877f4fd139e52c30cba24f23315/web/src/webgpu.ts#L36

// Overwrite the types for below fields to string as TS doesn't support them yet and
// we won't use them
export interface GPUDeviceDetectOutput {
  adapter: string;
  adapterInfo: string;
  device: string;
}

/**
 * DetectGPU device in the environment.
 */
export async function detectGPUDevice(): Promise<
  GPUDeviceDetectOutput | undefined
> {
  if (typeof navigator !== 'undefined' && navigator.gpu !== undefined) {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
    });
    if (adapter == null) {
      throw Error('Cannot find adapter that matches the request');
    }
    const computeMB = (value: number) => {
      return Math.ceil(value / (1 << 20)) + 'MB';
    };

    // more detailed error message
    const requiredMaxBufferSize = 1 << 30;
    if (requiredMaxBufferSize > adapter.limits.maxBufferSize) {
      throw Error(
        `Cannot initialize runtime because of requested maxBufferSize ` +
          `exceeds limit. requested=${computeMB(requiredMaxBufferSize)}, ` +
          `limit=${computeMB(adapter.limits.maxBufferSize)}. ` +
          `This error may be caused by an older version of the browser (e.g. Chrome 112). ` +
          `You can try to upgrade your browser to Chrome 113 or later.`
      );
    }

    let requiredMaxStorageBufferBindingSize = 1 << 30; // 1GB
    if (
      requiredMaxStorageBufferBindingSize >
      adapter.limits.maxStorageBufferBindingSize
    ) {
      // If 1GB is too large, try 128MB (default size for Android)
      const backupRequiredMaxStorageBufferBindingSize = 1 << 27; // 128MB
      console.log(
        `Requested maxStorageBufferBindingSize exceeds limit. \n` +
          `requested=${computeMB(requiredMaxStorageBufferBindingSize)}, \n` +
          `limit=${computeMB(adapter.limits.maxStorageBufferBindingSize)}. \n` +
          `WARNING: Falling back to ${computeMB(
            backupRequiredMaxStorageBufferBindingSize
          )}...`
      );
      requiredMaxStorageBufferBindingSize =
        backupRequiredMaxStorageBufferBindingSize;
      if (
        backupRequiredMaxStorageBufferBindingSize >
        adapter.limits.maxStorageBufferBindingSize
      ) {
        // Fail if 128MB is still too big
        throw Error(
          `Cannot initialize runtime because of requested maxStorageBufferBindingSize ` +
            `exceeds limit. requested=${computeMB(
              backupRequiredMaxStorageBufferBindingSize
            )}, ` +
            `limit=${computeMB(adapter.limits.maxStorageBufferBindingSize)}. `
        );
      }
    }

    const requiredMaxComputeWorkgroupStorageSize = 32 << 10;
    if (
      requiredMaxComputeWorkgroupStorageSize >
      adapter.limits.maxComputeWorkgroupStorageSize
    ) {
      throw Error(
        `Cannot initialize runtime because of requested maxComputeWorkgroupStorageSize ` +
          `exceeds limit. requested=${requiredMaxComputeWorkgroupStorageSize}, ` +
          `limit=${adapter.limits.maxComputeWorkgroupStorageSize}. `
      );
    }

    const requiredFeatures: string[] = [];
    // Always require f16 if available
    if (adapter.features.has('shader-f16')) {
      requiredFeatures.push('shader-f16');
    }

    const adapterInfo = await adapter.requestAdapterInfo();
    const device = await adapter.requestDevice({
      requiredLimits: {
        maxBufferSize: requiredMaxBufferSize,
        maxStorageBufferBindingSize: requiredMaxStorageBufferBindingSize,
        maxComputeWorkgroupStorageSize: requiredMaxComputeWorkgroupStorageSize
      },
      requiredFeatures
    });
    return {
      adapter: adapter,
      adapterInfo: adapterInfo,
      device: device
    };
  } else {
    return undefined;
  }
}

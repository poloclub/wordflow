import * as webllm from '@mlc-ai/web-llm';
import { SupportedLocalModel } from '../components/wordflow/user-config';
import type { TextGenWorkerMessage } from '../types/common-types';
import type { ConvTemplateConfig } from '@mlc-ai/web-llm/lib/config';

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
const APP_CONFIGS: webllm.AppConfig = {
  model_list: [
    {
      model_url:
        'https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC/resolve/main/',
      local_id: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/TinyLlama-1.1B-Chat-v0.4/TinyLlama-1.1B-Chat-v0.4-q4f16_1-ctx1k-webgpu.wasm'
    },
    {
      model_url:
        'https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f16_1-MLC/resolve/main/',
      local_id: 'Llama-2-7b-chat-hf-q4f16_1',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf/Llama-2-7b-chat-hf-q4f16_1-ctx1k-webgpu.wasm'
    },
    {
      model_url: 'https://huggingface.co/mlc-ai/gpt2-q0f16-MLC/resolve/main/',
      local_id: 'gpt2-q0f16',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/gpt2/gpt2-q0f16-ctx1k-webgpu.wasm'
    },
    {
      model_url:
        'https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q3f16_1-MLC/resolve/main/',
      local_id: 'Mistral-7B-Instruct-v0.2-q3f16_1',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.2/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm'
    },
    {
      model_url:
        'https://huggingface.co/mlc-ai/phi-2-q4f16_1-MLC/resolve/main/',
      local_id: 'Phi2-q4f16_1',
      model_lib_url:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-2/phi-2-q4f16_1-ctx2k-webgpu.wasm',
      vram_required_MB: 3053.97,
      low_resource_required: false,
      required_features: ['shader-f16']
    }
  ]
};

const CONV_TEMPLATES: Record<
  SupportedLocalModel,
  Partial<ConvTemplateConfig>
> = {
  [SupportedLocalModel['tinyllama-1.1b']]: {
    system: '<|im_start|><|im_end|> ',
    roles: ['<|im_start|>user', '<|im_start|>assistant'],
    offset: 0,
    seps: ['', ''],
    separator_style: 'Two',
    stop_str: '<|im_end|>',
    add_bos: false,
    stop_tokens: [2]
  },
  [SupportedLocalModel['llama-2-7b']]: {
    system: '[INST] <<SYS>><</SYS>>\n\n ',
    roles: ['[INST]', '[/INST]'],
    offset: 0,
    seps: [' ', ' '],
    separator_style: 'Two',
    stop_str: '[INST]',
    add_bos: true,
    stop_tokens: [2]
  },
  [SupportedLocalModel['phi-2']]: {
    system: '',
    roles: ['Instruct', 'Output'],
    offset: 0,
    seps: ['\n'],
    separator_style: 'Two',
    stop_str: '<|endoftext|>',
    add_bos: false,
    stop_tokens: [50256]
  }
};

const modelMap: Record<SupportedLocalModel, string> = {
  [SupportedLocalModel['tinyllama-1.1b']]: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1',
  [SupportedLocalModel['llama-2-7b']]: 'Llama-2-7b-chat-hf-q4f16_1',
  [SupportedLocalModel['phi-2']]: 'Phi2-q4f16_1'
  // [SupportedLocalModel['gpt-2']]: 'gpt2-q0f16'
  // [SupportedLocalModel['mistral-7b-v0.2']]: 'Mistral-7B-Instruct-v0.2-q3f16_1'
};

const chat = new webllm.ChatModule();

// To reset temperature, WebLLM requires to reload the model. Therefore, we just
// fix the temperature for now.
let _temperature = 0.2;

let _modelLoadingComplete: Promise<void> | null = null;

chat.setInitProgressCallback((report: webllm.InitProgressReport) => {
  // Update the main thread about the progress
  console.log(report.text);
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
    temperature: temperature,
    conv_config: CONV_TEMPLATES[model],
    conv_template: 'custom'
  };
  _modelLoadingComplete = chat.reload(curModel, chatOption, APP_CONFIGS);
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

    // Reset the chat cache to avoid memorizing previous messages
    await chat.resetChat();

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
  const inCache = await webllm.hasModelInCache(curModel, APP_CONFIGS);
  return inCache;
};

// Below helper functions are from TVM
// https:github.com/mlc-ai/relax/blob/71e8089ff3d26877f4fd139e52c30cba24f23315/web/src/webgpu.ts#L36

// Types are from @webgpu/types
export interface GPUDeviceDetectOutput {
  adapter: GPUAdapter;
  adapterInfo: GPUAdapterInfo;
  device: GPUDevice;
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
        'Cannot initialize runtime because of requested maxBufferSize ' +
          `exceeds limit. requested=${computeMB(requiredMaxBufferSize)}, ` +
          `limit=${computeMB(adapter.limits.maxBufferSize)}. ` +
          'This error may be caused by an older version of the browser (e.g. Chrome 112). ' +
          'You can try to upgrade your browser to Chrome 113 or later.'
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
        'Requested maxStorageBufferBindingSize exceeds limit. \n' +
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
          'Cannot initialize runtime because of requested maxStorageBufferBindingSize ' +
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
        'Cannot initialize runtime because of requested maxComputeWorkgroupStorageSize ' +
          `exceeds limit. requested=${requiredMaxComputeWorkgroupStorageSize}, ` +
          `limit=${adapter.limits.maxComputeWorkgroupStorageSize}. `
      );
    }

    const requiredFeatures: GPUFeatureName[] = [];
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

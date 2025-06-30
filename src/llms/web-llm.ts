import * as webllm from '@mlc-ai/web-llm';
import type { ConvTemplateConfig } from '@mlc-ai/web-llm/lib/config';
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
enum Role {
  user = 'user',
  assistant = 'assistant'
}

const CONV_TEMPLATES: Record<
  SupportedLocalModel,
  Partial<ConvTemplateConfig>
> = {
  [SupportedLocalModel['tinyllama-1.1b']]: {
    system_template: '<|im_start|><|im_end|> ',
    roles: {
      [Role.user]: '<|im_start|>user',
      [Role.assistant]: '<|im_start|>assistant'
    },
    offset: 0,
    seps: ['', ''],
    stop_str: ['<|im_end|>'],
    stop_token_ids: [2]
  },
  [SupportedLocalModel['llama-2-7b']]: {
    system_template: '[INST] <<SYS>><</SYS>>\n\n ',
    roles: {
      [Role.user]: '[INST]',
      [Role.assistant]: '[/INST]'
    },
    offset: 0,
    seps: [' ', ' '],
    role_content_sep: ' ',
    role_empty_sep: ' ',
    stop_str: ['[INST]'],
    system_prefix_token_ids: [1],
    stop_token_ids: [2],
    add_role_after_system_message: false
  },
  [SupportedLocalModel['phi-2']]: {
    system_template: '',
    system_message: '',
    roles: {
      [Role.user]: 'Instruct',
      [Role.assistant]: 'Output'
    },
    offset: 0,
    seps: ['\n'],
    stop_str: ['<|endoftext|>'],
    stop_token_ids: [50256]
  },
  [SupportedLocalModel['gemma-2b']]: {
    system_template: '',
    system_message: '',
    roles: {
      [Role.user]: '<start_of_turn>user',
      [Role.assistant]: '<start_of_turn>model'
    },
    offset: 0,
    seps: ['<end_of_turn>\n', '<end_of_turn>\n'],
    role_content_sep: '\n',
    role_empty_sep: '\n',
    stop_str: ['<end_of_turn>'],
    system_prefix_token_ids: [2],
    stop_token_ids: [1, 107]
  }
};

const modelMap: Record<SupportedLocalModel, string> = {
  [SupportedLocalModel['tinyllama-1.1b']]: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1',
  [SupportedLocalModel['llama-2-7b']]: 'Llama-2-7b-chat-hf-q4f16_1',
  [SupportedLocalModel['phi-2']]: 'Phi2-q4f16_1',
  [SupportedLocalModel['gemma-2b']]: 'gemma-2b-it-q4f16_1'
};

const initProgressCallback = (report: webllm.InitProgressReport) => {
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
};

let engine: Promise<webllm.EngineInterface> | null = null;

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
  const curModel = modelMap[model];

  // Only use custom conv template for Llama to override the pre-included system
  // prompt from WebLLM
  let chatOption: webllm.ChatOptions | undefined = undefined;

  if (model === SupportedLocalModel['llama-2-7b']) {
    chatOption = {
      conv_config: CONV_TEMPLATES[model],
      conv_template: 'custom'
    };
  }

  engine = webllm.CreateEngine(curModel, {
    initProgressCallback: initProgressCallback,
    chatOpts: chatOption
  });

  await engine;

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
    const curEngine = await engine!;
    const response = await curEngine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      n: 1,
      max_gen_len: 2048,
      // Override temperature to 0 because local models are very unstable
      temperature: 0
      // logprobs: false
    });

    // Reset the chat cache to avoid memorizing previous messages
    await curEngine.resetChat();

    // Send back the data to the main thread
    const message: TextGenLocalWorkerMessage = {
      command: 'finishTextGen',
      payload: {
        requestID: 'web-llm',
        apiKey: '',
        result: response.choices[0].message.content || '',
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
  const inCache = await webllm.hasModelInCache(curModel);
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

    // @ts-ignore
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
      // @ts-ignore
      adapterInfo: adapterInfo,
      device: device
    };
  } else {
    return undefined;
  }
}

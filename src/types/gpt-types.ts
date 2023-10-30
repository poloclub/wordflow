export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
  };
  finish_reason: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  functions?: ChatFunction[];
  function_call?: string | undefined;
  temperature?: number | null;
  top_p?: number | null;
  n?: number | null;
  stream?: boolean | null;
  stop?: string | string[] | null;
  max_tokens?: number | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  logit_bias?: { [key: string]: number };
  user?: string;
}

export interface ChatMessage {
  role: string;
  content: string | null;
  name?: string;
  function_call?: ChatFunctionCall;
}

export interface ChatFunctionCall {
  name: string;
  arguments: string;
}

export interface ChatFunction {
  name: string;
  description?: string;
  parameters: unknown;
}

/**
 * Type definitions for the Gemini API calls
 */

/**
 * Harm categories that would cause prompts or candidates to be blocked.
 */
export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
}

/**
 * Threshold Threshold above which a prompt or candidate will be blocked.
 * @public
 */
export enum HarmBlockThreshold {
  // Threshold is unspecified.
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  // Content with NEGLIGIBLE will be allowed.
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  // Content with NEGLIGIBLE and LOW will be allowed.
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  // Content with NEGLIGIBLE, LOW, and MEDIUM will be allowed.
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  // All content will be allowed.
  BLOCK_NONE = 'BLOCK_NONE'
}

/**
 * Probability that a prompt or candidate matches a harm category.
 * @public
 */
export enum HarmProbability {
  // Probability is unspecified.
  HARM_PROBABILITY_UNSPECIFIED = 'HARM_PROBABILITY_UNSPECIFIED',
  // Content has a negligible chance of being unsafe.
  NEGLIGIBLE = 'NEGLIGIBLE',
  // Content has a low chance of being unsafe.
  LOW = 'LOW',
  // Content has a medium chance of being unsafe.
  MEDIUM = 'MEDIUM',
  // Content has a high chance of being unsafe.
  HIGH = 'HIGH'
}

export interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export interface SafetyRating {
  category: HarmCategory;
  probability: HarmProbability;
}

export interface GeminiGenerateTextRequestBody {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  safetySettings?: SafetySetting[];
  generationConfig?: {
    stopSequences?: string[];
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface GeminiGenerateTextResponseBody {
  candidates: Candidate[];
  promptFeedback: PromptFeedback;
}

interface Candidate {
  content: Content;
  finishReason: string;
  index: number;
  safetyRatings: SafetyRating[];
}

interface Content {
  parts: Part[];
  role: string;
}

interface Part {
  text: string;
}

interface PromptFeedback {
  safetyRatings: SafetyRating[];
}

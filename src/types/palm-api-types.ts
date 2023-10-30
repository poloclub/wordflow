/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Type definitions for the PaLM API calls
 */

export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 0,
  HARM_CATEGORY_DEROGATORY = 1,
  HARM_CATEGORY_TOXICITY = 2,
  HARM_CATEGORY_VIOLENCE = 3,
  HARM_CATEGORY_SEXUAL = 4,
  HARM_CATEGORY_MEDICAL = 5,
  HARM_CATEGORY_DANGEROUS = 6
}

export enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 0,
  BLOCK_LOW_AND_ABOVE = 1,
  BLOCK_MEDIUM_AND_ABOVE = 2,
  BLOCK_ONLY_HIGH = 3,
  BLOCK_NONE = 4
}

export enum HarmProbability {
  HARM_PROBABILITY_UNSPECIFIED = 0,
  NEGLIGIBLE = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4
}

export interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export interface SafetyRating {
  category: HarmCategory;
  probability: HarmProbability;
}

export interface CitationSource {
  startIndex: number;
  endIndex: number;
  uri: string;
  license: string;
}

export interface CitationMetadata {
  citationSources: CitationSource[];
}

export interface TextCompletion {
  output: string;
  safetyRatings: SafetyRating[];
  citationMetadata: CitationMetadata;
}

export enum BlockedReason {
  BLOCKED_REASON_UNSPECIFIED = 0,
  SAFETY = 1,
  OTHER = 2
}

export interface ContentFilter {
  reason: BlockedReason;
  message: string;
}

export interface SafetyFeedback {
  rating: SafetyRating;
  setting: SafetySetting;
}

export interface PalmGenerateTextRequestBody {
  prompt: {
    text: string;
  };
  safetySettings?: SafetySetting[];
  stopSequences?: string[];
  temperature?: number;
  candidateCount?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface PalmGenerateTextResponseBody {
  candidates: TextCompletion[];
  filters: ContentFilter[];
  safetyFeedback: SafetyFeedback;
}

export interface PalmEmbedTextRequestBody {
  text: string;
}

export interface PalmEmbedTextResponseBody {
  embedding: { value: number[] };
}

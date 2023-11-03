/**
 * Promptlet object describing a prompt functionality.
 */
export interface Promptlet {
  /** Short name of the promptlet */
  name: string;

  /** Detailed description of the promptlet */
  description: string;

  /** The associated prompt */
  prompt: string;

  /** Desired temperature of the prompt*/
  temperature: number;

  /** Associated tags */
  tags: string[];

  /** A simple regex rule to parse the output */
  outputParser: string;

  /** A unicode character used as an icon for the promptlet (can be emoji) */
  iconUnicode: string;
}

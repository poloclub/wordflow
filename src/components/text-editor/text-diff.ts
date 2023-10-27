import DiffMatchPatch from 'diff-match-patch';
const DMP = new DiffMatchPatch();

/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
const DIFF_DELETE = -1;
const DIFF_INSERT = 1;
const DIFF_EQUAL = 0;

/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * Implementation based on:
 * https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs#word-mode
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 */
export const diff_linesToWords_ = (text1: string, text2: string) => {
  const lineArray = []; // e.g. lineArray[4] == 'Hello\n'
  const lineHash: { [key: string]: number } = {}; // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  const diff_linesToCharsMunge_ = (text: string) => {
    let chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    let lineStart = 0;
    let lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    let lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      // eslint-disable-next-line no-useless-escape
      lineEnd = text.replace(/[\n,\.;:]/g, ' ').indexOf(' ', lineStart);
      if (lineEnd == -1) {
        lineEnd = text.length - 1;
      }
      let line = text.substring(lineStart, lineEnd + 1);

      if (
        lineHash.hasOwnProperty
          ? // eslint-disable-next-line no-prototype-builtins
            lineHash.hasOwnProperty(line)
          : lineHash[line] !== undefined
      ) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        if (lineArrayLength == maxLines) {
          // Bail out at 65535 because
          // String.fromCharCode(65536) == String.fromCharCode(0)
          line = text.substring(lineStart);
          lineEnd = text.length;
        }
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
      lineStart = lineEnd + 1;
    }
    return chars;
  };
  // Allocate 2/3rds of the space for text1, the rest for text2.
  let maxLines = 40000;
  const chars1 = diff_linesToCharsMunge_(text1);
  maxLines = 65535;
  const chars2 = diff_linesToCharsMunge_(text2);
  return { chars1: chars1, chars2: chars2, lineArray: lineArray };
};

/**
 * Do a quick word-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * Implementation based on:
 * https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs#word-mode
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number | undefined} deadline Time when the diff should be complete by.
 */
export const diff_wordMode_ = (
  text1: string,
  text2: string,
  deadline?: number
) => {
  // Scan the text on a line-by-line basis first.
  const a = diff_linesToWords_(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  const linearray = a.lineArray;

  const diffs = DMP.diff_main(text1, text2, false, deadline);

  // Convert the diff back to original text.
  DMP.diff_charsToLines_(diffs, linearray);
  // Eliminate freak matches (e.g. blank lines)
  DMP.diff_cleanupSemantic(diffs);

  return diffs;
};

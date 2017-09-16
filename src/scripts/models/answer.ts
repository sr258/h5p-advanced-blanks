import { Message } from './message';
import { Highlight } from './highlight';
import { ISettings } from '../services/settings';
import * as jsdiff from 'diff';

export enum Correctness {
  ExactMatch,
  CloseMatch,
  NoMatch
}

export class Evaluation {
  public correctness: Correctness;
  public characterDifferenceCount: number;
  public usedAlternative: string;

  constructor(public usedAnswer: Answer) {
    this.correctness = Correctness.NoMatch;
    this.characterDifferenceCount = 0;
    this.usedAlternative = "";
  }
}

/**
 * Represents a possible answer the content author enters for a blank, e.g. the correct or an incorrect answer.
 */
export class Answer {
  /**
   * The alternatives are equivalent strings that the library should treat the same way, e.g. show the same feedback. 
   */
  alternatives: string[];

  /**
   * This is the message that is displayed when the answer was entered by the user.
   */
  message: Message;

  /**
   * Is true if the expected text for this answer is empty.
   */
  appliesAlways: boolean;

  /**
   * @param  {string} answerText - The expected answer. Alternatives are separated by | or ; . (e.g. "Alternative 1|Alternative 2|Alternative 3|..."  -or- "Alternative 1;Alternative 2;Alternative 3")
   * @param  {string} reaction - The tooltip that should be displayed. Format: Tooltip Text;!!-1!! !!+1!!
   */
  constructor(answerText: string, reaction: string, showHighlight: boolean, highlight: number, private settings: ISettings) {
    this.alternatives = answerText.split(/[;|]/).map(s => s.trim());
    this.message = new Message(reaction, showHighlight, highlight);
    if (answerText.trim() === "") {
      this.appliesAlways = true;
    } else {
      this.appliesAlways = false;
    }
  }

  /**
   * Looks through the object's message ids and stores the references to the highlight object for these ids.
   * @param  {Highlight[]} highlightsBefore
   * @param  {Highlight[]} highlightsAfter
   */
  public linkHighlightIdToObject(highlightsBefore: Highlight[], highlightsAfter: Highlight[]) {
    this.message.linkHighlight(highlightsBefore, highlightsAfter);
  }
  /**
   * Turns on the highlights set by the content author for this answer.
   */
  public activateHighlight() {
    if (this.message.highlightedElement)
      this.message.highlightedElement.isHighlighted = true;
  }

  private cleanString(text: string): string {
    text = text.trim();
    return text.replace(/\s{2,}/g, " ");
  }
  /**
   * Looks through the diff and checks how many character change operations are needed to turn one string into the other. Should return the same results as the Levensthein distance. 
   * @param  {[{added?:boolean, boolean: removed?, string: value}]} diff - as returned by jsdiff
   * @returns number - the count of changes (replace, add, delete) needed to change the text from one string to the other 
   */
  private getChangesCountFromDiff(diff: [{ added?: boolean, removed?: boolean, value: string }]): number {
    var totalChangesCount = 0;
    var lastType = "";
    var lastCount = 0;

    for (var element of diff) {
      if (element.removed) {
        totalChangesCount += element.value.length;
        lastType = "removed";
      }
      else if (element.added) {
        if (lastType === "removed") {
          if (lastCount < element.value.length) {
            totalChangesCount += element.value.length - lastCount;
          }
        } else {
          totalChangesCount += element.value.length;
        }
        lastType = "added";
      }
      else {
        lastType = "same";
      }
      lastCount = element.value.length;
    }

    return totalChangesCount;
  }
  /**
   * Returns how many characters can be wrong to still be counted as a spelling mistake.
   * If spelling mistakes are turned off through the settings, it will return 0.
   * @param  {string} text
   * @returns number
   */

  private getAcceptableSpellingMistakes(text: string): number {
    var acceptableTypoCount: number;
    if (this.settings.warnSpellingErrors || this.settings.acceptSpellingErrors) // TODO: consider removal
      acceptableTypoCount = Math.floor(text.length / 10) + 1;
    else
      acceptableTypoCount = 0;

    return acceptableTypoCount;
  }
  /**
   * Checks if the text entered by the user in an ettempt is matched by the answer,
   * @param  {string} attempt The text entered by the user.
   * @returns Evaluation indicates if the entered text is matched by the answer.
   */
  public evaluateAttempt(attempt: string): Evaluation {
    var cleanedAttempt = this.cleanString(attempt);
    var evaluation = new Evaluation(this);

    for (var alternative of this.alternatives) {
      var cleanedAlternative = this.cleanString(alternative);

      var diff = jsdiff.diffChars(cleanedAlternative, cleanedAttempt,
        { ignoreCase: !this.settings.caseSensitive });
      var changeCount = this.getChangesCountFromDiff(diff);

      if (changeCount === 0) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.ExactMatch;
        return evaluation;
      }

      if (changeCount <= this.getAcceptableSpellingMistakes(alternative)
        && (evaluation.characterDifferenceCount === 0 || changeCount < evaluation.characterDifferenceCount)) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.CloseMatch;
        evaluation.characterDifferenceCount = changeCount;
      }
    }
    return evaluation;
  }
}
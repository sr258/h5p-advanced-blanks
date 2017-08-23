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
  constructor(answerText: string, reaction: string, private settings: ISettings) {
    this.alternatives = answerText.split(/[;|]/).map(s => s.trim());
    this.message = new Message(reaction);
    if (answerText.trim() === "") {
      this.appliesAlways = true;
    } else {
      this.appliesAlways = false;
    }
  }

  linkHighlightIdsToObjects = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]) => {
    this.message.linkHighlights(highlightsBefore, highlightsAfter);
  }

  activateHighlights = () => {
    for (var highlightedObject of this.message.highlightedElements) {
      highlightedObject.isHighlighted = true;
    }
  }

  private cleanString(text: string) {
    text = text.replace(/\s{2,}/g, " ");

    return text;
  }

  private getChangeCountFromDiff(diff: [{ added?: boolean, removed?: boolean, value: string }]): number {
    var diffCount = 0;
    var lastType = "";
    var lastCount = 0;

    diff.forEach(element => {
      if (element.removed) {
        diffCount += element.value.length;
        lastCount = element.value.length;
      }
      if (element.added) {
        if (lastType === "removed") {
          if (lastCount < element.value.length) {
            diffCount += element.value.length - lastCount;
          }
        } else {
          diffCount += element.value.length;
        }
        lastCount = element.value.length;
      }

      if (element.added)
        lastType = "added";
      else if (element.removed)
        lastType = "removed";
      else
        lastType = "same";
    });

    return diffCount;
  }

  public evaluateEnteredText(enteredText: string): Evaluation {
    var cleanedEnteredText = this.cleanString(enteredText);

    var evaluation = new Evaluation(this);

    for (var alternative of this.alternatives) {
      var acceptableTypoCount: number;
      if (this.settings.warnSpellingErrors || this.settings.acceptSpellingErrors) // TODO: consider removal
        acceptableTypoCount = Math.floor(alternative.length / 10) + 1;
      else
        acceptableTypoCount = 0;

      var cleanedAlternative = this.cleanString(alternative);

      var diff = jsdiff.diffChars(cleanedAlternative, cleanedEnteredText, { ignoreCase: !this.settings.caseSensitive });
      var necessaryChanges = this.getChangeCountFromDiff(diff);

      if (necessaryChanges == 0) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.ExactMatch;
        return evaluation;
      }

      if (necessaryChanges <= acceptableTypoCount && (evaluation.characterDifferenceCount == 0 || necessaryChanges < evaluation.characterDifferenceCount)) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.CloseMatch;
        evaluation.characterDifferenceCount = necessaryChanges;
      }
    }

    return evaluation;
  }
}
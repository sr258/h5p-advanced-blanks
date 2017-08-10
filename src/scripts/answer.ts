import { Message } from './message';
import { ClozeHighlight } from './cloze-highlight';
import { Settings } from './settings';
import { Evaluation } from './enums';
import { Levensthein } from './levenshtein';

export class Answer {
  alternatives: string[];
  message: Message;
  appliesAlways: boolean;

  constructor(answers: string, reaction: string) {
    this.alternatives = answers.split(/[;|]/).map(s => s.trim());
    this.message = new Message(reaction);
    if (answers.trim() === "") {
      this.appliesAlways = true;
    } else {
      this.appliesAlways = false;
    }
  }

  linkHighlightIdsToObjects = (highlightsBefore: ClozeHighlight[], highlightsAfter: ClozeHighlight[]) => {
    this.message.linkHighlights(highlightsBefore, highlightsAfter);
  }

  activateHighlights = () => {
    for (var highlightedObject of this.message.highlightedElements) {
      highlightedObject.isHighlighted = true;
    }
  }

  private getCleanedText(text: string) {
    var caseSensitivity = Settings.instance.caseSensivitity;

    if (caseSensitivity == false)
      return text.toLocaleLowerCase();
    else
      return text;
  }

  public evaluateEnteredText(enteredText: string): Evaluation {
    var cleanedEnteredText = this.getCleanedText(enteredText);

    var acceptableTypoCount: number;
    if (Settings.instance.acceptTypos)
      acceptableTypoCount = Math.floor(enteredText.length / 10) + 1;
    else
      acceptableTypoCount = 0;

    var bestEvaluation: Evaluation = Evaluation.NoMatch;

    for (var alternative of this.alternatives) {
      var cleanedAlternative = this.getCleanedText(alternative);

      if (cleanedAlternative == cleanedEnteredText)
        return Evaluation.ExactMatch;

      var necessaryChanges = Levensthein.getEditDistance(cleanedEnteredText, cleanedAlternative);
      if (necessaryChanges <= acceptableTypoCount)
        bestEvaluation = Evaluation.CloseMatch;
    }

    return bestEvaluation;
  }
}
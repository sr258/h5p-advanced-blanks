import { ClozeElement, ClozeElementType } from './cloze-element';
import { Answer } from './answer';
import { Message } from './message';
import { Highlight } from './highlight';
import { Evaluation, MessageType, ClozeType } from './enums';
import { H5PLocalization, LocalizationLabels } from './localization';
import { Settings } from "./settings";
import { getLongestString, shuffleArray } from "../lib/helpers";

export class Blank extends ClozeElement {
  // content
  correctAnswers: Answer[];
  incorrectAnswers: Answer[];
  hint: Message;
  id: string;
  choices: string[];
  hasHint: boolean;

  // viewmodel stuff
  enteredText: string;
  isCorrect: boolean;
  isError: boolean;
  isRetry: boolean;
  message: string;
  showMessage: boolean;
  minTextLength: number;

  // internal
  private snippetRegex = new RegExp("-(\\d+)-");

  /**
   * Add incorrect answers after initializing the object. Call finishInitialization()
   * when done.
   * @param  {Settings} settings
   * @param  {string} id
   * @param  {string} correctText?
   * @param  {string} hintText?
   */
  constructor(private settings: Settings, id: string, correctText?: string, hintText?: string) {
    super();
    this.initializeAsEmpty();

    this.id = id;
    if (correctText) {
      this.correctAnswers.push(new Answer(correctText, ""));
    }
    this.hint = new Message(hintText ? hintText : "");
    this.hasHint = this.hint.text != "";
  }

  /**
   * Call this method when all incorrect answers have been added.
   */
  public finishInitialization(): void {
    if (this.settings.clozeType === ClozeType.Select) {
      this.loadChoices();
    }
    this.calculateMinTextLength();
  }

  /**
   * Adds the incorrect answer to the list.
   * @param text - What the user must enter.
   * @param reaction  - What the user gets displayed when he enteres the text.
   */
  public addIncorrectAnswer(text: string, reaction: string): void {
    this.incorrectAnswers.push(
      new Answer(text, reaction));
  }

  /**
   * Returns a cloned version of this object. This is not a deep clone in
   * the sense that dependent objects are cloned as well! 
   */
  public clone(): Blank {
    var newGap = new Blank(this.settings, this.id);

    newGap.correctAnswers = this.correctAnswers;
    newGap.incorrectAnswers = this.incorrectAnswers;
    newGap.hint = this.hint;
    newGap.hasHint = this.hasHint;

    newGap.finishInitialization();
    return newGap;
  }

  public replaceSnippets(snippets: string[]) {
    this.correctAnswers.concat(this.incorrectAnswers)
      .forEach(answer => answer.message.text = this.getStringWithSnippets(answer.message.text, snippets));
    this.hint.text = this.getStringWithSnippets(this.hint.text, snippets);
  }

  private initializeAsEmpty(): void {
    this.enteredText = "";
    this.correctAnswers = new Array();
    this.incorrectAnswers = new Array();
    this.choices = new Array();
    this.showMessage = false;
    this.type = ClozeElementType.Blank;
  }

  private getStringWithSnippets(text: string, snippets: string[]): string {
    var match: RegExpMatchArray;
    while ((match = text.match(this.snippetRegex))) {
      var index = parseInt(match[1]) - 1;
      let snippet = "";
      if (index < snippets.length && index >= 0)
        snippet = snippets[index];
      text = text.replace(this.snippetRegex, snippet);
    }

    return text;
  }

  /**
   * Returns how many characters the input box must have be to allow for all correct answers.
   */
  // TODO: refactor
  private calculateMinTextLength(): void {
    var answers: string[] = new Array();
    for (var correctAnswer of this.correctAnswers) {
      answers.push(getLongestString(correctAnswer.alternatives));
    }
    var longestAnswer = getLongestString(answers);
    var l = longestAnswer.length;
    this.minTextLength = Math.max(10, l - (l % 10) + 10);
  }

  /**
   * Creates a list of choices from all alternatives provided by
   * the correct and incorrect answers.
   */
  private loadChoices(): string[] {
    this.choices = new Array();
    for (var answer of this.correctAnswers) {
      for (var alternative of answer.alternatives) {
        this.choices.push(alternative);
      }
    }

    for (var answer of this.incorrectAnswers) {
      for (var alternative of answer.alternatives) {
        this.choices.push(alternative);
      }
    }

    this.choices = shuffleArray(this.choices);
    this.choices.unshift("");

    return this.choices;
  }
  /**
   * Adds the highlight objects to the answers in the correct and incorrect answer list.
   * @param  {Highlight[]} highlightsBefore - All highlights coming before the gap.
   * @param  {Highlight[]} highlightsAfter - All highlights coming after the gap.
   */
  linkHighlightIdsToObjects = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]) => {
    for (var answer of this.correctAnswers) {
      answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
    }

    for (var answer of this.incorrectAnswers) {
      answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
    }

    this.hint.linkHighlights(highlightsBefore, highlightsAfter);
  }

  private displayTooltip(message: string, type: MessageType) {
    this.showMessage = true;
    this.message = message;
  }

  public removeTooltip() {
    this.showMessage = false;
  }

  private setTooltipErrorText(text: string) {
    this.displayTooltip(text, MessageType.Error);
  }

  /**
   * Checks if the entered text is the correct answer or one of the 
   * incorrect ones and gives the user feedback accordingly.
   */
  public evaluateEnteredAnswer() {
    this.removeTooltip();

    var cleanedEnteredText = this.enteredText.trim();
    cleanedEnteredText = cleanedEnteredText.replace(/\s{2,}/, " ");

    var exactCorrectMatches = this.correctAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.ExactMatch);
    var closeCorrectMatches = this.correctAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.CloseMatch);
    var exactIncorrectMatches = this.incorrectAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.ExactMatch);
    var closeIncorrectMatches = this.incorrectAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.CloseMatch);

    if (exactCorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Correct);
      return;
    }

    if (exactIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(exactIncorrectMatches[0]);
      return;
    }

    if (closeCorrectMatches.length > 0) {
      this.displayTooltip(H5PLocalization.getInstance().getTextFromLabel(LocalizationLabels.typoMessage), MessageType.Retry);
      this.setAnswerState(MessageType.Retry);
      return;
    }

    if (closeIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(closeIncorrectMatches[0]);
      return;
    }

    var alwaysApplyingAnswers = this.incorrectAnswers.filter(a => a.appliesAlways);
    if (alwaysApplyingAnswers && alwaysApplyingAnswers.length > 0) {
      this.showErrorTooltip(alwaysApplyingAnswers[0]);
    }

    this.setAnswerState(MessageType.Error);
  }

  /**
   * Sets the boolean properties isCorrect, is Error and isRetry according to thepassed  messageType.
   * @param messageType 
   */
  private setAnswerState(messageType: MessageType) {
    this.isCorrect = false;
    this.isError = false;
    this.isRetry = false;

    switch (messageType) {
      case MessageType.Correct:
        this.isCorrect = true;
        break;
      case MessageType.Error:
        this.isError = true;
        break;
      case MessageType.Retry:
        this.isRetry = true;
        break;
    }
  }

  private showErrorTooltip(answer: Answer) {
    if (answer.message && answer.message.text) {
      this.setTooltipErrorText(answer.message.text);
    }
    answer.activateHighlights();
  }

  /**
   * Displays the hint in the tooltip.
   */
  public showHint() {
    this.removeTooltip();
    if (this.hint && this.hint.text != "") {
      this.displayTooltip(this.hint.text, MessageType.Retry);
      if (this.hint.highlightedElements)
        this.hint.highlightedElements.forEach((highlight) => highlight.isHighlighted = true);
      this.isRetry = true;
    }
  }
}
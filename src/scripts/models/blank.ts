import { MessageService } from '../services/message-service';
import { ClozeElement, ClozeElementType } from './cloze-element';
import { Answer, Correctness } from './answer';
import { Message } from './message';
import { Highlight } from './highlight';
import { MessageType, ClozeType } from './enums';
import { H5PLocalization, LocalizationLabels } from '../services/localization';
import { ISettings } from "../services/settings";
import { getLongestString, shuffleArray } from "../../lib/helpers";
import * as jsdiff from 'diff';

export class Blank extends ClozeElement {
  // content
  correctAnswers: Answer[];
  incorrectAnswers: Answer[];
  hint: Message;
  id: string;
  choices: string[];
  hasHint: boolean;

  // viewmodel stuff

  lastCheckedText: string;
  enteredText: string;
  isCorrect: boolean;
  isError: boolean;
  isRetry: boolean;
  hasPendingFeedback: boolean;
  isShowingSolution: boolean;
  message: string;
  minTextLength: number;
  speechBubble: any;

  /**
   * Add incorrect answers after initializing the object. Call finishInitialization()
   * when done.
   * @param  {ISettings} settings
   * @param  {string} id
   * @param  {string} correctText?
   * @param  {string} hintText?
   */
  constructor(private settings: ISettings, private localization: H5PLocalization, private jquery: JQueryStatic, private messageService: MessageService, id: string) {
    super();

    this.enteredText = "";
    this.correctAnswers = new Array();
    this.incorrectAnswers = new Array();
    this.choices = new Array();
    this.type = ClozeElementType.Blank;

    this.id = id;
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

  public addCorrectAnswer(answer: Answer) {
    this.correctAnswers.push(answer);
  }

  public setHint(message: Message) {
    this.hint = message;
    this.hasHint = this.hint.text != "";
  }

  /**
   * Adds the incorrect answer to the list.
   * @param text - What the user must enter.
   * @param reaction  - What the user gets displayed when he enteres the text.
   */
  public addIncorrectAnswer(text: string, reaction: string): void {
    this.incorrectAnswers.push(
      new Answer(text, reaction, this.settings));
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
  * Clears the blank from all entered text and hides popups.
  */
  public reset() {
    this.enteredText = "";
    this.lastCheckedText = "";
    this.removeTooltip();
    this.setAnswerState(MessageType.None);
  }

  /**
   * Sets the blank to a state in which the correct solution if shown if the user
   * hasn't entered a correct one so far.
   */
  public showSolution() {
    this.evaluateAttempt(true);
    this.removeTooltip();
    if (this.isCorrect)
      return;
    this.enteredText = this.correctAnswers[0].alternatives[0];
    this.setAnswerState(MessageType.ShowSolution);
  }

  public onFocussed() {
    if (this.hasPendingFeedback) {
      this.evaluateAttempt(false);
    }
  }

  private displayTooltip(message: string, type: MessageType, surpressTooltip: boolean, id?: string) {
    if (!surpressTooltip)
      this.messageService.show(id ? id : this.id, message, this, type);
    else {
      this.hasPendingFeedback = true;
    }
  }

  public removeTooltip() {
    this.messageService.hide();
  }

  private setTooltipErrorText(message: Message, surpressTooltip: boolean) {
    if (message.highlightedElements.length > 0) {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip, message.highlightedElements[message.highlightedElements.length - 1].id);
    }
    else {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip);
    }
  }

  private getSpellingMistakeMessage(expectedText: string, enteredText: string): string {
    var message = this.localization.getTextFromLabel(LocalizationLabels.typoMessage)

    var diff = jsdiff.diffChars(expectedText, enteredText, { ignoreCase: !this.settings.caseSensitive });

    var mistakeSpan = this.jquery("<span/>", { "class": "spelling-mistake" });
    for (var index = 0; index < diff.length; index++) {
      var part = diff[index];
      var spanClass = '';
      if (part.removed) {
        if (index === diff.length - 1 || !diff[index + 1].added) {
          part.value = part.value.replace(/./g, "_");
          spanClass = 'missing-character';
        }
        else {
          continue;
        }
      }
      if (part.added) {
        spanClass = 'mistaken-character';
      }

      var span = this.jquery("<span/>", { "class": spanClass, "html": part.value.replace(" ", "&nbsp;") });
      mistakeSpan.append(span);
    }

    message = message.replace("@mistake", this.jquery("<span/>").append(mistakeSpan).html());
    return message;
  }

  /**
   * Checks if the entered text is the correct answer or one of the 
   * incorrect ones and gives the user feedback accordingly.
   */
  public evaluateAttempt(surpressTooltips: boolean, forceCheck?: boolean) {
    if (!this.hasPendingFeedback && this.lastCheckedText === this.enteredText && !forceCheck)
      return;

    this.lastCheckedText = this.enteredText.toString();
    this.hasPendingFeedback = false;
    this.removeTooltip();

    var exactCorrectMatches = this.correctAnswers.map(answer => answer.evaluateAttempt(this.enteredText)).filter(evaluation => evaluation.correctness === Correctness.ExactMatch).sort(evaluation => evaluation.characterDifferenceCount);
    var closeCorrectMatches = this.correctAnswers.map(answer => answer.evaluateAttempt(this.enteredText)).filter(evaluation => evaluation.correctness === Correctness.CloseMatch).sort(evaluation => evaluation.characterDifferenceCount);
    var exactIncorrectMatches = this.incorrectAnswers.map(answer => answer.evaluateAttempt(this.enteredText)).filter(evaluation => evaluation.correctness === Correctness.ExactMatch).sort(evaluation => evaluation.characterDifferenceCount);
    var closeIncorrectMatches = this.incorrectAnswers.map(answer => answer.evaluateAttempt(this.enteredText)).filter(evaluation => evaluation.correctness === Correctness.CloseMatch).sort(evaluation => evaluation.characterDifferenceCount);

    if (exactCorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Correct);
      if (!this.settings.caseSensitive) {
        this.enteredText = exactCorrectMatches[0].usedAlternative;
      }
      return;
    }

    if (exactIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(exactIncorrectMatches[0].usedAnswer, surpressTooltips);
      return;
    }

    if (closeCorrectMatches.length > 0) {
      if (this.settings.warnSpellingErrors) {
        this.displayTooltip(this.getSpellingMistakeMessage(closeCorrectMatches[0].usedAlternative, this.enteredText), MessageType.Retry, surpressTooltips);
        this.setAnswerState(MessageType.Retry);
        return;
      }
      if (this.settings.acceptSpellingErrors) {
        this.setAnswerState(MessageType.Correct);
        this.enteredText = closeCorrectMatches[0].usedAlternative;
        return;
      }
    }

    if (closeIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(closeIncorrectMatches[0].usedAnswer, surpressTooltips);
      return;
    }

    var alwaysApplyingAnswers = this.incorrectAnswers.filter(a => a.appliesAlways);
    if (alwaysApplyingAnswers && alwaysApplyingAnswers.length > 0) {
      this.showErrorTooltip(alwaysApplyingAnswers[0], surpressTooltips);
    }

    this.setAnswerState(MessageType.Error);
  }

  public onTyped(): void {
    this.setAnswerState(MessageType.None);
    this.lastCheckedText = "";
    this.removeTooltip();
  }

  public lostFocus(): void {
    if (this.messageService.isActive(this)) {
      this.messageService.hide();
    }
  }

  /**
   * Sets the boolean properties isCorrect, is Error and isRetry according to thepassed  messageType.
   * @param messageType 
   */
  private setAnswerState(messageType: MessageType) {
    this.isCorrect = false;
    this.isError = false;
    this.isRetry = false;
    this.isShowingSolution = false;

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
      case MessageType.ShowSolution:
        this.isShowingSolution = true;
        break;
    }
  }

  private showErrorTooltip(answer: Answer, surpressTooltip: boolean) {
    if (answer.message && answer.message.text) {
      this.setTooltipErrorText(answer.message, surpressTooltip);
    }
    if (!surpressTooltip) {
      answer.activateHighlights();
    }
  }

  /**
   * Displays the hint in the tooltip.
   */
  public showHint() {
    if (this.isShowingSolution || this.isCorrect)
      return;

    this.removeTooltip();
    if (this.hint && this.hint.text != "") {
      this.displayTooltip(this.hint.text, MessageType.Retry, false);
      if (this.hint.highlightedElements)
        this.hint.highlightedElements.forEach((highlight) => highlight.isHighlighted = true);
      this.isRetry = true;
    }
  }

  public serialize() {
    return this.enteredText;
  }

  public deserialize(data: any) {
    this.enteredText = data;
  }
}
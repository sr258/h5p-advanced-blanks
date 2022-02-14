import { MessageService } from '../services/message-service';
import { BlankLoader } from '../content-loaders/blank-loader';
import { ClozeLoader } from '../content-loaders/cloze-loader';
import { Cloze } from "../models/cloze";
import { IDataRepository } from "../services/data-repository";
import { ISettings } from "../services/settings";
import { H5PLocalization } from "../services/localization";
import { ClozeType, SelectAlternatives } from "../models/enums";
import { Highlight } from "../models/highlight";
import { Blank } from "../models/blank";
import { Correctness } from '../models/answer';

import * as RactiveEventsKeys from '../../lib/ractive-events-keys';

interface ScoreChanged {
  (score: number, maxScore: number): void;
}

interface Solved {
  (): void;
}

interface Typed {
  (): void;
}

interface TextChanged {
  () : void;
}

export class ClozeController {
  private jquery: JQuery;

  private cloze: Cloze;
  private isSelectCloze: boolean;

  public onScoreChanged: ScoreChanged;
  public onSolved: Solved;
  public onTyped: Typed;
  public onTextChanged: TextChanged;

  // Storage of the ractive objects that link models and views
  private highlightRactives: { [id: string]: Ractive.Ractive } = {};
  private blankRactives: { [id: string]: Ractive.Ractive } = {};

  public get maxScore(): number {
    return this.cloze.blanks.length;
  }

  /**
   * Detect whether there are blanks with more than one solution.
   * @return {boolean} True if there is at least one blank with more than one solution.
   */
  public get hasAlternatives(): boolean {
    return this.cloze.blanks.some(b => b.correctAnswers[0].alternatives.length > 1);
  }

  public get currentScore(): number {
    const score = this.cloze.blanks.reduce((score, b) => {
      const notShowingSolution = !b.isShowingSolution;
      const correctAnswerGiven = b.correctAnswers[0].alternatives.indexOf(b.enteredText || '') !== -1;

      // Detect small mistakes
      const closeCorrectMatches = b.correctAnswers
        .map(answer => answer.evaluateAttempt(b.enteredText))
        .filter(evaluation => evaluation.correctness === Correctness.CloseMatch);
      const similarAnswerGiven = this.settings.acceptSpellingErrors && closeCorrectMatches.length > 0;

      return score += (notShowingSolution && (correctAnswerGiven || similarAnswerGiven)) ? 1 : 0;
    }, 0);

    return Math.max(0, score);
  }

  public get allBlanksEntered() {
    if (this.cloze)
      return this.cloze.blanks.every(blank => blank.isError || blank.isCorrect || blank.isRetry);
    return false;
  }

  public get isSolved(): boolean {
    return this.cloze.isSolved;
  }

  public get isFilledOut() {
    if (!this.cloze || this.cloze.blanks.length === 0)
      return true;
    return this.cloze.blanks.some(b => b.enteredText !== '');
  }

  public get isFullyFilledOut() {
    if (!this.cloze || this.cloze.blanks.length === 0)
      return true;
    return this.cloze.blanks.every(b => b.enteredText !== '');
  }

  constructor(private repository: IDataRepository, private settings: ISettings, private localization: H5PLocalization, private MessageService: MessageService) {
  }

  /**
   * Sets up all blanks, the cloze itself and the ractive bindings.
   * @param  {HTMLElement} root
   */
  initialize(root: HTMLElement, jquery: JQuery) {
    this.jquery = jquery;
    this.isSelectCloze = this.settings.clozeType === ClozeType.Select ? true : false;

    var blanks = this.repository.getBlanks();

    // Stop ractive debug mode
    Ractive.DEBUG = false;

    if (this.isSelectCloze && this.settings.selectAlternatives === SelectAlternatives.All) {
      for (var blank of blanks) {
        let otherBlanks = blanks.filter(v => v !== blank);
        blank.loadChoicesFromOtherBlanks(otherBlanks);
      }
    }

    var snippets = this.repository.getSnippets();
    blanks.forEach(blank => BlankLoader.instance.replaceSnippets(blank, snippets));

    this.cloze = ClozeLoader.createCloze(this.repository.getClozeText(), blanks);

    var containers = this.createAndAddContainers(root);
    containers.cloze.innerHTML = this.cloze.html;
    this.createRactiveBindings();
  }

  checkAll = () => {
    this.cloze.hideAllHighlights();
    for (var blank of this.cloze.blanks) {
      if ((!blank.isCorrect) && blank.enteredText !== "")
        blank.evaluateAttempt(true, true);
    }
    this.refreshCloze();
    this.checkAndNotifyCompleteness();
  }

  textTyped = (blank: Blank) => {
    blank.onTyped();
    if (this.onTyped)
      this.onTyped();
    this.refreshCloze();
  }

  focus = (blank: Blank) => {
    blank.onFocussed();
    this.refreshCloze();
  }

  displayFeedback = (blank: Blank) => {
    blank.onDisplayFeedback();
    this.refreshCloze();
  }

  showHint = (blank: Blank) => {
    this.cloze.hideAllHighlights();
    blank.showHint();
    this.refreshCloze();
  }

  requestCloseTooltip = (blank: Blank) => {
    blank.removeTooltip();
    this.refreshCloze();
    this.jquery.find("#" + blank.id).focus();
  }

  checkBlank = (blank: Blank, cause: string) => {
    if ((cause === 'blur' || cause === 'change')) {
      blank.lostFocus();
    }

    if (cause === 'change' && this.onTyped) {
      this.onTyped();
    }

    if (cause === 'enter') {
      // move to next blank
      var index = this.cloze.blanks.indexOf(blank);
      var nextId;
      while (index < this.cloze.blanks.length - 1 && !nextId) {
        index++;
        if (!this.cloze.blanks[index].isCorrect)
          nextId = this.cloze.blanks[index].id;
      }

      if (nextId)
        this.jquery.find("#" + nextId).focus();
    }
  }

  reset = () => {
    this.cloze.reset();
    this.refreshCloze();
  }

  showSolutions = () => {
    this.cloze.showSolutions();
    this.refreshCloze();
  }

  private createAndAddContainers(addTo: HTMLElement): { cloze: HTMLDivElement } {
    var clozeContainerElement = document.createElement('div');
    clozeContainerElement.id = 'h5p-cloze-container';
    if (this.settings.clozeType === ClozeType.Select) {
      clozeContainerElement.className = 'h5p-advanced-blanks-select-mode';
    } else {
      clozeContainerElement.className = 'h5p-advanced-blanks-type-mode';
    }
    addTo.appendChild(clozeContainerElement);

    return {
      cloze: clozeContainerElement
    };
  }

  private createHighlightBinding(highlight: Highlight) {
    this.highlightRactives[highlight.id] = new Ractive({
      el: '#container_' + highlight.id,
      template: require('../views/highlight.ractive.html'),
      data: {
        object: highlight
      }
    });
  }

  private createBlankBinding(blank: Blank) {
    var ractive = new Ractive({
      el: '#container_' + blank.id,
      template: require('../views/blank.ractive.html'),
      data: {
        isSelectCloze: this.isSelectCloze,
        blank: blank
      },
      events: {
        enter: RactiveEventsKeys.enter,
        escape: RactiveEventsKeys.escape,
        anykey: RactiveEventsKeys.anykey
      }
    });
    ractive.on("checkBlank", this.checkBlank);
    ractive.on("showHint", this.showHint);
    ractive.on("textTyped", this.textTyped);
    ractive.on("textChanged", this.onTextChanged);
    ractive.on("closeMessage", this.requestCloseTooltip);
    ractive.on("focus", this.focus);
    ractive.on("displayFeedback", this.displayFeedback);

    this.blankRactives[blank.id] = ractive;
  }

  private createRactiveBindings() {
    for (var highlight of this.cloze.highlights) {
      this.createHighlightBinding(highlight);
    }

    for (var blank of this.cloze.blanks) {
      this.createBlankBinding(blank);
    }
  }

  /**
   * Updates all views of highlights and blanks. Can be called when a model
   * was changed
   */
  private refreshCloze() {
    for (var highlight of this.cloze.highlights) {
      var highlightRactive = this.highlightRactives[highlight.id];
      highlightRactive.set("object", highlight);
    }

    for (var blank of this.cloze.blanks) {
      var blankRactive = this.blankRactives[blank.id];
      blankRactive.set("blank", blank);
    }
  }

  private checkAndNotifyCompleteness = (): boolean => {
    if (this.onScoreChanged)
      this.onScoreChanged(this.currentScore, this.maxScore);

    if (this.cloze.isSolved) {
      if (this.onSolved)
        this.onSolved();
      return true;
    }

    return false;
  }

  public serializeCloze(): string[] {
    return this.cloze.serialize();
  }

  public deserializeCloze(data: any): boolean {
    if (!this.cloze || !data)
      return false;
    this.cloze.deserialize(data);
    this.refreshCloze();
    return true;
  }

  public getCorrectAnswerList(): string[][] {
    if (!this.cloze || this.cloze.blanks.length === 0)
      return [[]];
    let result = [];
    for (var blank of this.cloze.blanks) {
      result.push(blank.getCorrectAnswers());
    }

    return result;
  }
}

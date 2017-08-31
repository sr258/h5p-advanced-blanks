import { MessageService } from '../services/message-service';
import { BlankLoader } from '../content-loaders/blank-loader';
import { ClozeLoader } from '../content-loaders/cloze-loader';
import { Cloze } from "../models/cloze";
import { IDataRepository } from "../services/data-repository";
import { ISettings } from "../services/settings";
import { H5PLocalization, LocalizationLabels } from "../services/localization";
import { ClozeType } from "../models/enums";
import { Highlight } from "../models/highlight";
import { Blank } from "../models/blank";

import * as RactiveEventsKeys from '../../lib/ractive-events-keys';
import * as Ractive from 'ractive';

interface ScoreChanged {
  (score: number, maxScore: number): void;
}

interface Solved {
  (): void;
}

export class ClozeController {
  private jquery: JQuery;

  private cloze: Cloze;
  private checkAllLabel: string;
  private isSelectCloze: boolean;

  public onScoreChanged: ScoreChanged;
  public onSolved: Solved;

  // Storage of the ractive objects that link models and views
  private highlightRactives: { [id: string]: Ractive.Ractive } = {};
  private blankRactives: { [id: string]: Ractive.Ractive } = {};

  public get maxScore(): number {
    return this.cloze.blanks.length;
  }

  public get currentScore(): number {
    var score = this.cloze.blanks.filter(b => b.isCorrect).length - this.cloze.blanks.filter(b => b.isError).length;
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

  constructor(private repository: IDataRepository, private settings: ISettings, private localization: H5PLocalization, private MessageService: MessageService) {
  }

  /**
   * Sets up all blanks, the cloze itself and the ractive bindings.
   * @param  {HTMLElement} root
   */
  initialize(root: HTMLElement, jquery: JQuery) {
    this.jquery = jquery;
    this.isSelectCloze = this.settings.clozeType == ClozeType.Select ? true : false;

    var blanks = this.repository.getBlanks();

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
      if ((!blank.isCorrect) && blank.enteredText != "")
        blank.evaluateAttempt();
    }
    this.refreshCloze();
    this.checkAndNotifyCompleteness();
  }

  textTyped = (blank: Blank) => {
    blank.onTyped();
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
    if ((cause === 'blur')) {
      blank.lostFocus();
    }
    
    if (this.settings.autoCheck) {
      if (!blank.enteredText || blank.enteredText === "")
        return;

      this.cloze.hideAllHighlights();
      blank.evaluateAttempt();
      this.checkAndNotifyCompleteness();
      this.refreshCloze();
    }
    if ((cause === 'enter')
      && ((this.settings.autoCheck && blank.isCorrect && !this.isSolved)
        || !this.settings.autoCheck)) {
      // move to next blank
      var index = this.cloze.blanks.indexOf(blank);
      if (index + 1 >= this.cloze.blanks.length)
        return;
      var nextId = this.cloze.blanks[index + 1].id;
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
    clozeContainerElement.id = 'clozeContainer';
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
    ractive.on("closeMessage", this.requestCloseTooltip);

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
      this.repository.setSolved();
      if (this.onSolved)
        this.onSolved();
      return true;
    }

    return false;
  }

  public serializeCloze() {
    return this.cloze.serialize();
  }

  public deserializeCloze(data: any) {
    if (!this.cloze)
      return;
    this.cloze.deserialize(data);
    this.checkAll();
    this.refreshCloze();
  }
}
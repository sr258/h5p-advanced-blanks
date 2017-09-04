import { MessageService } from '../services/message-service';
import { Highlight } from '../models/highlight';
import { Answer } from '../models/answer';
import { Blank } from '../models/blank';
import { H5PLocalization } from '../services/localization';
import { ISettings } from '../services/settings';
import { Message } from "../models/message";

export class BlankLoader {

  private constructor(private settings: ISettings, private localization: H5PLocalization, private jquery: JQueryStatic, private messageService: MessageService) { }

  private static _instance: BlankLoader;
  public static initialize(settings: ISettings, localization: H5PLocalization, jquery: JQueryStatic, messageService: MessageService): BlankLoader {
    this._instance = new BlankLoader(settings, localization, jquery, messageService);
    return this._instance;
  }

  public static get instance(): BlankLoader {
    if (this._instance)
      return this._instance;

    throw "BlankLoader must be initialized before use.";
  }

  private snippetRegex = new RegExp("-(\\d+)-");

  public createBlank(id: string, correctText: string, hintText: string): Blank {
    var blank = new Blank(this.settings, this.localization, this.jquery, this.messageService, id)
    if (correctText) {
      blank.addCorrectAnswer(new Answer(correctText, "", false, 0, this.settings));
    }
    blank.setHint(new Message(hintText ? hintText : "", false, 0));

    return blank;
  }

  public replaceSnippets(blank: Blank, snippets: string[]) {
    blank.correctAnswers.concat(blank.incorrectAnswers)
      .forEach(answer => answer.message.text = this.getStringWithSnippets(answer.message.text, snippets));
    blank.hint.text = this.getStringWithSnippets(blank.hint.text, snippets);
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
   * Adds the highlight objects to the answers in the correct and incorrect answer list.
   * @param  {Highlight[]} highlightsBefore - All highlights coming before the blank.
   * @param  {Highlight[]} highlightsAfter - All highlights coming after the blank.
   */
  public linkHighlightIdToObject(blank: Blank, highlightsBefore: Highlight[], highlightsAfter: Highlight[]) {
    for (let answer of blank.correctAnswers) {
      answer.linkHighlightIdToObject(highlightsBefore, highlightsAfter);
    }

    for (let answer of blank.incorrectAnswers) {
      answer.linkHighlightIdToObject(highlightsBefore, highlightsAfter);
    }

    blank.hint.linkHighlight(highlightsBefore, highlightsAfter);
  }

}
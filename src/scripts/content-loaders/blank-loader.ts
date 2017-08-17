import { Highlight } from '../models/highlight';
import { Answer } from '../models/answer';
import { Blank } from '../models/blank';
import { H5PLocalization } from '../services/localization';
import { ISettings } from '../services/settings';
import { Message } from "../models/message";

export class BlankLoader {
  private static snippetRegex = new RegExp("-(\\d+)-");

  public static createBlank(settings: ISettings, localization: H5PLocalization, id: string, correctText: string, hintText: string): Blank {
    var blank = new Blank(settings, localization, id)
    if (correctText) {
      blank.addCorrectAnswer(new Answer(correctText, "", settings));
    }
    blank.setHint(new Message(hintText ? hintText : ""));

    return blank;
  }

  public static replaceSnippets(blank: Blank, snippets: string[]) {
    blank.correctAnswers.concat(blank.incorrectAnswers)
      .forEach(answer => answer.message.text = BlankLoader.getStringWithSnippets(answer.message.text, snippets));
    blank.hint.text = this.getStringWithSnippets(blank.hint.text, snippets);
  }

  private static getStringWithSnippets(text: string, snippets: string[]): string {
    var match: RegExpMatchArray;
    while ((match = text.match(BlankLoader.snippetRegex))) {
      var index = parseInt(match[1]) - 1;
      let snippet = "";
      if (index < snippets.length && index >= 0)
        snippet = snippets[index];
      text = text.replace(BlankLoader.snippetRegex, snippet);
    }

    return text;
  }

  /**
   * Adds the highlight objects to the answers in the correct and incorrect answer list.
   * @param  {Highlight[]} highlightsBefore - All highlights coming before the blank.
   * @param  {Highlight[]} highlightsAfter - All highlights coming after the blank.
   */
  public static linkHighlightIdsToObjects(blank: Blank, highlightsBefore: Highlight[], highlightsAfter: Highlight[]) {
    for (var answer of blank.correctAnswers) {
      answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
    }

    for (var answer of blank.incorrectAnswers) {
      answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
    }

    blank.hint.linkHighlights(highlightsBefore, highlightsAfter);
  }

}
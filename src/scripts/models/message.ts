import { Highlight } from "./highlight";

/**
 * Represents a message that the content author has specified to be a reaction
 * to an user's answer. 
 */
export class Message {
  text: string;
  highlightedElements: Highlight[] = new Array();
  private relativeHighlightPositions: number[] = new Array();
  private numberRegEx = /\+?\s?(.*)\s?/i;
  private highlightRegEx = /!!(.{1,40}?)!!/i;

  constructor(text: string) {

    var match;

    while (match = text.match(this.highlightRegEx)) {
      text = text.replace(this.highlightRegEx, "");
      var relativePosition = this.relativePositionStringToNumber(match[1]);
      if (relativePosition !== NaN) {
        this.relativeHighlightPositions.push(relativePosition);
      }
    }
    this.text = text;
  }
  /**
   * Converts expression like "-1" or "+1" to number type.
   * @param  {string} relativePositionString
   * @returns number
   */
  private relativePositionStringToNumber(relativePositionString: string): number {
    relativePositionString = relativePositionString.replace(this.numberRegEx, "$1");
    var relativePosition = parseInt(relativePositionString);
    if (relativePosition === 0)
      return NaN;
    return relativePosition;
  }

  linkHighlights = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]) => {
    this.highlightedElements = new Array();
    for (var relativePosition of this.relativeHighlightPositions) {
      if (relativePosition < 0 && (0 - relativePosition - 1) < highlightsBefore.length) {
        this.highlightedElements.push(highlightsBefore[0 - relativePosition - 1]);
      }
      else if (relativePosition > 0 && (relativePosition - 1 < highlightsAfter.length)) {
        this.highlightedElements.push(highlightsAfter[relativePosition - 1]);
      }
    }
  }
}
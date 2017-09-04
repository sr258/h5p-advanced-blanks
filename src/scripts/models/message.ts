import { Highlight } from "./highlight";

/**
 * Represents a message that the content author has specified to be a reaction
 * to an user's answer. 
 */
export class Message {
  highlightedElement: Highlight;

  constructor(public text: string, showHighlight: boolean, private relativeHighlightPosition: number) {
    if(!showHighlight)
      this.relativeHighlightPosition = undefined;
  }

  linkHighlight = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]) => {
    if (!this.relativeHighlightPosition)
      return;

      if (this.relativeHighlightPosition < 0 && (0 - this.relativeHighlightPosition - 1) < highlightsBefore.length) {
        this.highlightedElement = highlightsBefore[0 - this.relativeHighlightPosition - 1];
      }
      else if (this.relativeHighlightPosition > 0 && (this.relativeHighlightPosition - 1 < highlightsAfter.length)) {
        this.highlightedElement = highlightsAfter[this.relativeHighlightPosition - 1];
      }
  }
}
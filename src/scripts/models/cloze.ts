import { Highlight } from "./highlight";
import { Blank } from "./blank";
import { ClozeElement, ClozeElementType } from "./cloze-element";

/**
 * Represents the cloze. Instantiate with static createCloze().
 */
export class Cloze {
  public html: string;
  public highlights: Highlight[];
  public blanks: Blank[];

  public constructor() { }

  /**
   * Returns true if all blanks were entered correctly. 
   * @returns boolean
   */
  public get isSolved(): boolean {
    return this.blanks.every(b => b.isCorrect === true);
  }


  public hideAllHighlights(): void {
    for (var highlight of this.highlights) {
      highlight.isHighlighted = false;
    }
  }

  public reset() {
    this.hideAllHighlights();
    for (var blank of this.blanks) {
      blank.reset();
    }
  }

  public showSolutions() {
    for (var blank of this.blanks) {
      blank.showSolution();
    }
    this.hideAllHighlights();
  } 
}
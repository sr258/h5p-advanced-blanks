import { Highlight } from "./highlight";
import { Blank } from "./blank";

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

  public serialize() : string[] {
    var cloze = [];
    for (var blank of this.blanks) {
      cloze.push(blank.serialize());
    }

    return cloze;
  }

  public deserialize(data: any) {
    for (var index = 0; index < data.length; index++) {
      if (index >= this.blanks.length)
        return;
      var blank = this.blanks[index];
      blank.deserialize(data[index]);
    }
  }
}
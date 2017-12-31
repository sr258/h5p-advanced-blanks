/**
 * A snippet is a text block that is put into placed marked in feedback texts or hints.
 */
export class Snippet {
  /**
   * Constructs the snippet.
   * @param name The name of the snippet that is used when it is referenced in a feedbacktext (without the snippet marker @)
   * @param text The snippet itself (html)
   */
  constructor(public name: string, public text: string) {
    
  }
}
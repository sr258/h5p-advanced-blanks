/**
 * This class cleans html strings.
 */
export class Unrwapper {
  public constructor(private jquery: JQueryStatic) {

  }

  
  /**
   * Cleans html strings by removing the outmost html tag of the string if there is only one tag.
   * Examples:  "<p>my text</p>"" becomes "my text"
   *            "<p>text 1</p><p>text 2</p2>" stays
   * @param html The html string
   * @returns the cleaned html string
   */
  public unwrap(html: string): string {
    var parsed = this.jquery(html);
    if (parsed.length !== 1) {
      return html;
    }
    let unwrapped = parsed.unwrap().html();
    return unwrapped;
  }
}
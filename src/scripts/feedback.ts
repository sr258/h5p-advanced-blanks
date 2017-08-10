export class Feedback {
  public text: string;
  public isShort: boolean;
  public isVisible: boolean;

  constructor(text: string) {
    this.text = text;
    if (text.length < 50)
      this.isShort = true;
    else
      this.isShort = false;
    this.isVisible = false;
  }
}
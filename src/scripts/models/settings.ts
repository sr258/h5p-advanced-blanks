import { ClozeType } from "./enums";

export class Settings {
  public clozeType: ClozeType;
  public caseSensivitity: boolean;
  public acceptTypos: boolean;

  public static instance = new Settings();
}
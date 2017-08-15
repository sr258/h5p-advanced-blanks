import { ClozeType } from "../models/enums";

export interface ISettings {
  clozeType: ClozeType;

  enableRetry: boolean;
  enableSolutionsButton: boolean;
  autoCheck: boolean;
  caseSensitive: boolean;
  warnSpellingErrors: boolean;
  acceptSpellingErrors: boolean;
  showSolutionsRequiresInput: boolean;
  confirmCheckDialog: boolean;
  confirmRetryDialog: boolean;
}

export class H5PSettings implements ISettings {
  public clozeType: ClozeType;

  public enableRetry: boolean;
  public enableSolutionsButton: boolean;
  public autoCheck: boolean;
  public caseSensitive: boolean;
  public warnSpellingErrors: boolean;
  public acceptSpellingErrors: boolean;
  public showSolutionsRequiresInput: boolean;
  public confirmCheckDialog: boolean;
  public confirmRetryDialog: boolean;

  constructor(h5pConfigData: any) {
   
    if (h5pConfigData.mode === 'selection') {
      this.clozeType = ClozeType.Select;
    }
    else {
      this.clozeType = ClozeType.Type;
    }

    this.enableRetry = h5pConfigData.behaviour.enableRetry;
    this.enableSolutionsButton = h5pConfigData.behaviour.enableSolutionsButton;
    this.autoCheck = h5pConfigData.behaviour.autoCheck;
    this.caseSensitive = h5pConfigData.behaviour.caseSensitive;
    this.warnSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "warn";
    this.acceptSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "accept";
    this.showSolutionsRequiresInput = h5pConfigData.behaviour.showSolutionsRequiresInput;
    this.confirmCheckDialog = h5pConfigData.behaviour.confirmCheckDialog;
    this.confirmRetryDialog = h5pConfigData.behaviour.confirmRetryDialog;
  }
}
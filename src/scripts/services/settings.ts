import { ClozeType, SelectAlternatives } from "../models/enums";

export interface ISettings {
  clozeType: ClozeType;
  selectAlternatives: SelectAlternatives;
  selectAlternativeRestriction: number;
  enableRetry: boolean;
  enableSolutionsButton: boolean;
  autoCheck: boolean;
  caseSensitive: boolean;
  warnSpellingErrors: boolean;
  acceptSpellingErrors: boolean;
  showSolutionsRequiresInput: boolean;
  confirmCheckDialog: boolean;
  confirmRetryDialog: boolean;
  disableImageZooming: boolean;
}

export class H5PSettings implements ISettings {
  public clozeType: ClozeType;
  public selectAlternatives: SelectAlternatives;
  public selectAlternativeRestriction: number;
  public enableRetry: boolean;
  public enableSolutionsButton: boolean;
  public autoCheck: boolean;
  public caseSensitive: boolean;
  public warnSpellingErrors: boolean;
  public acceptSpellingErrors: boolean;
  public showSolutionsRequiresInput: boolean;
  public confirmCheckDialog: boolean;
  public confirmRetryDialog: boolean;
  public disableImageZooming: boolean;

  constructor(h5pConfigData: any) {
   
    if (h5pConfigData.behaviour.mode === 'selection') {
      this.clozeType = ClozeType.Select;
    }
    else {
      this.clozeType = ClozeType.Type;
    }

    if(h5pConfigData.behaviour.selectAlternatives === 'all') {
        this.selectAlternatives = SelectAlternatives.All;
    } else if (h5pConfigData.behaviour.selectAlternatives === 'alternatives') {
        this.selectAlternatives = SelectAlternatives.Alternatives;
    }
    else {
      this.selectAlternatives = SelectAlternatives.All;
    }

    this.selectAlternativeRestriction = h5pConfigData.behaviour.selectAlternativeRestriction;   
    this.enableRetry = h5pConfigData.behaviour.enableRetry;
    this.enableSolutionsButton = h5pConfigData.behaviour.enableSolutionsButton;
    this.autoCheck = h5pConfigData.behaviour.autoCheck;
    this.caseSensitive = h5pConfigData.behaviour.caseSensitive;
    this.warnSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "warn";
    this.acceptSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "accept";
    this.showSolutionsRequiresInput = h5pConfigData.behaviour.showSolutionsRequiresInput;
    this.confirmCheckDialog = h5pConfigData.behaviour.confirmCheckDialog;
    this.confirmRetryDialog = h5pConfigData.behaviour.confirmRetryDialog;
    this.disableImageZooming = h5pConfigData.behaviour.disableImageZooming;
  }
}
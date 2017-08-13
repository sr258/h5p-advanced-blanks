export enum LocalizationLabels {
  checkAllButton,
  typoMessage,
  retryMessage,
  imageName,
  blankName,
  signalName
}

/**
 * Provides localization services. Singleton that 
 */

export class H5PLocalization {
  private constructor(private h5pConfiguration: any) {

  }

  private static instance: H5PLocalization;
  
  /**
   * Creates or gets the singleton instance. The first call must with the h5p configuration object.
   * @param  {any} h5pConfiguration
   */
  public static getInstance(h5pConfiguration?: any) {
    if (!H5PLocalization.instance && h5pConfiguration)
      H5PLocalization.instance = new H5PLocalization(h5pConfiguration);
    return H5PLocalization.instance;
  }

  /**
   * Returns the localized string that is represented by the identifier.
   * @param  {string} localizableStringIdentifier
   * @returns string
   */
  getText(localizableStringIdentifier: string): string {
    return localizableStringIdentifier;
  }

  private labelToString(label: LocalizationLabels) {
    switch (label) {
      case LocalizationLabels.checkAllButton:
        return "Prüfen";
      case LocalizationLabels.typoMessage:
        return "Tippfehler";
      case LocalizationLabels.retryMessage:
        return "Nochmal";
      case LocalizationLabels.imageName:
        return "Bild";
      case LocalizationLabels.blankName:
        return "Lücke";
      case LocalizationLabels.signalName:
        return "Signal";
      default:
        return "";
    }
  }
  /**
   * Returns the localized string for the label.
   * @param  {LocalizationLabels} label
   * @returns string
   */
  getTextFromLabel(label: LocalizationLabels): string {
    return this.labelToString(label);
  }
}
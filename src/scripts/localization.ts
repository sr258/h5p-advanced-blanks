    export enum Labels {
        checkAllButton,
        typoMessage,
        retryMessage,
        imageName,
        gapName,
        signalName
    }

    export class H5PLocalization {
        private constructor(private config: any) {

        }

        static initialize(config: any) {
            H5PLocalization.instance = new H5PLocalization(config);
        }
        static instance: H5PLocalization;
        
        /**
         * @param  {string} name
         * @returns string
         */

        getText(name: string): string {
            return name;
        }

        private labelToString(label: Labels) {
            switch (label) {
                case Labels.checkAllButton:
                    return "Prüfen";
                case Labels.typoMessage:
                    return "Tippfehler";
                case Labels.retryMessage:
                    return "Nochmal";
                case Labels.imageName:
                    return "Bild";
                case Labels.gapName:
                    return "Lücke";
                case Labels.signalName:
                    return "Signal";
                default:
                    return "";
            }
        }

        getTextFromLabel(label: Labels): string {
            return this.labelToString(label);
        }
    }
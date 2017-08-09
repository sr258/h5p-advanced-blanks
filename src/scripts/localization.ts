    export enum Labels {
        checkAllButton,
        typoMessage,
        retryMessage,
        imageName,
        gapName,
        signalName
    }

    export class Localization {
        constructor(private client: any) {

        }

        static initialize(client: any) {
            Localization.instance = new Localization(client);
        }
        static instance: Localization;

        getText(name: string): string {
            return this.client.getTranslation(name);
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
            }
        }

        getTextFromLabel(label: Labels): string {
            var name = this.labelToString(label);
            if (name != "")
                return this.getText(name);
            return "";
        }
    }
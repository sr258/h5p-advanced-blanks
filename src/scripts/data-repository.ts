import { ClozeGap } from "./cloze-gap";
import { MediaElement } from "./media-element";
import { Settings } from "./settings";
import { ClozeType } from "./enums";
import { Answer } from "./answer";
import { Message } from "./message";

export interface IDataRepository {
    getGapRepository(): ClozeGap[];
    setSolved(): any;
    getClozeText(): string;
    getFeedbackText(): string;
    getMediaElements(): MediaElement[];
    getSnippets(): string[];
}

// encapsulates all of AppClient's data access
export class H5PDataRepository implements IDataRepository {
    private settings: Settings;

    constructor(private h5pConfigData: any) {
        this.loadSettings();
    }

    private loadSettings() {
        this.settings = Settings.instance;
        this.settings.caseSensivitity = this.h5pConfigData.caseSensitivity;
        if (this.h5pConfigData.mode == 'selection')
            this.settings.clozeType = ClozeType.Select;
        else
            this.settings.clozeType = ClozeType.Type;

        this.settings.acceptTypos = this.h5pConfigData.typoWarning;
    }

    setSolved() {
        // TODO
    }

    getClozeText(): string {
        return this.h5pConfigData.blanksText;
    }

    getFeedbackText(): string {
        return "";
        // TODO: remove
    }

    getMediaElements(): MediaElement[] {
        var mediaElements: MediaElement[] = new Array();
        return mediaElements;
    }

    getGapRepository(): ClozeGap[] {
        var gapRepository: ClozeGap[] = new Array();
        for (var i = 0; i < this.h5pConfigData.blanksList.length; i++) {
            var rawGap = this.h5pConfigData.blanksList[i];

            var gap = new ClozeGap();
            gap.id = "cloze" + i;
            gap.correctAnswers = new Array();
            gap.incorrectAnswers = new Array();

            var correctText = rawGap.correctAnswerText;
            if (correctText === "" || correctText === undefined)
                continue;
            gap.correctAnswers.push(new Answer(correctText, ""));
            gap.hint = new Message(rawGap.hint);
            gap.hasHint = gap.hint.text != "";

            if (rawGap.incorrectAnswersList) {
                for (var ia of rawGap.incorrectAnswersList) {
                    gap.incorrectAnswers.push(new Answer(ia.incorrectAnswerText, ia.incorrectAnswerFeedback));
                }
            }

            if (gap.correctAnswers.length > 0) {
                if (Settings.instance.clozeType == ClozeType.Select) {
                    gap.loadChoices();
                }

                gap.calculateMinTextLength();
                gapRepository.push(gap);
            }
        }

        return gapRepository;
    }

    getSnippets(): string[] {
        var returnValue: string[] = new Array();
        var snippets = new Array();
        for (var snippet of snippets) {
            if (snippet.value === "")
                continue;
            returnValue.push(snippet.value);
        }
        return returnValue;
    }
}
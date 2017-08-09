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

        constructor(private client: any) {
            this.initialize();
        }

        private initialize() {
            this.settings = Settings.instance;
            this.settings.caseSensivitity = true; // TODO
            this.settings.clozeType = ClozeType.Type; // TODO            
            this.settings.acceptTypos = true; // TODO
        }

        setSolved() {
        }

        getClozeText(): string {
            return "";
        }

        getFeedbackText(): string {
            return "";
        }

        getMediaElements(): MediaElement[] {
            var mediaElements: MediaElement[] = new Array();
            return mediaElements;
        }

        getGapRepository(): ClozeGap[] {
            var gapRepository: ClozeGap[] = new Array();
            for (var i = 1; i <= 50; i++) {
                var gap = new ClozeGap();
                gap.id = "cloze" + i;
                gap.correctAnswers = new Array();
                gap.incorrectAnswers = new Array();

                var correctText = "TODO";
                if (correctText === "" || correctText === undefined)
                    continue;
                gap.correctAnswers.push(new Answer(correctText, ""));
                gap.hint = new Message("TODO");
                gap.hasHint = gap.hint.text != "";

                var incorrectAnswers = new Array(); // TODO
                for (var a = 0; a < incorrectAnswers.length; a += 2) {
                    var text = incorrectAnswers[a + 0].value;
                    var reaction = incorrectAnswers[a + 1].value;

                    if (text === "" && reaction === "")
                        continue;

                    gap.incorrectAnswers.push(new Answer(text, reaction));
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
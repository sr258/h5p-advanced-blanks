import { Cloze } from "./cloze";
import { Feedback } from "./feedback";
import { IDataRepository } from "./data-repository";
import { Settings } from "./settings";
import { H5PLocalization, Labels } from "./localization";
import { ClozeType } from "./enums";
import { ClozeHighlight } from "./cloze-highlight";
import { ClozeGap } from "./cloze-gap";
import * as RactiveEventsKeys from "../libs/ractive-events-keys"

import * as Ractive from 'ractive';

declare var require: {
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};

export class MindTheGapController {
    private cloze: Cloze;
    private feedback: Feedback;
    private checkAllLabel: string;
    private isSelectCloze: boolean;

    // Storage of the ractive objects that link models and views
    private highlightRactives: { [id: string]: Ractive.Ractive } = {};
    private gapRactives: { [id: string]: Ractive.Ractive } = {};
    private staticRactive: Ractive.Ractive;

    constructor(private repository: IDataRepository) {
    }

    initialize(root: HTMLElement) {
        var clozeContainerElement = document.createElement('div');
        clozeContainerElement.classList.add('clozeContainer');
        root.appendChild(clozeContainerElement);

        var staticContainerElement = document.createElement('div');
        staticContainerElement.classList.add('staticContainer');
        root.appendChild(staticContainerElement);

        this.isSelectCloze = Settings.instance.clozeType == ClozeType.Select ? true : false;
        this.checkAllLabel = H5PLocalization.instance.getTextFromLabel(Labels.checkAllButton);
        this.feedback = new Feedback(this.repository.getFeedbackText());
        var gaps = this.repository.getGapRepository();
        var snippets = this.repository.getSnippets();
        gaps.forEach(gap => gap.replaceSnippets(snippets));
        var mediaElements = this.repository.getMediaElements();
        this.cloze = Cloze.clozeFromText(this.repository.getClozeText(), gaps, mediaElements);
        clozeContainerElement.innerHTML = this.cloze.html;
        this.establishBindings();
    }

    private bindHighlight(highlightableObject: ClozeHighlight) {
        this.highlightRactives[highlightableObject.id] = new Ractive({
            el: '#container_' + highlightableObject.id,
            template: require('../templates/highlight.ractive.html'),
            data: {
                object: highlightableObject
            }
        });
    }

    private bindGap(gap: ClozeGap) {
        var ractive = new Ractive({
            el: '#container_' + gap.id,
            template: require('../templates/gap.ractive.html'),
            data: {
                isSelectCloze: this.isSelectCloze,
                gap: gap
            },
            events: {
                enter: RactiveEventsKeys.enter,
                escape: RactiveEventsKeys.escape
            }
        });
        ractive.on("checkCloze", this.onCheckCloze);
        //ractive.on("textTyped", this.onTextTyped);
        ractive.on("showHint", this.onShowHint);
        ractive.on("closeMessage", this.onCloseMessage);

        this.gapRactives[gap.id] = ractive;
    }

    private bindStatic() {
        this.staticRactive = new Ractive({
            el: '#staticContainer',
            template: require('../templates/static.ractive.html'),
            data: {
                feedback: this.feedback,
                checkAllLabel: this.checkAllLabel,
            }
        });
        this.staticRactive.on("checkAll", this.onCheckAll);
        this.staticRactive.on("checkCloze", this.onCheckCloze);
        this.staticRactive.on("closeFeedback", this.onCloseFeedback);
    }

    establishBindings() {
        for (var highlight of this.cloze.highlightableObjects) {
            this.bindHighlight(highlight);
        }

        for (var gap of this.cloze.gaps) {
            this.bindGap(gap);
        }

        this.bindStatic();
    }

    refreshCloze() {
        for (var highlight of this.cloze.highlightableObjects) {
            var highlightRactive = this.highlightRactives[highlight.id];
            highlightRactive.set("object", highlight);
        }

        for (var gap of this.cloze.gaps) {
            var gapRactive = this.gapRactives[gap.id];
            gapRactive.set("gap", gap);
        }
    }

    onCloseFeedback = () => {
        this.feedback.isVisible = false;
        this.staticRactive.set("feedback", this.feedback);
    }

    checkAndNotifyCompleteness = (): boolean => {
        if (this.cloze.checkCompleteness()) {
            this.repository.setSolved();
            this.feedback.isVisible = true;
            this.staticRactive.set("feedback", this.feedback);
            return true;
        }

        return false;
    }

    onCheckAll = (event: Ractive.Event) => {
        for (var highlightObject of this.cloze.highlightableObjects) {
            highlightObject.isHighlighted = false;
        }

        for (var gap of this.cloze.gaps) {
            if ((!gap.isCorrect) && gap.enteredText != "")
                gap.evaluate();
        }
        this.refreshCloze();
        this.checkAndNotifyCompleteness();
    }

    onShowHint = (event: Ractive.Event, gap: ClozeGap) => {
        for (var highlightObject of this.cloze.highlightableObjects) {
            highlightObject.isHighlighted = false;
        }
        gap.showHint();
        this.refreshCloze();
    }

    onCloseMessage = (event: Ractive.Event, gap: ClozeGap) => {
        gap.removeTooltip();
        this.refreshCloze();
        $("#" + gap.id).focus();
    }

    onCheckCloze = (event: Ractive.Event, gap: ClozeGap) => {
        for (var highlightObject of this.cloze.highlightableObjects) {
            highlightObject.isHighlighted = false;
        }
        gap.evaluate();
        this.refreshCloze();

        if (!this.checkAndNotifyCompleteness()) {
            if (gap.isCorrect) {
                var index = this.cloze.gaps.indexOf(gap);
                if (index + 1 >= this.cloze.gaps.length)
                    return;
                var nextId = this.cloze.gaps[index + 1].id;
                $("#" + nextId).focus();
            }
        }
    }
}
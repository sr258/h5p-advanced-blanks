import { ClozeElement, ClozeElementType } from './cloze-element';
import { Answer } from './answer';
import { Message } from './message';
import { ClozeHighlight } from './cloze-highlight';
import { Evaluation, MessageType } from './enums';
import { H5PLocalization, Labels } from './localization';

export class ClozeGap extends ClozeElement {
    // Content
    correctAnswers: Answer[];
    incorrectAnswers: Answer[];
    hint: Message;
    id: string;
    choices: string[];
    hasHint: boolean;

    // viewmodel stuff
    enteredText: string;
    isCorrect: boolean;
    isError: boolean;
    isRetry: boolean;
    message: string;
    showMessage: boolean;
    minTextLength: number;

    regex = new RegExp("-(\\d+)-");


    constructor() {
        super();
        this.enteredText = "";
        this.correctAnswers = new Array();
        this.incorrectAnswers = new Array();
        this.choices = new Array();
        this.showMessage = false;
        this.type = ClozeElementType.Gap;
    }

    public calculateMinTextLength() {
        var answers: string[] = new Array();
        for (var cAnswer of this.correctAnswers) {
            answers.push(this.getLongestString(cAnswer.alternatives));
        }
        var longestAnswer = this.getLongestString(answers);
        var l = longestAnswer.length;
        this.minTextLength = Math.max(10, l - (l % 10) + 10);
    }

    private getLongestString(strings: string[]): string {
        return strings.reduce((prev, current) => current.length > prev.length ? current : prev, "");
    }

    public getContentClone(): ClozeGap {
        var newGap = new ClozeGap();
        newGap.correctAnswers = this.correctAnswers;
        newGap.incorrectAnswers = this.incorrectAnswers;
        newGap.hint = this.hint;
        newGap.hasHint = this.hasHint;
        newGap.id = this.id;
        newGap.minTextLength = this.minTextLength;
        for (var choice of this.choices)
            newGap.choices.push(choice);

        return newGap;
    }

    public replaceSnippets(snippets: string[]) {
        this.correctAnswers.concat(this.incorrectAnswers)
            .forEach(answer => answer.message.text = this.getStringWithSnippets(answer.message.text, snippets));
        this.hint.text = this.getStringWithSnippets(this.hint.text, snippets);
    }

    private getStringWithSnippets(text: string, snippets: string[]): string {
        var match: RegExpMatchArray;
        while ((match = text.match(this.regex))) {
            var index = parseInt(match[1]) - 1;
            let snippet = "";
            if (index < snippets.length && index >= 0)
                snippet = snippets[index];
            text = text.replace(this.regex, snippet);
        }

        return text;
    }

    private shuffleArray(array: any[]) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    public loadChoices(): string[] {
        this.choices = new Array();
        for (var answer of this.correctAnswers) {
            for (var alternative of answer.alternatives) {
                this.choices.push(alternative);
            }
        }

        for (var answer of this.incorrectAnswers) {
            for (var alternative of answer.alternatives) {
                this.choices.push(alternative);
            }
        }

        this.choices = this.shuffleArray(this.choices);
        this.choices.unshift("");

        return this.choices;
    }

    linkHighlightIdsToObjects = (highlightsBefore: ClozeHighlight[], highlightsAfter: ClozeHighlight[]) => {
        for (var answer of this.correctAnswers) {
            answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
        }

        for (var answer of this.incorrectAnswers) {
            answer.linkHighlightIdsToObjects(highlightsBefore, highlightsAfter);
        }

        this.hint.linkHighlights(highlightsBefore, highlightsAfter);
    }

    private displayTooltip(message: string, type: MessageType) {
        this.showMessage = true;
        this.message = message;
    }

    public removeTooltip() {
        this.showMessage = false;
    }

    private setErrorTooltipText(text: string) {
        this.displayTooltip(text, MessageType.Error);
    }

    public evaluate() {
        this.removeTooltip();

        var cleanedEnteredText = this.enteredText.trim();
        cleanedEnteredText = cleanedEnteredText.replace(/\s{2,}/, " ");

        var exactCorrectMatches = this.correctAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.ExactMatch);
        var closeCorrectMatches = this.correctAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.CloseMatch);
        var exactIncorrectMatches = this.incorrectAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.ExactMatch);
        var closeIncorrectMatches = this.incorrectAnswers.filter(answer => answer.evaluateEnteredText(cleanedEnteredText) === Evaluation.CloseMatch);

        if (exactCorrectMatches.length > 0) {
            this.setAnswerState(MessageType.Correct);
            return;
        }

        if (exactIncorrectMatches.length > 0) {
            this.setAnswerState(MessageType.Error);
            this.showErrorTooltip(exactIncorrectMatches[0]);
            return;
        }

        if (closeCorrectMatches.length > 0) {
            this.displayTooltip(H5PLocalization.instance.getTextFromLabel(Labels.typoMessage), MessageType.Retry);
            this.setAnswerState(MessageType.Retry);
            return;
        }

        if (closeIncorrectMatches.length > 0) {
            this.setAnswerState(MessageType.Error);
            this.showErrorTooltip(closeIncorrectMatches[0]);
            return;
        }

        var alwaysApplyingAnswers = this.incorrectAnswers.filter(a => a.appliesAlways);
        if (alwaysApplyingAnswers && alwaysApplyingAnswers.length > 0) {
            this.showErrorTooltip(alwaysApplyingAnswers[0]);
        }

        this.setAnswerState(MessageType.Error);
    }

    private setAnswerState(type: MessageType) {
        this.isCorrect = false;
        this.isError = false;
        this.isRetry = false;

        switch (type) {
            case MessageType.Correct:
                this.isCorrect = true;
                break;
            case MessageType.Error:
                this.isError = true;
                break;
            case MessageType.Retry:
                this.isRetry = true;
                break;
        }
    }

    private showErrorTooltip(answer: Answer) {
        if (answer.message && answer.message.text) {
            this.setErrorTooltipText(answer.message.text);
        }
        answer.activateHighlights();
    }

    public showHint() {
        this.removeTooltip();
        if (this.hint && this.hint.text != "") {
            this.displayTooltip(this.hint.text, MessageType.Retry);
            if (this.hint.highlightedElements)
                this.hint.highlightedElements.forEach((highlight) => highlight.isHighlighted = true);
            this.isRetry = true;
        }
    }
}
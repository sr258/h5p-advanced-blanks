import { Highlight } from "./highlight";

export class Message {
	text: string;
	highlightedElements: Highlight[];
	private relativeHighlightPositions: number[];

	constructor(text: string) {
		this.relativeHighlightPositions = new Array();
		var workingText = text;
		var regExp = new RegExp("!!(.{1,40}?)!!", "i");
		var numberRegEx = new RegExp("\\+?\\s?(.*)\\s?", "i");
		var match;

		while ((match = workingText.match(regExp))) {
			workingText = workingText.replace(regExp, "");
			var relativePositionString = match[1];
			relativePositionString = relativePositionString.replace(numberRegEx, "$1");
			var relativePosition = parseInt(relativePositionString);
			if (relativePosition !== NaN && relativePosition !== 0)
				this.relativeHighlightPositions.push(relativePosition);
		}
		this.text = workingText;
	}

	linkHighlights = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]) => {
		this.highlightedElements = new Array();
		for (var relativePosition of this.relativeHighlightPositions) {
			if (relativePosition < 0 && (0 - relativePosition - 1) < highlightsBefore.length) {
				this.highlightedElements.push(highlightsBefore[0 - relativePosition - 1]);
			}
			else if (relativePosition > 0 && (relativePosition - 1 < highlightsAfter.length)) {
				this.highlightedElements.push(highlightsAfter[relativePosition - 1]);
			}
		}
	}
}
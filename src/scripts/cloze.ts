import { ClozeHighlight } from "./cloze-highlight";
import { ClozeGap } from "./cloze-gap";
import { MediaElement, MediaType } from "./media-element";
import { ClozeElement, ClozeElementType } from "./cloze-element";
import { H5PLocalization, Labels } from "./localization";

export class Cloze {
	public html: string;
	public highlightableObjects: ClozeHighlight[];
	public gaps: ClozeGap[];

	public checkCompleteness = (): boolean => {
		for (var cloze of this.gaps) {
			if (cloze.isCorrect == undefined || cloze.isCorrect == false)
				return false;
		}

		return true;
	}

	public static clozeFromText(text: string, gaps: ClozeGap[], media: MediaElement[]): Cloze {

		var elementsList: ClozeElement[] = new Array();
		var highlightObjects: ClozeHighlight[] = new Array();
		var gapsInstances: ClozeGap[] = new Array();

		// convert gap markings
		var underlineGapRegEx = new RegExp("_{3,}");
		while (text.match(underlineGapRegEx)) {
			text = text.replace(underlineGapRegEx, "ANONGAPMARKER");
		}

		var html = text;

		// convert !!signal!! highlight markup and _____  gap markup into <span>
		var exclamationMarkRegExp = new RegExp("!!(.{1,40}?)!!", "i");
		var highlightCounter = 0;
		let gapCounter = 0;

		while (true) {
			var highlightMatch = html.match(exclamationMarkRegExp);
			var gapIndex = html.indexOf("ANONGAPMARKER");

			if (!highlightMatch && (gapIndex < 0))
				break;

			if ((highlightMatch && highlightMatch.index < gapIndex) || (gapIndex < 0)) {
				var highlight = new ClozeHighlight(highlightMatch[1], `highlight_${highlightCounter}`);
				highlightObjects.push(highlight);
				elementsList.push(highlight);
				html = html.replace(exclamationMarkRegExp, `<span id='container_highlight_${highlightCounter}'></span>`);
				highlightCounter++;
			} else {
				if (gapCounter >= gaps.length) {
					html = html.replace("ANONGAPMARKER", "<span></span>");
					continue;
				}
				var gapInstance = gaps[gapCounter].getContentClone();
				gapInstance.id = "gap_" + gapCounter;
				gapsInstances.push(gapInstance);
				elementsList.push(gapInstance);
				html = html.replace("ANONGAPMARKER", `<span id='container_${gapInstance.id}'></span>`);
				gapCounter++;
			}
		}

		// link highlight ids to objects
		for (var gap of gapsInstances) {
			var gapIndex = elementsList.indexOf(gap);
			var before = elementsList
				.slice(0, gapIndex)
				.filter(e => e.type === ClozeElementType.Highlight)
				.map(e => e as ClozeHighlight)
				.reverse();
			var after = elementsList
				.slice(gapIndex + 1)
				.filter(e => e.type === ClozeElementType.Highlight)
				.map(e => e as ClozeHighlight);
			gap.linkHighlightIdsToObjects(before, after);
		}

		var cloze = new Cloze();
		cloze.html = html;
		cloze.gaps = gapsInstances;
		cloze.highlightableObjects = highlightObjects;

		return cloze;
	}
}
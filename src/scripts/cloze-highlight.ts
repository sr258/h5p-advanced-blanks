import { ClozeElement, ClozeElementType } from './cloze-element';

export class Highlight extends ClozeElement {
	text: string;
	isHighlighted: boolean;
	id: string;

	constructor(text: string, id: string) {
		super();
		this.type = ClozeElementType.Highlight;
		this.text = text;
		this.id = id;
		this.isHighlighted = false;
	}
}
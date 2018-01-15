import { eScriptType } from 'common/enums';

export default class ScriptFile {
	buffer: Buffer;
	type: eScriptType;

	constructor(buffer: Buffer) {
		this.buffer = buffer;
		this.type = eScriptType.HEADLESS;
	}

	get baseOffset(): number {
		return 0;
	}

}

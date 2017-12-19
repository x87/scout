import { eCompiledFileType } from '../common/enums';

export class CScriptFile {

	mainData: Buffer;
	type: eCompiledFileType;

	init(data: Buffer) {
		this.mainData = data.slice(this.baseOffset);
		this.type = eCompiledFileType.EXTERNAL;
	}

	get baseOffset(): number {
		return 0;
	}

}

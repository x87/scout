import { eCompiledFileType } from '../common/enums';
import { CScriptFile } from './ScriptFile';
import { CScriptFileHeader } from './CScriptFileHeader';

export class CScriptFileSCM extends CScriptFile {
	readonly missionsData: Buffer[];
	readonly externalData: Buffer[];
	header: CScriptFileHeader;

	constructor(data: Buffer) {
		super();
		this.header = new CScriptFileHeader(data);
		this.missionsData = [];
		this.externalData = [];
	}

	init(data: Buffer) {
		this.mainData = data.slice(this.baseOffset, this.header.mainSize);
		this.type = eCompiledFileType.MAIN;
		for (let i = 0, len = this.header.missions.length; i < len; i += 1) {
			const nextMissionOffset = i === len - 1 ? data.length : this.header.missions[i + 1];
			this.missionsData[this.missionsData.length] = data.slice(this.header.missions[i], nextMissionOffset);
		}
		// todo; read external data
	}

	get baseOffset(): number {
		return this.header.size;
	}
}

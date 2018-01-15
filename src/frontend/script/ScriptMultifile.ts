import { eScriptType } from 'common/enums';
import ScriptFile from './ScriptFile';
import MultifileMeta from './MultifileMeta';

export default class ScriptMultifile extends ScriptFile {
	readonly missions: Buffer[];
	readonly externals: Buffer[];
	meta: MultifileMeta;

	constructor(data: Buffer) {
		super(data);

		this.meta = new MultifileMeta(data);
		this.missions = [];
		this.externals = [];

		this.type = eScriptType.MULTIFILE;
		this.buffer = data.slice(this.baseOffset, this.meta.mainSize);

		for (let i = 0, len = this.meta.missions.length; i < len; i += 1) {
			const nextMissionOffset = i === len - 1
				? data.length
				: this.meta.missions[i + 1];
			this.missions.push(data.slice(this.meta.missions[i], nextMissionOffset));
		}

	}

	get baseOffset(): number {
		return this.meta.size;
	}
}

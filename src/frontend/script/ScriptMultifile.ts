import { eScriptType } from 'common/enums';
import ScriptFile from './ScriptFile';
import MultifileMeta from './MultifileMeta';

export default class ScriptMultifile extends ScriptFile {
  readonly scripts: ScriptFile[];
  meta: MultifileMeta;

  constructor(data: Buffer) {
    super(data);

    this.meta = new MultifileMeta(data);

    this.type = eScriptType.MULTIFILE;
    this.buffer = data.slice(this.baseOffset, this.meta.mainSize);
    const len = this.meta.missions.length;

    const missions = this.meta.missions.map((offset, i, arr) => {
      const nextMissionOffset = i === len - 1 ? data.length : arr[i + 1];
      return new ScriptFile(
        data.slice(this.meta.missions[i], nextMissionOffset)
      );
    });
    // todo: externals
    this.scripts = missions;
  }

  get baseOffset(): number {
    return this.meta.size;
  }
}

import { eScriptType } from 'common/enums';
import { ScriptFile } from './ScriptFile';
import { MultifileMeta } from './MultifileMeta';

export class ScriptMultifile extends ScriptFile {
  readonly scripts: ScriptFile[];
  meta: MultifileMeta;

  constructor(data: DataView) {
    super(data, eScriptType.MAIN);

    this.meta = new MultifileMeta(data);
    this.buffer = new DataView(
      data.buffer.slice(this.baseOffset, this.meta.mainSize)
    );

    const len = this.meta.missions.length;

    const missions = this.meta.missions.map((offset, i, arr) => {
      const nextMissionOffset = i === len - 1 ? data.byteLength : arr[i + 1];
      return new ScriptFile(
        new DataView(data.buffer.slice(offset, nextMissionOffset)),
        eScriptType.MISSION
      );
    });
    // todo: externals
    this.scripts = missions;
  }

  get baseOffset(): number {
    return this.meta.size;
  }
}

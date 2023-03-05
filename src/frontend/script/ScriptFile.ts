import { eScriptType } from 'common/enums';

export default class ScriptFile {
  constructor(public buffer: Buffer, public type: eScriptType) {}

  get baseOffset(): number {
    return 0;
  }
}

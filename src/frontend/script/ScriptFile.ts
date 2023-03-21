import { eScriptType } from 'common/enums';

export default class ScriptFile {
  public name: string;
  constructor(public buffer: Buffer, public type: eScriptType) {}

  get baseOffset(): number {
    return 0;
  }
}

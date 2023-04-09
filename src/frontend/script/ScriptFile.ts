import { eScriptType } from 'common/enums';

export class ScriptFile {
  public name: string;
  constructor(public buffer: DataView, public type: eScriptType) {}

  get baseOffset(): number {
    return 0;
  }
}

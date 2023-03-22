import Log from 'utils/log';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import AppError from 'common/errors';
import { eScriptType } from 'common/enums';

export default class Loader {
  async loadScript(stream: Promise<DataView>): Promise<ScriptFile> {
    try {
      const buffer = await stream;
      return this.isHeaderPresent(buffer)
        ? new ScriptMultifile(buffer)
        : new ScriptFile(buffer, eScriptType.CLEO);
    } catch (e){
      console.log(e);
      throw Log.error(AppError.INVALID_INPUT_FILE);
    }
  }

  private isHeaderPresent(buf: DataView): boolean {
    // todo: count jumps
    const firstOp = buf.getInt16(0, true);
    return firstOp === 2;
  }
}

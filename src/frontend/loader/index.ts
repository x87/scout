import Log from 'utils/log';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import AppError from 'common/errors';
import { eScriptType } from 'common/enums';

export default class Loader {
  async loadScript(stream: Promise<Buffer>): Promise<ScriptFile> {
    try {
      const buffer = await stream;
      if (Buffer.isBuffer(buffer)) {
        return this.isHeaderPresent(buffer)
          ? new ScriptMultifile(buffer)
          : new ScriptFile(buffer, eScriptType.CLEO);
      }
    } catch {
      throw Log.error(AppError.INVALID_INPUT_FILE);
    }
  }

  private isHeaderPresent(buf: Buffer): boolean {
    // todo: count jumps
    const firstOp = buf.readInt16LE(0);
    return firstOp === 2;
  }
}

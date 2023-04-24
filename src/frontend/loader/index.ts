import { Log } from 'utils/log';
import { ScriptFile } from 'frontend/script/ScriptFile';
import { ScriptMultifile } from 'frontend/script/ScriptMultifile';
import { AppError } from 'common/errors';
import { eScriptType } from 'common/enums';

export class Loader {
  async loadScript(stream: Promise<DataView>): Promise<ScriptFile> {
    try {
      let buffer = await stream;
      if (this.hasCustomFooter(buffer)) {
        // SB's Extra info is not supported yet
        const offset = buffer.getUint32(buffer.byteLength - 12, true);
        buffer = new DataView(buffer.buffer.slice(0, offset));
      }
      return this.hasHeader(buffer)
        ? new ScriptMultifile(buffer)
        : new ScriptFile(buffer, eScriptType.CLEO);
    } catch (e) {
      console.log(e);
      throw Log.error(AppError.INVALID_INPUT_FILE);
    }
  }

  private hasHeader(buf: DataView): boolean {
    // todo: count jumps
    const firstOp = buf.getInt16(0, true);
    return firstOp === 2;
  }

  private hasCustomFooter(buf: DataView): boolean {
    // https://github.com/sannybuilder/dev/wiki/Extra-Info-Format
    const magic = '__SBFTR\0';
    try {
      const initialOffset = buf.byteLength - magic.length;
      for (let i = 0; i < magic.length; i++) {
        const char = buf.getUint8(initialOffset + i);
        if (char !== magic.charCodeAt(i)) return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

import * as file from '../utils/file';
import Log from '../utils/Log';
import { CScriptFile } from '../frontend/ScriptFile';
import { CScriptFileSCM } from '../frontend/CScriptFileSCM';
import AppError from '../common/errors';

const HEADER_EXTENSION_MAP: any = {
	'.scm': true,
	'.cs': false
};

export class Loader {
	loadScript(fileName: string): Promise<CScriptFile> {

		if (!this.isScriptFileValidExtension(fileName)) {
			throw Log.error(AppError.ERRIEXT, file.getFileExtension(fileName));
		}
		return file.isReadable(fileName)
			.then(() => file.load(fileName))
			.then(buffer => {
				if (Buffer.isBuffer(buffer)) {
					let scriptFile: CScriptFile;

					if (this.isScriptFileWithHeader(fileName)) {
						scriptFile = new CScriptFileSCM(buffer);
					} else {
						scriptFile = new CScriptFile();
					}
					scriptFile.init(buffer);
					return scriptFile;
				}
				throw Log.error(AppError.ERRTYPE, 'Buffer');
			})
			.catch(e => {
				console.error(e);
				throw e;
			});
	}

	isScriptFileWithHeader(fileName: string): boolean {
		const extension = file.getFileExtension(fileName);
		return !!HEADER_EXTENSION_MAP[extension];
	}

	isScriptFileValidExtension(fileName: string): boolean {
		const extension = file.getFileExtension(fileName);
		return (HEADER_EXTENSION_MAP.hasOwnProperty(extension));
	}
}

import * as file from 'utils/file';
import Log from 'utils/log';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import AppError from 'common/errors';

const HEADER_EXTENSION_MAP: any = {
	'.scm': true,
	'.cs': false
};

export default class Loader {
	async loadScript(fileName: string): Promise<ScriptFile> {
		if (!this.isFileTypeSupported(fileName)) {
			throw Log.error(AppError.UNKNOWN_FILE_EXTENSION, file.getFileExtension(fileName));
		}
		try {
			const buffer = await file.load(fileName);
			if (Buffer.isBuffer(buffer)) {
				return this.isHeaderPresent(fileName)
					? new ScriptMultifile(buffer)
					: new ScriptFile(buffer);
			}
		} catch {
			throw Log.error(AppError.INVALID_TYPE, 'Buffer');
		}
	}

	private isHeaderPresent(fileName: string): boolean {
		const extension = file.getFileExtension(fileName);
		return !!HEADER_EXTENSION_MAP[extension];
	}

	private isFileTypeSupported(fileName: string): boolean {
		const extension = file.getFileExtension(fileName);
		return HEADER_EXTENSION_MAP.hasOwnProperty(extension);
	}
}

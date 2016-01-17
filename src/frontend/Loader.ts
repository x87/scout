module cleojs.disasm {

    const HEADER_EXTENSION_MAP: Object = {
        '.scm': true,
        '.cs':  false
    };

    export class CLoader {
        /**
         *
         * @param fileName
         * @returns {Promise<T>}
         */
        public loadScript(fileName: string): Promise<ScriptFile> {

            if (!this.isScriptFileValidExtension(fileName)) {
                throw Log.error("ERRIEXT", fsHelpers.getFileExtension(fileName));
            }
            return fsHelpers.isReadable(fileName)
                .then(function () {
                    return fsHelpers.load(fileName);
                })
                .then(buffer => {
                    if (Buffer.isBuffer(buffer)) {
                        let scriptFile = new ScriptFile();

                        let opcodesOffset = 0;
                        if (scriptFile.hasHeader = this.isScriptFileWithHeader(fileName)) {
                            scriptFile.header = new CScriptFileHeader(buffer);
                            opcodesOffset = scriptFile.header.getSize();
                        }
                        scriptFile.opcodes = buffer.slice(opcodesOffset);
                        return scriptFile;
                    } else {
                        throw Log.error("ERRTYPE", "Buffer");
                    }
                })
                .catch(e => {
                    console.error(e)
                })
        }

        private isScriptFileWithHeader(fileName: string): boolean {
            let extension = fsHelpers.getFileExtension(fileName);
            return HEADER_EXTENSION_MAP[extension];
        }

        private isScriptFileValidExtension(fileName: string): boolean {
            let extension = fsHelpers.getFileExtension(fileName);
            return (HEADER_EXTENSION_MAP.hasOwnProperty(extension))
        }
    }
}

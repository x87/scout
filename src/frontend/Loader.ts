module scout.frontend {

    const HEADER_EXTENSION_MAP: Object = {
        '.scm': true,
        '.cs':  false
    };

    export class Loader {
        /**
         *
         * @param fileName
         * @returns {Promise<T>}
         */
        public loadScript(fileName: string): Promise<CScriptFile> {

            if (!this.isScriptFileValidExtension(fileName)) {
                throw Log.error("ERRIEXT", fsHelpers.getFileExtension(fileName));
            }
            return fsHelpers.isReadable(fileName)
                .then(function () {
                    return fsHelpers.load(fileName);
                })
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
                    } else {
                        throw Log.error("ERRTYPE", "Buffer");
                    }
                })
                .catch(e => {
                    console.error(e)
                })
        }

        /**
         *
         * @param fileName
         * @returns {boolean}
         */
        public isScriptFileWithHeader(fileName: string): boolean {
            let extension = fsHelpers.getFileExtension(fileName);
            return !!HEADER_EXTENSION_MAP[extension];
        }

        /**
         *
         * @param fileName
         * @returns {boolean}
         */
        public isScriptFileValidExtension(fileName: string): boolean {
            let extension = fsHelpers.getFileExtension(fileName);
            return (HEADER_EXTENSION_MAP.hasOwnProperty(extension))
        }
    }
}

module cleojs.disasm {
    export class CLoader {
        /**
         *
         * @param fileName
         * @returns {Promise<T>}
         */
        public loadScript(fileName: string): Promise<ScriptFile> {

            return fsHelpers.isReadable(fileName)
                .then(function () {
                    return fsHelpers.load(fileName);
                })
                .then(buffer => {
                    if (Buffer.isBuffer(buffer)) {
                        let scriptFile = new ScriptFile();
                        scriptFile.opcodes = buffer.slice(0);
                        return scriptFile;
                    } else {
                        throw logger.error("ERRTYPE", "Buffer");
                    }
                })
                .catch(e => {
                    console.error(e)
                })
        }
    }
}

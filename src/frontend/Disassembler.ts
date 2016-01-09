module cleojs.disasm {

    export class CDisassembler {
        private _opcodeParser: COpcodeParser

        /**
         *
         * @param opcodes
         */
        constructor() {
            this._opcodeParser = new COpcodeParser();
        }

        /**
         *
         * @returns {Promise<TResult>|Promise<T>}
         */
        public loadOpcodeData() {
            return fsHelpers.isReadable(Paths.opcodesFile)
                .then(() => {
                    this.opcodeParser.opcodesData = require(Paths.opcodesFile);
                })
                .catch(() => {
                    throw logger.error("ERRNOOP", Paths.opcodesFile)
                })
        }


        public disassemble(opcodes: Buffer) {
            this.opcodeParser.data = opcodes;
            for (let opcode of this.opcodeParser) {
                console.log(opcode);
            }
        }

        get opcodeParser(): COpcodeParser {
            return this._opcodeParser;
        }

    }
}

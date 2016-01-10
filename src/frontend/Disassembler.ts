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
                    throw Log.error("ERRNOOP", Paths.opcodesFile)
                })
        }


        public disassemble(opcodes: Buffer) {
            this.opcodeParser.data = opcodes;
            for (let opcode of this.opcodeParser) {
                let id = opcode.id;
                let info = this.opcodeParser.opcodesData[id & 0x7FFF];
                let output = '';
                if (id > 0x7FFF) {
                    output = 'NOT ';
                }
                output += info.name;
                for (let i = 0; i < opcode.params.length; i += 1) {
                    output += ' ' + opcode.params[i].value;
                }
                console.log(output);
            }
        }

        get opcodeParser(): COpcodeParser {
            return this._opcodeParser;
        }

    }
}

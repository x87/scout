module cleojs.disasm {

    export class CDisassembler {
        private _opcodeParser: COpcodeParser

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
            let map = this.opcodeParser.parse(opcodes);
            if (Arguments.printAssembly === true) {
                for (let [offset, opcode] of map) {
                    this.printOpcode(opcode);
                }
            }
        }

        private printOpcode(opcode: IOpcode) {
            let id = opcode.id;
            let info = this.opcodeParser.opcodesData[id & 0x7FFF];
            let output = `${opcode.offset}: `;
            if (id > 0x7FFF) {
                output += 'NOT ';
            }
            output += info.name;
            for (let param of opcode.params) {
                if (helpers.isArray(param.type)) {
                    let a = <IOpcodeParamArray>param.value;
                    output += ` (${a.varIndex} ${a.offset} ${a.size} ${a.props})`;
                } else {
                    output += ' ' + param.value;
                }
            }
            console.log(output);
        }

        get opcodeParser(): COpcodeParser {
            return this._opcodeParser;
        }

    }
}

module cleojs.disasm {

    export class CDisassembler {
        private _opcodeParser: OpcodeParser

        constructor() {
            this._opcodeParser = new OpcodeParser();
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

        public disassemble(scriptFile: ScriptFile) {
            if (Arguments.printAssembly === true) {
                console.log(`//-------------MAIN---------------`);
            }
            this.parseBuffer(scriptFile.mainData, scriptFile.baseOffset);

            if (scriptFile instanceof ScriptFileSCM) {
                for (let i = 0, len = scriptFile.missionsData.length; i < len; i += 1) {
                    if (Arguments.printAssembly === true) {
                        console.log(`\n//-------------Mission ${i}---------------`);
                    }
                    this.parseBuffer(scriptFile.missionsData[i], scriptFile.header.missions[i]);
                }
            }

        }

        private parseBuffer(data: Buffer, base: number) {
            let map = this.opcodeParser.parse(data, base);
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

        get opcodeParser(): OpcodeParser {
            return this._opcodeParser;
        }

    }
}

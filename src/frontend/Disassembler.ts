module scout.disasm {

    export class CDisassembler {
        private _opcodeParser: COpcodeParser;
        private _opcodesData: IOpcodeData[];

        constructor () {
            this._opcodeParser = new COpcodeParser();
        }

        public disassemble(scriptFile: CScriptFile) {
            let map = new Map();

            this.parseBuffer(map, scriptFile.mainData, scriptFile.baseOffset);

            if (scriptFile instanceof CScriptFileSCM) {
                for (let i = 0, len = scriptFile.missionsData.length; i < len; i += 1) {
                    this.parseBuffer(map, scriptFile.missionsData[i], scriptFile.header.missions[i]);
                }
            }

            return map;
        }

        private parseBuffer(map: Map<number, IOpcode>, data: Buffer, base: number) {
            this.opcodeParser.data = data;
            this.opcodeParser.offset = 0;

            for (let opcode of this.opcodeParser) {
                opcode.offset += base;
                map.set(opcode.offset, opcode);
            }
        }

        /**
         *
         * @returns {Promise<TResult>|Promise<T>}
         */
        public loadOpcodeData() {
            return fsHelpers.isReadable(Paths.opcodesFile)
                .then(() => this.opcodesData = require(Paths.opcodesFile))
                .then(
                    opcodesData => this._opcodeParser.opcodesData = opcodesData
                )
                .catch(() => {
                    throw Log.error("ERRNOOP", Paths.opcodesFile)
                })
        }

        get opcodeParser(): COpcodeParser {
            return this._opcodeParser;
        }

        get opcodesData(): IOpcodeData[] {
            return this._opcodesData;
        }

        set opcodesData(value: IOpcodeData[]) {
            this._opcodesData = value;
        }


    }
}

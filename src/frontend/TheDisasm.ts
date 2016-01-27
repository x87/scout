module scout.frontend {
    export class TheDisasm {

        public _loader: CLoader;
        public _disassembler: CDisassembler;
        private _cfg: CCFG;

        constructor() {
            this.loader = new CLoader();
            this.disassembler = new CDisassembler();
            this.cfg = new CCFG();
        }

        set loader(value: CLoader) {
            this._loader = value;
        }

        get loader(): CLoader {
            return this._loader;
        }

        get disassembler(): CDisassembler {
            return this._disassembler;
        }

        set disassembler(value: CDisassembler) {
            this._disassembler = value;
        }

        get cfg(): CCFG {
            return this._cfg;
        }

        set cfg(value: CCFG) {
            this._cfg = value;
        }


        public printOpcode(opcode: IOpcode) {
            let id = opcode.id;
            let info = this.disassembler.opcodesData[id & 0x7FFF];
            let output = `${opcode.offset}: `;

            if (opcode.isLeader) {
                output = "\n\n" + output;
            }
            if (id > 0x7FFF) {
                output += 'NOT ';
            }
            output += info.name;
            for (let param of opcode.params) {
                if (helpers.isArrayParam(param.type)) {
                    let a = <IOpcodeParamArray>param.value;
                    output += ` (${a.varIndex} ${a.offset} ${a.size} ${a.props})`;
                } else {
                    output += ' ' + param.value;
                }
            }
            console.log(output);
        }

    }
}

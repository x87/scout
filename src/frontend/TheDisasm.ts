module cleojs.disasm {
    export class TheDisasm {
        private _loader: CLoader;
        private _disassembler: CDisassembler;

        constructor() {
            this.loader = new CLoader();
            this.disassembler = new Disassembler();
        }

        set loader(value: cleojs.disasm.CLoader) {
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

    }
}

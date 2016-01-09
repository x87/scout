module cleojs.disasm {
    export class CScriptFile {
        private _opcodes: Buffer;

        set opcodes(value: Buffer) {
            this._opcodes = value;
        }


        get opcodes(): Buffer {
            return this._opcodes;
        }

    }
}

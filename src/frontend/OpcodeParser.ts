module cleojs.disasm {

    export class COpcode implements IOpcode {
        public id: number;
        public params: IOpcodeParam[];
    }

    export class COpcodeParser {
        private _data: Buffer;
        private _offset: number = 0;
        private _opcodesData: IOpcodeData[];

        get data(): Buffer {
            return this._data;
        }

        set data(value: Buffer) {
            this._data = value;
        }

        get offset(): number {
            return this._offset;
        }

        set offset(value: number) {
            this._offset = value;
        }

        set opcodesData(value: IOpcodeData[]) {
            this._opcodesData = value;
        }

        get opcodesData(): IOpcodeData[] {
            return this._opcodesData;
        }

        private nextUInt8(): number {
            let result;
            try {
                result = this.data.readUInt8(this.offset);
                this.offset += 1;
            } catch (e) {
                throw Log.error("EEOFBUF", 1);
            }
            return result;
        }

        private nextInt8(): number {
            let result;
            try {
                result = this.data.readInt8(this.offset);
                this.offset += 1;
            } catch (e) {
                throw Log.error("EEOFBUF", 1);
            }
            return result;
        }

        private nextUInt16(): number {
            let result;
            try {
                result = this.data.readUInt16LE(this.offset);
                this.offset += 2;
            } catch (e) {
                throw Log.error("EEOFBUF", 2);
            }
            return result;
        }

        private nextInt16(): number {
            let result;
            try {
                result = this.data.readInt16LE(this.offset);
                this.offset += 2;
            } catch (e) {
                throw Log.error("EEOFBUF", 2);
            }
            return result;
        }

        private nextUInt32(): number {
            let result;
            try {
                result = this.data.readUInt32LE(this.offset);
                this.offset += 4;
            } catch (e) {
                throw Log.error("EEOFBUF", 4);
            }
            return result;
        }

        private nextInt32(): number {
            let result;
            try {
                result = this.data.readInt32LE(this.offset);
                this.offset += 4;
            } catch (e) {
                throw Log.error("EEOFBUF", 4);
            }
            return result;
        }

        private nextFloat(): number {
            let result;
            try {
                result = this.data.readFloatLE(this.offset);
                this.offset += 4;
            } catch (e) {
                throw Log.error("EEOFBUF", 4);
            }
            return result;
        }

        private getFloat(): number {
            if (helpers.isGameGTA3()) {
                let val = this.nextInt16();
                return val / 16.0;
            }
            return this.nextFloat();
        }

        private getString(): string {
            let result;
            try {
                result = this.data.toString('utf8', this.offset, this.offset+8).split('\0').shift();
                this.offset += 8;
            } catch (e) {
                throw Log.error("EEOFBUF", 8);
            }
            return result;
        }

        [Symbol.iterator]() {
            let self = this;
            let iterator = {
                next() {
                    if (self.offset >= self.data.length) {
                        return {value: undefined, done: true};
                    }

                    return {
                        value: self.getOpcode(),
                        done:  false
                    };
                }
            };
            return iterator;
        }

        private getOpcode() {
            let opcode = new COpcode();
            let id = opcode.id = this.nextUInt16();
            let params = this.opcodesData[id & 0x07FF].params;
            opcode.params = params === null ? this.getArgumentsList() : this.getParams(params.length);
            return opcode;
        }

        private getParamType(): eParamType {
            let dataType = this.nextUInt8();

            if (helpers.isGameGTA3() || helpers.isGameVC()) {
                if (dataType > eParamType.FLOAT) {
                    this.offset -= 1; // no datatype there
                    return eParamType.STR8;
                }
            }
            return <eParamType>dataType;
        }

        /**
         * read parameters until eParamType.EOL
         * @returns {null}
         */
        private getArgumentsList(): IOpcodeParam[] {
            let params = [];
            let paramType: eParamType;
            while ((paramType = this.getParamType()) != eParamType.EOL) {
                params[params.length] = this.getParam(paramType);
            }
            return params;
        }

        /**
         * read <np> parameters
         * @param numOfParams
         * @returns {IOpcodeParam[]}
         */
        private getParams(numOfParams: number): IOpcodeParam[] {
            let params = [];
            while (numOfParams--) {
                params[params.length] = this.getParam(this.getParamType());
            }
            return params;
        }

        /**
         * read one opcode parameter
         * @returns {IOpcodeParam}
         */
        private getParam(paramType: eParamType): IOpcodeParam {
            const paramsProcessingTable: Object = {
                [eParamType.IMM32]: () => ({
                    type:  eParamType.IMM32,
                    value: this.nextInt32()
                }),
                [eParamType.GVAR]:  () => ({
                    type:  eParamType.GVAR,
                    value: this.nextUInt16()
                }),
                [eParamType.LVAR]:  () => ({
                    type:  eParamType.LVAR,
                    value: this.nextUInt16()
                }),
                [eParamType.IMM8]:  () => ({
                    type:  eParamType.IMM8,
                    value: this.nextInt8()
                }),
                [eParamType.IMM16]: () => ({
                    type:  eParamType.IMM16,
                    value: this.nextInt16()
                }),
                [eParamType.FLOAT]: () => ({
                    type:  eParamType.FLOAT,
                    value: this.getFloat()
                }),
                [eParamType.STR8]:  () => ({
                    type:  eParamType.STR8,
                    value: this.getString()
                }),
            }
            if (!paramsProcessingTable.hasOwnProperty(paramType)) {
                throw Log.error("EUNKPAR", paramType)
            }
            return paramsProcessingTable[paramType]();
        }
    }
}

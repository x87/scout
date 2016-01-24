module scout.frontend {

    export const PARAM_ANY = "any";
    export const PARAM_ARGUMENTS = "arguments";
    export const PARAM_LABEL = "label";

    export class COpcode implements IOpcode {
        public isLeader: boolean;
        public id: number;
        public offset: number;
        public params: IOpcodeParam[];
    }

    export class COpcodeParser {

        private _data: Buffer;
        private _offset;
        private _paramTypesHandlers: Object;
        private _paramValuesHandlers: Object;
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

        get paramTypesHandlers(): Object {
            return this._paramTypesHandlers;
        }

        get paramValuesHandlers(): Object {
            return this._paramValuesHandlers;
        }

        get opcodesData(): IOpcodeData[] {
            return this._opcodesData;
        }

        set opcodesData(value: IOpcodeData[]) {
            this._opcodesData = value;
        }

        constructor() {
            this._paramValuesHandlers = {
                [eParamType.NUM8]:      () => this.nextInt8(),
                [eParamType.NUM16]:     () => this.nextInt16(),
                [eParamType.NUM32]:     () => this.nextInt32(),
                [eParamType.FLOAT]:     () => this.getFloat(),
                [eParamType.STR]:       () => this.getString(this.nextUInt8()),
                [eParamType.STR8]:      () => this.getString(8),
                [eParamType.STR16]:     () => this.getString(16),
                [eParamType.STR128]:    () => this.getString(128),
                [eParamType.GVARNUM32]: () => this.nextUInt16(),
                [eParamType.LVARNUM32]: () => this.nextUInt16(),
                [eParamType.GVARSTR8]:  () => this.nextUInt16(),
                [eParamType.LVARSTR8]:  () => this.nextUInt16(),
                [eParamType.GVARSTR16]: () => this.nextUInt16(),
                [eParamType.LVARSTR16]: () => this.nextUInt16(),
                [eParamType.GARRNUM32]: () => this.getArray(),
                [eParamType.LARRNUM32]: () => this.getArray(),
                [eParamType.GARRSTR8]:  () => this.getArray(),
                [eParamType.LARRSTR8]:  () => this.getArray(),
                [eParamType.GARRSTR16]: () => this.getArray(),
                [eParamType.LARRSTR16]: () => this.getArray(),
            }

            this._paramTypesHandlers = (() => [...Array(256)].map((v, i) => {
                switch (i) {
                    case 0:
                        return () => eParamType.EOL;
                    case 1:
                        return () => eParamType.NUM32;
                    case 2:
                        return () => eParamType.GVARNUM32;
                    case 3:
                        return () => eParamType.LVARNUM32;
                    case 4:
                        return () => eParamType.NUM8;
                    case 5:
                        return () => eParamType.NUM16;
                    case 6:
                        return () => eParamType.FLOAT;
                    case 7:
                        if (helpers.isGameSA()) {
                            return () => eParamType.GARRNUM32;
                        }
                    case 8:
                        if (helpers.isGameSA()) {
                            return () => eParamType.LARRNUM32;
                        }
                    case 9:
                        if (helpers.isGameSA()) {
                            return () => eParamType.STR8;
                        }
                    case 0xA:
                        if (helpers.isGameSA()) {
                            return () => eParamType.GVARSTR8;
                        }
                    case 0xB:
                        if (helpers.isGameSA()) {
                            return () => eParamType.LVARSTR8;
                        }
                    case 0xC:
                        if (helpers.isGameSA()) {
                            return () => eParamType.GARRSTR8;
                        }
                    case 0xD:
                        if (helpers.isGameSA()) {
                            return () => eParamType.LARRSTR8;
                        }
                    case 0xE:
                        if (helpers.isGameSA()) {
                            return () => eParamType.STR;
                        }
                    case 0xF:
                        if (helpers.isGameSA()) {
                            return () => eParamType.STR16;
                        }
                    case 0x10:
                        if (helpers.isGameSA()) {
                            return () => eParamType.GVARSTR16;
                        }
                    case 0x11:
                        if (helpers.isGameSA()) {
                            return () => eParamType.LVARSTR16;
                        }
                    case 0x12:
                        if (helpers.isGameSA()) {
                            return () => eParamType.GARRSTR16;
                        }
                    case 0x13:
                        if (helpers.isGameSA()) {
                            return () => eParamType.LARRSTR16;
                        }
                    default:
                        if (helpers.isGameSA()) {
                            return () => {
                                this.offset--;
                                return eParamType.STR128;
                            }
                        } else {
                            return () => {
                                this.offset--;
                                return eParamType.STR8;
                            }
                        }
                }
            }))();
        }

        private nextUInt8(): number {
            let result: number;
            try {
                result = this.data.readUInt8(this.offset);
                this.offset += 1;
            } catch (e) {
                throw Log.error("EEOFBUF", 1);
            }
            return result;
        }

        private nextInt8(): number {
            let result: number;
            try {
                result = this.data.readInt8(this.offset);
                this.offset += 1;
            } catch (e) {
                throw Log.error("EEOFBUF", 1);
            }
            return result;
        }

        private nextUInt16(): number {
            let result: number;
            try {
                result = this.data.readUInt16LE(this.offset);
                this.offset += 2;
            } catch (e) {
                throw Log.error("EEOFBUF", 2);
            }
            return result;
        }

        private nextInt16(): number {
            let result: number;
            try {
                result = this.data.readInt16LE(this.offset);
                this.offset += 2;
            } catch (e) {
                throw Log.error("EEOFBUF", 2);
            }
            return result;
        }

        private nextUInt32(): number {
            let result: number;
            try {
                result = this.data.readUInt32LE(this.offset);
                this.offset += 4;
            } catch (e) {
                throw Log.error("EEOFBUF", 4);
            }
            return result;
        }

        private nextInt32(): number {
            let result: number;
            try {
                result = this.data.readInt32LE(this.offset);
                this.offset += 4;
            } catch (e) {
                throw Log.error("EEOFBUF", 4);
            }
            return result;
        }

        private nextFloat(): number {
            let result: number;
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

        private getString(length: number): string {
            let result: string;
            try {
                result = this.data.toString('utf8', this.offset, this.offset + length).split('\0').shift();
                this.offset += length;
            } catch (e) {
                throw Log.error("EEOFBUF", length);
            }
            return result;
        }

        private getArray(): IOpcodeParamArray {
            let result: IOpcodeParamArray = {
                offset:   this.nextUInt16(),
                varIndex: this.nextUInt16(),
                size:     this.nextUInt8(),
                props:    this.nextUInt8()
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
            opcode.offset = this.offset;
            opcode.id = this.nextUInt16();
            opcode.params = this.getOpcodeParams(opcode.id & 0x7FFF);
            opcode.isLeader = false;
            return opcode;
        }

        private getParamType(): eParamType {
            let dataType = this.nextUInt8();
            return this.paramTypesHandlers[dataType]();
        }

        private getOpcodeParams(opcodeId: number): IOpcodeParam[] {
            let params = [];
            let paramType: eParamType;
            let paramsData = this.opcodesData[opcodeId].params;

            for (let i = 0; i < paramsData.length; i += 1) {

                if (paramsData[i].type == PARAM_ARGUMENTS) {
                    while ((paramType = this.getParamType()) != eParamType.EOL) {
                        params[params.length] = this.getParam(paramType);
                    }
                    return params;
                }

                paramType = this.getParamType();
                if (paramType === eParamType.EOL) {
                    throw Log.error("EUNKPAR", paramType)
                }
                params[params.length] = this.getParam(paramType);
            }

            return params;
        }

        /**
         * read one opcode parameter
         * @returns {IOpcodeParam}
         */
        private getParam(paramType: eParamType): IOpcodeParam {
            return {
                type:  paramType,
                value: this.paramValuesHandlers[paramType]()
            };
        }

    }
}

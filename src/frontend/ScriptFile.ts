module cleojs.disasm {
    import eGame = cleojs.common.eGame;
    import eScriptFileSegments = cleojs.common.eScriptFileSegments;
    import IExternalScriptHeader = cleojs.common.IExternalScriptHeader;
    const scriptFileSegmentsMap: Object = {
        [eGame.GTA3]:  {
            [eScriptFileSegments.GLOBAL_VARS]: 0,
            [eScriptFileSegments.MODELS]:      1,
            [eScriptFileSegments.MISSIONS]:    2,
            [eScriptFileSegments.MAIN]:        3,
        },
        [eGame.GTAVC]: {
            [eScriptFileSegments.GLOBAL_VARS]: 0,
            [eScriptFileSegments.MODELS]:      1,
            [eScriptFileSegments.MISSIONS]:    2,
            [eScriptFileSegments.MAIN]:        3,
        },
        [eGame.GTASA]: {
            [eScriptFileSegments.GLOBAL_VARS]: 0,
            [eScriptFileSegments.MODELS]:      1,
            [eScriptFileSegments.MISSIONS]:    2,
            [eScriptFileSegments.EXTERNALS]:   3,
            [eScriptFileSegments.SASEG5]:      4,
            [eScriptFileSegments.SASEG6]:      5,
            [eScriptFileSegments.MAIN]:        6,
        }
    };

    export class CExternalScriptHeader implements IExternalScriptHeader {
        name: string;
        offset: number;
        size: number;

        constructor(name, offset, size) {
            this.name = name;
            this.offset = offset;
            this.size = size;
        }

    }

    export class CScriptFileHeader implements IScriptFileHeader {

        private _size: number;
        private _offset: number;
        private _data: Buffer;

        numModels: number;
        modelIds: string[];
        mainSize: number;
        largestMission: number;
        numMissions: number;
        numExclusiveMissions: number;
        highestLocalInMission: number;
        missions: number[];
        numExternals: number;
        largestExternalSize: number;
        externals: ExternalScriptHeader[];

        constructor(data: Buffer) {
            this.data = data;

            this.loadModelSegment();
            this.loadMissionSegment();

            if (helpers.isGameSA()) {
                this.loadExternalSegment();
            }

            this._size = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MAIN], false);
        }


        private loadModelSegment() {
            this.offset = this.getSegmentOffset(this.data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MODELS]);

            this.numModels = this.read32Bit();

            this.modelIds = [];
            this.offset += 24; // skip first model (empty)

            for (let i = 1; i < this.numModels; i += 1) {
                this.modelIds[this.modelIds.length] = this.readString(24);
            }

        }

        private loadMissionSegment() {
            this.offset = this.getSegmentOffset(this.data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MISSIONS]);
            this.mainSize = this.read32Bit();
            this.largestMission = this.read32Bit();
            this.numMissions = this.read16Bit();
            this.numExclusiveMissions = this.read16Bit();

            if (helpers.isGameSA()) {
                this.highestLocalInMission = this.read32Bit();
            }

            this.missions = [];

            for (let i = 0; i < this.numMissions; i += 1) {
                this.missions[this.missions.length] = this.read32Bit();
            }
        }

        private loadExternalSegment() {
            this.offset = this.getSegmentOffset(this.data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.EXTERNALS]);
            this.largestExternalSize = this.read32Bit();
            this.numExternals = this.read32Bit();

            this.externals = [];
            for (let i = 0; i < this.numExternals; i += 1) {
                this.externals[this.externals.length] = new CExternalScriptHeader(this.readString(20), this.read32Bit(), this.read32Bit());
            }
        }


        private getSegmentOffset(data: Buffer, segmentId: number, skipJumpOpcode: boolean = true): number {
            let result = 0;
            while (segmentId--) {
                result = data.readInt32LE(result + 3);
            }
            return result + (skipJumpOpcode ? 8 : 0);
        }

        public getSize(): number {
            return this._size;
        }

        private readString(len): string {
            this.offset += len;
            return this.data.toString('utf8', this.offset - len, this.offset).split('\0').shift();
        }

        private read32Bit(): number {
            this.offset += 4;
            return this.data.readInt32LE(this.offset - 4);
        }

        private read16Bit(): number {
            this.offset += 2;
            return this.data.readInt16LE(this.offset - 2);
        }

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

    }

    export class CScriptFile {
        private _opcodes: Buffer;
        private _hasHeader: boolean;
        private _header: CScriptFileHeader

        set opcodes(value: Buffer) {
            this._opcodes = value;
        }

        get opcodes(): Buffer {
            return this._opcodes;
        }

        get hasHeader(): boolean {
            return this._hasHeader;
        }

        set hasHeader(value: boolean) {
            this._hasHeader = value;
        }

        get header(): CScriptFileHeader {
            return this._header;
        }

        set header(value: CScriptFileHeader) {
            this._header = value;
        }


    }
}

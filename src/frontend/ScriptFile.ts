module scout.frontend {
    import eGame = scout.common.eGame;
    import eScriptFileSegments = scout.common.eScriptFileSegments;
    import IExternalScriptHeader = scout.common.IExternalScriptHeader;
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

        modelIds: string[];
        mainSize: number;
        largestMission: number;
        numExclusiveMissions: number;
        highestLocalInMission: number;
        missions: number[];
        largestExternalSize: number;
        externals: CExternalScriptHeader[];

        constructor(data: Buffer) {
            this.loadModelSegment(data);
            this.loadMissionSegment(data);

            if (helpers.isGameSA()) {
                this.loadExternalSegment(data);
            }

            this._size = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MAIN], false);
        }


        private loadModelSegment(data: Buffer) {
            this.offset = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MODELS]);

            let numModels = this.read32Bit(data);
            this.modelIds = [];
            this.offset += 24; // skip first model (empty)

            for (let i = 1; i < numModels; i += 1) {
                this.modelIds[this.modelIds.length] = this.readString(data, 24);
            }

        }

        private loadMissionSegment(data: Buffer) {
            this.offset = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MISSIONS]);
            this.mainSize = this.read32Bit(data);
            this.largestMission = this.read32Bit(data);
            let numMissions = this.read16Bit(data);
            this.numExclusiveMissions = this.read16Bit(data);

            if (helpers.isGameSA()) {
                this.highestLocalInMission = this.read32Bit(data);
            }

            this.missions = [];

            for (let i = 0; i < numMissions; i += 1) {
                this.missions[this.missions.length] = this.read32Bit(data);
            }
        }

        private loadExternalSegment(data: Buffer) {
            this.offset = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.EXTERNALS]);
            this.largestExternalSize = this.read32Bit(data);
            let numExternals = this.read32Bit(data);

            this.externals = [];
            for (let i = 0; i < numExternals; i += 1) {
                this.externals[this.externals.length] = new CExternalScriptHeader(this.readString(data, 20), this.read32Bit(data), this.read32Bit(data));
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

        private readString(data: Buffer, len): string {
            this.offset += len;
            return data.toString('utf8', this.offset - len, this.offset).split('\0').shift();
        }

        private read32Bit(data: Buffer): number {
            this.offset += 4;
            return data.readInt32LE(this.offset - 4);
        }

        private read16Bit(data: Buffer): number {
            this.offset += 2;
            return data.readInt16LE(this.offset - 2);
        }

        get offset(): number {
            return this._offset;
        }

        set offset(value: number) {
            this._offset = value;
        }

    }

    export class CScriptFile {

        private _mainData: Buffer;

        get mainData(): Buffer {
            return this._mainData;
        }

        set mainData(value: Buffer) {
            this._mainData = value;
        }

        public init(data: Buffer) {
            this.mainData = data.slice(this.baseOffset);
        }

        get baseOffset(): number {
            return 0;
        }


    }

    export class CScriptFileSCM extends CScriptFile {
        private _header: CScriptFileHeader;
        private _missionsData: Buffer[];
        private _externalData: Buffer[];

        constructor(data: Buffer) {
            super();
            this.header = new CScriptFileHeader(data);
            this._missionsData = [];
            this._externalData = [];
        }

        public init(data: Buffer) {
            this.mainData = data.slice(this.baseOffset, this.header.mainSize);
            for (let i = 0, len = this.header.missions.length; i < len; i += 1) {
                let nextMissionOffset = i == len - 1 ? data.length : this.header.missions[i + 1];
                this.missionsData[this.missionsData.length] = data.slice(this.header.missions[i], nextMissionOffset)
            }
            // todo; read external data
        }

        get externalData(): Buffer[] {
            return this._externalData;
        }

        get missionsData(): Buffer[] {
            return this._missionsData;
        }

        get baseOffset(): number {
            return this.header.getSize();
        }

        get header(): CScriptFileHeader {
            return this._header;
        }

        set header(value: CScriptFileHeader) {
            this._header = value;
        }
    }

    export class CCompiledFile implements ICompiledFile {
        type: eCompiledFileType;
        size: number;
        opcodes: TOpcodesMap;

    }
}

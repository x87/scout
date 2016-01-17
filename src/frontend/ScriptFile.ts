module cleojs.disasm {
    import eGame = cleojs.common.eGame;
    import eScriptFileSegments = cleojs.common.eScriptFileSegments;
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
            [eScriptFileSegments.MAIN]:        4,
        }
    };

    export class CScriptFileHeader implements IScriptFileHeader {

        private _size: number;
        numModels: number;
        modelIds: string[];
        mainSize: number;
        largestMission: number;
        numMissions: number;
        numExclusiveMissions: number;
        missions: number[];


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

        constructor(data: Buffer) {
            let map = scriptFileSegmentsMap[Arguments.game];

            let offset = this.getSegmentOffset(data, map[eScriptFileSegments.MODELS]);

            this.numModels = data.readInt32LE(offset);
            offset += 4;

            this.modelIds = [];
            offset += 24; // skip first model (empty)

            for (let i = 1; i < this.numModels; i += 1, offset += 24) {
                this.modelIds[this.modelIds.length] = data.toString('utf8', offset, offset + 24).split('\0').shift();
            }

            offset = this.getSegmentOffset(data, map[eScriptFileSegments.MISSIONS]);
            this.mainSize = data.readInt32LE(offset);
            offset += 4;
            this.largestMission = data.readInt32LE(offset);
            offset += 4;
            this.numMissions = data.readInt16LE(offset);
            offset += 2;
            this.numExclusiveMissions = data.readInt16LE(offset);
            offset += 2;
            this.missions = [];

            for (let i = 0; i < this.numMissions; i += 1, offset += 4) {
                this.missions[this.missions.length] = data.readInt32LE(offset);
            }

            this._size = this.getSegmentOffset(data, map[eScriptFileSegments.MAIN], false);
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

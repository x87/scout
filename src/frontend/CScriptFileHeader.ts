import * as utils from 'utils';
import Arguments from 'common/arguments';
import { IExternalScriptHeader, IScriptFileHeader } from 'common/interfaces';
import { eGame, eScriptFileSegments } from 'common/enums';

const scriptFileSegmentsMap: any = {
	[eGame.GTA3]: {
		[eScriptFileSegments.GLOBAL_VARS]: 0,
		[eScriptFileSegments.MODELS]: 1,
		[eScriptFileSegments.MISSIONS]: 2,
		[eScriptFileSegments.MAIN]: 3
	},
	[eGame.GTAVC]: {
		[eScriptFileSegments.GLOBAL_VARS]: 0,
		[eScriptFileSegments.MODELS]: 1,
		[eScriptFileSegments.MISSIONS]: 2,
		[eScriptFileSegments.MAIN]: 3
	},
	[eGame.GTASA]: {
		[eScriptFileSegments.GLOBAL_VARS]: 0,
		[eScriptFileSegments.MODELS]: 1,
		[eScriptFileSegments.MISSIONS]: 2,
		[eScriptFileSegments.EXTERNALS]: 3,
		[eScriptFileSegments.SASEG5]: 4,
		[eScriptFileSegments.SASEG6]: 5,
		[eScriptFileSegments.MAIN]: 6
	}
};

export default class CScriptFileHeader implements IScriptFileHeader {

	readonly size: number;
	offset: number;

	modelIds: string[];
	mainSize: number;
	largestMission: number;
	numExclusiveMissions: number;
	highestLocalInMission: number;
	missions: number[];
	largestExternalSize: number;
	externals: IExternalScriptHeader[];

	constructor(data: Buffer) {
		this.loadModelSegment(data);
		this.loadMissionSegment(data);

		if (utils.isGameSA()) {
			this.loadExternalSegment(data);
		}

		this.size = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MAIN], false);
	}

	private loadModelSegment(data: Buffer) {
		this.offset = this.getSegmentOffset(data, scriptFileSegmentsMap[Arguments.game][eScriptFileSegments.MODELS]);

		const numModels = this.read32Bit(data);
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
		const numMissions = this.read16Bit(data);
		this.numExclusiveMissions = this.read16Bit(data);

		if (utils.isGameSA()) {
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
		const numExternals = this.read32Bit(data);

		this.externals = [];
		for (let i = 0; i < numExternals; i += 1) {
			this.externals[this.externals.length] = {
				name: this.readString(data, 20),
				offset: this.read32Bit(data),
				size: this.read32Bit(data)
			} as IExternalScriptHeader;
		}
	}

	private getSegmentOffset(data: Buffer, segmentId: number, skipJumpOpcode: boolean = true): number {
		let result = 0;
		while (segmentId--) {
			result = data.readInt32LE(result + 3);
		}
		return result + (skipJumpOpcode ? 8 : 0);
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

}

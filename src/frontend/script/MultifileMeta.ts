import * as utils from 'utils';
import Arguments from 'common/arguments';
import AppError from 'common/errors';
import Log from 'utils/log';
import { eGame, eScriptFileSegments } from 'common/enums';

interface IMultifileMetadata {
	modelIds: string[];
	mainSize: number;
	largestMission: number;
	numExclusiveMissions: number;
	missions: number[];
	externals: IExternalScriptMetadata[];
}

interface IExternalScriptMetadata {
	name: string;
	offset: number;
	size: number;
}

type SegmentId = number;

interface IMultifileHeader {
	[key: string]: {
		[key: string]: SegmentId;
	};
}

const MultifileHeaderMap: IMultifileHeader = {
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

export default class MultifileMetadata implements IMultifileMetadata {

	readonly size: number;
	offset: number;

	modelIds: string[];
	mainSize: number;
	largestMission: number;
	numExclusiveMissions: number;
	highestLocalInMission: number;
	missions: number[];
	largestExternalSize: number;
	externals: IExternalScriptMetadata[];

	constructor(data: Buffer) {
		if (data.buffer.byteLength === 0) {
			throw Log.error(AppError.EMPTY_SCM);
		}
		this.loadModelSegment(data);
		this.loadMissionSegment(data);

		if (utils.isGameSA()) {
			this.loadExternalSegment(data);
		}

		const segmentId = MultifileHeaderMap[Arguments.game][eScriptFileSegments.MAIN];
		this.size = this.getSegmentOffset(data, segmentId, false);
	}

	private loadModelSegment(data: Buffer): void {
		const segmentId = MultifileHeaderMap[Arguments.game][eScriptFileSegments.MODELS];
		this.offset = this.getSegmentOffset(data, segmentId);

		const numModels = this.read32Bit(data);
		this.modelIds = [];
		this.offset += 24; // skip first model (empty)

		for (let i = 1; i < numModels; i += 1) {
			this.modelIds.push(this.readString(data, 24));
		}

	}

	private loadMissionSegment(data: Buffer): void {
		const segmentId = MultifileHeaderMap[Arguments.game][eScriptFileSegments.MISSIONS];
		this.offset = this.getSegmentOffset(data, segmentId);
		this.mainSize = this.read32Bit(data);
		this.largestMission = this.read32Bit(data);
		const numMissions = this.read16Bit(data);
		this.numExclusiveMissions = this.read16Bit(data);

		if (utils.isGameSA()) {
			this.highestLocalInMission = this.read32Bit(data);
		}

		this.missions = [];

		for (let i = 0; i < numMissions; i += 1) {
			this.missions.push(this.read32Bit(data));
		}
	}

	private loadExternalSegment(data: Buffer): void {
		const segmentId = MultifileHeaderMap[Arguments.game][eScriptFileSegments.EXTERNALS];
		this.offset = this.getSegmentOffset(data, segmentId);
		this.largestExternalSize = this.read32Bit(data);
		const numExternals = this.read32Bit(data);

		this.externals = [];
		for (let i = 0; i < numExternals; i += 1) {
			this.externals.push({
				name: this.readString(data, 20),
				offset: this.read32Bit(data),
				size: this.read32Bit(data)
			});
		}
	}

	private getSegmentOffset(data: Buffer, segmentId: SegmentId, skipJumpOpcode: boolean = true): number {
		let result = 0;
		while (segmentId--) {
			result = data.readInt32LE(result + 3);
		}
		return result + (skipJumpOpcode ? 8 : 0);
	}

	private readString(data: Buffer, len: number): string {
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

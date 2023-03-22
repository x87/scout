import * as utils from 'utils';
import {GLOBAL_OPTIONS} from 'common/arguments';
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
    [eScriptFileSegments.MAIN]: 3,
  },
  [eGame.GTAVC]: {
    [eScriptFileSegments.GLOBAL_VARS]: 0,
    [eScriptFileSegments.MODELS]: 1,
    [eScriptFileSegments.MISSIONS]: 2,
    [eScriptFileSegments.MAIN]: 3,
  },
  [eGame.GTASA]: {
    [eScriptFileSegments.GLOBAL_VARS]: 0,
    [eScriptFileSegments.MODELS]: 1,
    [eScriptFileSegments.MISSIONS]: 2,
    [eScriptFileSegments.EXTERNALS]: 3,
    [eScriptFileSegments.SASEG5]: 4,
    [eScriptFileSegments.SASEG6]: 5,
    [eScriptFileSegments.MAIN]: 6,
  },
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

  constructor(data: DataView) {
    if (data.byteLength === 0) {
      throw Log.error(AppError.EMPTY_SCM);
    }
    this.loadModelSegment(data);
    this.loadMissionSegment(data);

    if (utils.isGameSA()) {
      this.loadExternalSegment(data);
    }

    const segmentId =
      MultifileHeaderMap[GLOBAL_OPTIONS.game][eScriptFileSegments.MAIN];
    this.size = this.getSegmentOffset(data, segmentId, false);
  }

  private loadModelSegment(data: DataView): void {
    const segmentId =
      MultifileHeaderMap[GLOBAL_OPTIONS.game][eScriptFileSegments.MODELS];
    this.offset = this.getSegmentOffset(data, segmentId);

    const numModels = this.read32Bit(data);
    this.modelIds = [];
    this.offset += 24; // skip first model (empty)

    for (let i = 1; i < numModels; i += 1) {
      this.modelIds.push(this.readString(data, 24));
    }
  }

  private loadMissionSegment(data: DataView): void {
    const segmentId =
      MultifileHeaderMap[GLOBAL_OPTIONS.game][eScriptFileSegments.MISSIONS];
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

  private loadExternalSegment(data: DataView): void {
    const segmentId =
      MultifileHeaderMap[GLOBAL_OPTIONS.game][eScriptFileSegments.EXTERNALS];
    this.offset = this.getSegmentOffset(data, segmentId);
    this.largestExternalSize = this.read32Bit(data);
    const numExternals = this.read32Bit(data);

    this.externals = [];
    for (let i = 0; i < numExternals; i += 1) {
      this.externals.push({
        name: this.readString(data, 20),
        offset: this.read32Bit(data),
        size: this.read32Bit(data),
      });
    }
  }

  private getSegmentOffset(
    data: DataView,
    segmentId: SegmentId,
    skipJumpOpcode: boolean = true
  ): number {
    let result = 0;
    while (segmentId--) {
      result = data.getInt32(result + 3, true);
    }
    return result + (skipJumpOpcode ? 8 : 0);
  }

  private readString(data: DataView, len: number): string {
    let s = '';
    for (let i = 0; i < len; i++) {
      const char = data.getUint8(this.offset + i);
      if (char == 0) break;
      s += String.fromCharCode(char);
    }
    this.offset += len;
    return s;
  }

  private read32Bit(data: DataView): number {
    this.offset += 4;
    return data.getInt32(this.offset - 4, true);
  }

  private read16Bit(data: DataView): number {
    this.offset += 2;
    return data.getInt16(this.offset - 2, true);
  }
}

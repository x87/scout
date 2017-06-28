import {
    eGame,
    eParamType,
    eCompiledFileType,
    eBasicBlockType
} from './enums';

export interface IArguments {
    game: eGame;
    inputFile: string;
    printAssembly: boolean;
}

export interface IOpcodeParamArray {
    offset: number;
    varIndex: number;
    size: number;
    props: number;
}

export interface IOpcodeDataParam {
    type: string;
}

export interface IOpcodeData {
    name: string;
    params: IOpcodeDataParam[];
}

export interface IOpcode {
    id: number;
    offset: number;
    params: IOpcodeParam[];
    isLeader: boolean;
    isHeader: boolean;
}

export interface IOpcodeParam {
    type: eParamType;
    value: number | string | IOpcodeParamArray;
}

export interface IScriptFileHeader {
    modelIds: string[];
    mainSize: number;
    largestMission: number;
    numExclusiveMissions: number;
    missions: number[];
    externals: IExternalScriptHeader[];
}

export interface IExternalScriptHeader {
    name: string;
    offset: number;
    size: number;
}

export type TOpcodesMap = Map<number, IOpcode>;

export type TBasicBlockMap = Map<number, IBasicBlock>;

export interface ICompiledFile {
    type: eCompiledFileType;
    opcodes: TOpcodesMap;
}

export interface IBasicBlock {
    type: eBasicBlockType;
    opcodes: IOpcode[];
    successors: IBasicBlock[];
    predecessors: IBasicBlock[];
    processed: boolean;
    inLoop: boolean;
    isHeaderBlock: boolean;
}

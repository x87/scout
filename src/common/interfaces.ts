import { eBasicBlockType, eScriptType, eParamType } from './enums';

export interface IOpcodeParamArray {
	offset: number;
	varIndex: number;
	size: number;
	props: number;
}

export interface IOpcodeDataParam {
	type: string;
}

export type OpcodeMap = Map<number, IOpcodeData>;

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

export type OpcodeOffsetMap = Map<number, IOpcode>;

export type BasicBlockOffsetMap = Map<number, IBasicBlock>;

export interface IScript {
	type: eScriptType;
	opcodes: OpcodeOffsetMap;
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

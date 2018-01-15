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

export type TOpcodesMap = Map<number, IOpcode>;

export type TBasicBlockMap = Map<number, IBasicBlock>;

export interface IScript {
	type: eScriptType;
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

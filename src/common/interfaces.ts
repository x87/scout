import { eBasicBlockType, eScriptType, eParamType } from './enums';

export interface IInstructionDefinition {
	name: string;
	params: Array<{
		type: string;
	}>;
}

export interface IInstruction {
	opcode: number;
	offset: number;
	params: IInstructionParam[];
	isLeader: boolean;
	isHeader: boolean;
}

export interface IInstructionParam {
	type: eParamType;
	value: number | string | IInstructionParamArray;
}

export interface IInstructionParamArray {
	offset: number;
	varIndex: number;
	size: number;
	props: number;
}

export interface IBasicBlock {
	type: eBasicBlockType;
	instructions: IInstruction[];
	successors: IBasicBlock[];
	predecessors: IBasicBlock[];
	processed: boolean;
	inLoop: boolean;
	isHeaderBlock: boolean;
}

export type DefinitionMap = Map<number, IInstructionDefinition>;
export type InstructionMap = Map<number, IInstruction>;
export type BasicBlockMap = Map<number, IBasicBlock>;

export interface IScript {
	type: eScriptType;
	instructionMap: InstructionMap;
}

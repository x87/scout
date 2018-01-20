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
}

export interface IInstructionBranch extends IInstruction {
	params: [{ type: eParamType.NUM32, value: number }];
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
}

export type DefinitionMap = Map<number, IInstructionDefinition>;
export type InstructionMap = Map<number, IInstruction>;

export interface IScript {
	type: eScriptType;
	instructionMap: InstructionMap;
}

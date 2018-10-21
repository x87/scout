import { eBasicBlockType, eScriptType } from './enums';
import { IInstruction, IInstructionDefinition, InstructionMap } from './instructions';

export interface IBasicBlock {
	type: eBasicBlockType;
	instructions: IInstruction[];
}

export type DefinitionMap = Map<number, IInstructionDefinition>;

export interface IScript {
	type: eScriptType;
	instructionMap: InstructionMap;
	innerScripts?: IScript[];
}

export type Opcode = number;

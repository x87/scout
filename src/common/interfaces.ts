import { eBasicBlockType, eScriptType } from './enums';
import {
  IInstruction,
  IInstructionDefinition,
  InstructionMap
} from './instructions';

export interface IBasicBlock {
  type: eBasicBlockType;
  instructions: IInstruction[];
  start: number;
}

export type DefinitionMap = Map<number, IInstructionDefinition>;

export interface IScript {
  type: eScriptType;
  instructionMap: InstructionMap;
  name: string;
}

export type Opcode = number;

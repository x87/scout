import { eParamType } from './enums';
import { Log } from 'utils/log';
import { AppError } from './errors';

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

interface TypedInstruction<
  T extends eParamType,
  V extends number | string | IInstructionParamArray
> extends IInstruction {
  params: [{ type: T; value: V }];
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

export type InstructionMap = Map<number, IInstruction>;

export const isNumeric = (
  instruction: IInstruction
): instruction is TypedInstruction<
  eParamType.NUM32,
  number
> => {
  return [eParamType.NUM32, eParamType.NUM16, eParamType.NUM8].includes(
    instruction.params[0].type
  );
};

export const isString8 = (
  instruction: IInstruction
): instruction is TypedInstruction<eParamType.STR8, string> => {
  return [eParamType.STR8].includes(instruction.params[0].type);
};

export const getNumericParam = (instruction: IInstruction): number => {
  if (!isNumeric(instruction)) {
    throw Log.error(AppError.NOT_NUMERIC_INSTRUCTION, instruction.offset);
  }
  return Number(instruction.params[0].value);
};

export const getString8Param = (instruction: IInstruction): string => {
  if (!isString8(instruction)) {
    throw Log.error(AppError.NOT_STRING_INSTRUCTION, instruction.offset);
  }
  return instruction.params[0].value;
};

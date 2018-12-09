import { eParamType } from './enums';
import Log from 'utils/log';
import AppError from './errors';

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

export interface IInstructionInt32 extends IInstruction {
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

export type InstructionMap = Map<number, IInstruction>;

export const isNumeric = (instruction: IInstruction): instruction is IInstructionInt32 => {
	return [eParamType.NUM32, eParamType.NUM16, eParamType.NUM8].includes(instruction.params[0].type);
};

export const getNumericParam = (instruction: IInstruction): number => {
	if (!isNumeric(instruction)) {
		throw Log.error(AppError.NOT_NUMERIC_INSTRUCTION, instruction.offset);
	}
	return Number(instruction.params[0].value);
};

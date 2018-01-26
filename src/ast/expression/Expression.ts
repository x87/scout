import { IInstruction } from 'common/instructions';
import { IBasicBlock } from 'common/interfaces';

export default class Expression {
	instruction: IInstruction;
	bb: IBasicBlock;
	constructor(instruction: IInstruction, bb: IBasicBlock) {
		this.instruction = instruction;
		this.bb = bb;
	}
}

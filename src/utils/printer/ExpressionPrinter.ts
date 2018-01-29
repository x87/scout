import SimplePrinter from './SimplePrinter';
import * as utils from 'utils';
import { DefinitionMap, IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';
import { IInstructionParamArray } from 'common/instructions';
import Log from '../log';

export default class ExpressionPrinter extends SimplePrinter  {

	indent: number;

	constructor(definitionMap: DefinitionMap) {
		super(definitionMap);
		this.indent = 0;
	}

	get indentation(): string {
		return utils.strPadLeft('', this.indent, '\t');
	}

	print(bb: IBasicBlock, printComments: boolean = false): void {
		let output = this.indentation;

		const append = (format: string, ...args: any[]) => output += Log.format(format, ...args);

		if (printComments) {
			const offset = utils.strPadLeft(bb.instructions[0].offset.toString(), 6);
			append(`// %s:%s\n`, offset, eBasicBlockType[bb.type]);
		}
		bb.instructions.forEach((instruction, i) => {
			const id = instruction.opcode;
			append(this.indentation);

			if (id > 0x7FFF) {
				append('NOT ');
			}
			const definition = this.definitionMap.get(instruction.opcode & 0x7FFF);
			output += definition.name;
			for (const param of instruction.params) {
				if (utils.isArrayParam(param.type)) {
					const a = param.value as IInstructionParamArray;
					append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
				} else {
					append(' ' + param.value);
				}
			}
			if (i < bb.instructions.length - 1) {
				append('\n');
			}
		});
		append('\n');
		this.printLine(output);
	}
}

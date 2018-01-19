import * as utils from 'utils';
import Log from 'utils/log';

import { DefinitionMap, IBasicBlock, IInstructionParamArray } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

export default class SimplePrinter {
	private definitionMap: DefinitionMap;
	constructor(definitionMap: DefinitionMap) {
		this.definitionMap = definitionMap;
	}

	printLine(line: string): void {
		Log.msg(line);
	}

	print(bb: IBasicBlock): void {
		let output = '';
		bb.instructions.forEach((instruction, i) => {
			const id = instruction.opcode;
			output += `/* ${this.padOpcodeOffset(instruction.offset)} */ ${this.opcodeIdToHex(id)}: `;

			if (id > 0x7FFF) {
				output += 'NOT ';
			}
			const definition = this.definitionMap.get(instruction.opcode & 0x7FFF);
			output += definition.name;
			for (const param of instruction.params) {
				if (utils.isArrayParam(param.type)) {
					const a = param.value as IInstructionParamArray;
					output += ` (${a.varIndex} ${a.offset} ${a.size} ${a.props})`;
				} else {
					output += ' ' + param.value;
				}
			}
			if (i < bb.instructions.length - 1) output += '\n';
		});
		output += '\n';
		this.printLine(output);
	}

	opcodeIdToHex(id: number): string {
		return utils.strPadLeft(id.toString(16).toUpperCase(), 4);
	}

	padOpcodeOffset(offset: number): string {
		return utils.strPadLeft(offset.toString(), 6);
	}

}

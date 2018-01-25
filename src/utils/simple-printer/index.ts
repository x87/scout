import * as utils from 'utils';
import Log from 'utils/log';

import { DefinitionMap, IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';
import { IInstructionParamArray } from 'common/instructions';

export default class SimplePrinter {
	private definitionMap: DefinitionMap;
	constructor(definitionMap: DefinitionMap) {
		this.definitionMap = definitionMap;
	}

	printLine(line: string): void {
		Log.msg(line);
	}

	print(bb: IBasicBlock, printComments: boolean = false): void {
		let output = printComments ? `// BB type: ${eBasicBlockType[bb.type]}\n` : '';
		bb.instructions.forEach((instruction, i) => {
			const id = instruction.opcode;
			output += printComments ? `/* ${utils.strPadLeft(instruction.offset.toString(), 6)} */ ` : ``;
			output += `${utils.opcodeToHex(id)}: `;

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

}

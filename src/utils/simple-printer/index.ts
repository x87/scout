import * as utils from 'utils';
import Log from 'utils/log';

import { DefinitionMap, IInstruction, IInstructionParamArray } from 'common/interfaces';

export default class SimplePrinter {
	private definitionMap: DefinitionMap;
	constructor(definitionMap: DefinitionMap) {
		this.definitionMap = definitionMap;
	}

	print(instruction: IInstruction): void {
		const id = instruction.opcode;
		let output = `/* ${this.padOpcodeOffset(instruction.offset)} */ ${this.opcodeIdToHex(id)}: `;

		if (instruction.isLeader) {
			output = '\n\n' + output;
		}
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
		Log.msg(output);
	}

	opcodeIdToHex(id: number): string {
		return utils.strPadLeft(id.toString(16).toUpperCase(), 4);
	}

	padOpcodeOffset(offset: number): string {
		return utils.strPadLeft(offset.toString(), 8);
	}

}

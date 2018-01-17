import * as file from 'utils/file';
import * as utils from 'utils';
import Log from 'utils/log';

import AppError from 'common/errors';
import Arguments from 'common/arguments';
import Parser from 'frontend/parser';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import ScriptFile from 'frontend/script/ScriptFile';

import { IScript, DefinitionMap } from 'common/interfaces';
import { eScriptType } from 'common/enums';
import { IInstructionDefinition } from 'common/interfaces';

interface IDefinition extends IInstructionDefinition {
	id: string;
}

export default class Disassembler {
	static getDefinitions(): Promise<DefinitionMap> {
		return file.isReadable(Arguments.opcodesFile)
			.then(() => file.loadJson<IDefinition[]>(Arguments.opcodesFile))
			.then(opcodes => {
				const map: DefinitionMap = new Map();
				opcodes.forEach(opcode => {
					map.set(utils.hexToOpcodeId(opcode.id), { name: opcode.name, params: opcode.params });
				});
				return map;
			})
			.catch(() => {
				throw Log.error(AppError.NO_OPCODE, Arguments.opcodesFile);
			});
	}

	disassemble(inputFile: ScriptFile): Promise<IScript[]> {
		return Disassembler.getDefinitions().then(definitionMap => {
			const files = [
				this.parse(inputFile.buffer, inputFile.type, inputFile.baseOffset, definitionMap)
			];
			if (inputFile instanceof ScriptMultifile) {
				return inputFile.missions.reduce((memo, mission) => {
					memo.push(this.parse(mission, eScriptType.HEADLESS, 0, definitionMap));
					return memo;
				}, files);
			}
			// todo; external scripts
			return files;
		});
	}

	private parse(data: Buffer, type: eScriptType, base: number, definitionMap: DefinitionMap): IScript {
		const parser = new Parser(definitionMap, data, 0);

		const script: IScript = {
			instructionMap: new Map(),
			type
		};

		let firstOpcode = true;
		for (const instruction of parser) {
			instruction.offset += base;
			if (firstOpcode) {
				instruction.isHeader = true;
				instruction.isLeader = true;
				firstOpcode = false;
			}
			script.instructionMap.set(instruction.offset, instruction);
		}
		return script;
	}

}

import * as file from 'utils/file';
import * as utils from 'utils';
import Log from 'utils/log';

import AppError from 'common/errors';
import Arguments from 'common/arguments';
import Parser from 'frontend/parser';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import ScriptFile from 'frontend/script/ScriptFile';

import { IScript, IOpcode, OpcodeMap, IOpcodeParamArray } from 'common/interfaces';
import { eScriptType } from 'common/enums';
import { IOpcodeData } from 'common/interfaces';

interface IOpcodeDefinition extends IOpcodeData {
	id: string;
}

export default class Disassembler {
	private parser: Parser;
	private opcodes: OpcodeMap;

	disassemble(inputFile: ScriptFile): Promise<IScript[]> {
		return this.getOpcodes().then(opcodes => {
			this.opcodes = opcodes;

			const files = [
				this.getScriptFromBuffer(inputFile.baseOffset, inputFile.type, inputFile.buffer)
			];
			if (inputFile instanceof ScriptMultifile) {
				return inputFile.missions.reduce((memo, mission) => {
					memo.push(this.getScriptFromBuffer(0, eScriptType.HEADLESS, mission));
					return memo;
				}, files);
			}
			// todo; external scripts
			return files;

		});
	}

	printOpcode(opcode: IOpcode): void {
		const id = opcode.id;
		const info = this.opcodes.get(id & 0x7FFF);
		let output = `/* ${this.padOpcodeOffset(opcode.offset)} */ ${this.opcodeIdToHex(id)}: `;

		if (opcode.isLeader) {
			output = '\n\n' + output;
		}
		if (id > 0x7FFF) {
			output += 'NOT ';
		}
		output += info.name;
		for (const param of opcode.params) {
			if (utils.isArrayParam(param.type)) {
				const a = param.value as IOpcodeParamArray;
				output += ` (${a.varIndex} ${a.offset} ${a.size} ${a.props})`;
			} else {
				output += ' ' + param.value;
			}
		}
		Log.msg(output);
	}

	private getOpcodes(): Promise<OpcodeMap> {
		if (this.opcodes) return Promise.resolve(this.opcodes);

		return file.isReadable(Arguments.opcodesFile)
			.then(() => file.loadJson<IOpcodeDefinition[]>(Arguments.opcodesFile))
			.then(opcodes => {
				const map: OpcodeMap = new Map();
				opcodes.forEach(opcode => {
					map.set(this.hexToOpcodeId(opcode.id), { name: opcode.name, params: opcode.params });
				});
				return map;
			})
			.catch(() => {
				throw Log.error(AppError.NO_OPCODE, Arguments.opcodesFile);
			});
	}

	private getScriptFromBuffer(base: number, type: eScriptType, data: Buffer): IScript {
		const parser = new Parser(this.opcodes, data, 0);

		const script: IScript = {
			opcodes: new Map(),
			type
		};

		let firstOpcode = true;
		for (const opcode of parser) {
			opcode.offset += base;
			if (firstOpcode) {
				opcode.isHeader = true;
				opcode.isLeader = true;
				firstOpcode = false;
			}
			script.opcodes.set(opcode.offset, opcode);
		}
		return script;
	}

	private opcodeIdToHex(id: number): string {
		return utils.strPadLeft(id.toString(16).toUpperCase(), 4);
	}

	private hexToOpcodeId(id: string): number {
		return parseInt(id, 16);
	}

	private padOpcodeOffset(offset: number): string {
		return utils.strPadLeft(offset.toString(), 8);
	}

}

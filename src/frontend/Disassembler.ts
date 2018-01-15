import * as file from 'utils/file';
import * as utils from 'utils';
import Log from 'utils/Log';

import AppError from 'common/errors';
import Arguments from 'common/arguments';
import Parser from './Parser';
import ScriptMultifile from './script/ScriptMultifile';
import ScriptFile from './script/ScriptFile';

import { IScript, IOpcode, IOpcodeData, IOpcodeParamArray } from 'common/interfaces';
import { eScriptType } from 'common/enums';

export default class Disassembler {
	private parser: Parser;
	private opcodesData: IOpcodeData[];

	disassemble(inputFile: ScriptFile): Promise<IScript[]> {
		return this.getOpcodes().then(opcodes => {
			this.opcodesData = opcodes;

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
		const info = this.opcodesData[id & 0x7FFF];
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

	private getOpcodes(): Promise<IOpcodeData[]> {
		if (this.opcodesData) return Promise.resolve(this.opcodesData);

		return file.isReadable(Arguments.opcodesFile)
			.then(() => file.loadText(Arguments.opcodesFile))
			.then((opcodesData: string) => JSON.parse(opcodesData))
			.catch(() => {
				throw Log.error(AppError.NO_OPCODE, Arguments.opcodesFile);
			});
	}

	private getScriptFromBuffer(base: number, type: eScriptType, data: Buffer): IScript {
		const parser = new Parser(this.opcodesData, data, 0);

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

	private opcodeIdToHex(id) {
		return utils.strPadLeft(id.toString(16).toUpperCase(), 4);
	}

	private padOpcodeOffset(offset) {
		return utils.strPadLeft(offset, 8);
	}

}

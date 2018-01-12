import * as file from 'utils/file';
import * as utils from 'utils';
import Log from 'utils/Log';
import Paths from 'common/paths';
import AppError from 'common/errors';

import COpcodeParser from './OpcodeParser';
import CScriptFileSCM from './CScriptFileSCM';
import CScriptFile from './ScriptFile';

import { ICompiledFile, IOpcode, IOpcodeData, IOpcodeParamArray } from 'common/interfaces';
import { eCompiledFileType } from 'common/enums';

export default class CDisassembler {
	opcodesData: IOpcodeData[];
	readonly opcodeParser: COpcodeParser;

	constructor() {
		this.opcodeParser = new COpcodeParser();
	}

	disassemble(scriptFile: CScriptFile) {
		const files: ICompiledFile[] = [];
		files[files.length] = this.parseBuffer(scriptFile.baseOffset, scriptFile.type, scriptFile.mainData);

		if (scriptFile instanceof CScriptFileSCM) {
			for (let i = 0, len = scriptFile.missionsData.length; i < len; i += 1) {
				files[files.length] = this.parseBuffer(0, eCompiledFileType.MISSION, scriptFile.missionsData[i]);
			}
		}
		// todo; external data
		return files;
	}

	printOpcode(opcode: IOpcode) {
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

	loadOpcodeData(): Promise<any> {
		return file.isReadable(Paths.opcodesFile)
			.then(() => file.loadText(Paths.opcodesFile))
			.then((opcodesData: any) => {
				const data = JSON.parse(opcodesData);
				this.opcodeParser.opcodesData = data;
				this.opcodesData = data;
			})
			.catch(() => {
				throw Log.error(AppError.ERRNOOP, Paths.opcodesFile);
			});
	}

	private parseBuffer(base: number, type: eCompiledFileType, data: Buffer) {
		this.opcodeParser.data = data;
		this.opcodeParser.offset = 0;

		const compiledFile = {
			opcodes: new Map(),
			type
		} as ICompiledFile;

		let firstOpcode = true;
		for (const opcode of this.opcodeParser) {
			opcode.offset += base;
			if (firstOpcode) {
				opcode.isHeader = true;
				opcode.isLeader = true;
				firstOpcode = false;
			}
			compiledFile.opcodes.set(opcode.offset, opcode);
		}
		return compiledFile;
	}

	private opcodeIdToHex(id) {
		return utils.strPadLeft(id.toString(16).toUpperCase(), 4);
	}

	private padOpcodeOffset(offset) {
		return utils.strPadLeft(offset, 8);
	}

}

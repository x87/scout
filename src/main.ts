import * as utils from './utils';
import * as file from './utils/file';
import Log from 'utils/log';
import Arguments from 'common/arguments';
import AppError from 'common/errors';
import SimplePrinter from './utils/simple-printer';

import Loader from 'frontend/loader';
import Parser from './frontend/parser';
import CFG from 'frontend/cfg';

import { DefinitionMap } from './common/interfaces';
import { IInstructionDefinition } from 'common/interfaces';

interface IDefinition extends IInstructionDefinition {
	id: string;
}

async function getDefinitions(): Promise<DefinitionMap> {
	try {
		const opcodes = await file.loadJson<IDefinition[]>(Arguments.opcodesFile);
		const map: DefinitionMap = new Map();
		opcodes.forEach(opcode => {
			map.set(utils.hexToOpcodeId(opcode.id), { name: opcode.name, params: opcode.params });
		});
		return map;
	} catch {
		throw Log.error(AppError.NO_OPCODE, Arguments.opcodesFile);
	}
}

export async function main(): Promise<void> {
	if (!Arguments.inputFile) {
		throw Log.error(AppError.NO_INPUT);
	}

	const loader = new Loader();
	const scriptFile = await loader.loadScript(Arguments.inputFile);
	const definitionMap = await getDefinitions();
	const parser = new Parser(definitionMap);
	const scripts = await parser.parse(scriptFile);
	const graph = new CFG(scripts);
	if (Arguments.printAssembly === true) {
		const printer = new SimplePrinter(definitionMap);
		scripts.forEach(async script => {
			for (const [offset, instruction] of script.instructionMap) {
				printer.print(instruction);
			}
		});
	}
}

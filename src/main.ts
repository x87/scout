import * as utils from './utils';
import * as file from './utils/file';
import * as graphUtils from './frontend/cfg/graph-utils';
import Log from 'utils/log';
import Arguments from 'common/arguments';
import AppError from 'common/errors';
import SimplePrinter from './utils/printer/SimplePrinter';

import Loader from 'frontend/loader';
import Parser from './frontend/parser';
import CFG from 'frontend/cfg';

import { DefinitionMap, IBasicBlock } from './common/interfaces';
import { IInstructionDefinition } from 'common/instructions';

interface IDefinition extends IInstructionDefinition {
	id: string;
}

async function getDefinitions(): Promise<DefinitionMap> {
	try {
		const definitions = await file.loadJson<IDefinition[]>(Arguments.definitionFile);
		const map: DefinitionMap = new Map();
		definitions.forEach(definition => {
			const { name, params } = definition;
			map.set(utils.hexToOpcode(definition.id), { name, params });
		});
		return map;
	} catch {
		throw Log.error(AppError.NO_OPCODE, Arguments.definitionFile);
	}
}

export async function main(): Promise<void> {
	const loader = new Loader();
	const scriptFile = await loader.loadScript(Arguments.inputFile);
	const definitionMap = await getDefinitions();
	const parser = new Parser(definitionMap);
	const scripts = await parser.parse(scriptFile);

	if (Arguments.printAssembly === true) {
		const printer = new SimplePrinter(definitionMap);
		scripts.forEach(script => {
			const cfg = new CFG();
			const graphs = cfg.getCallGraphs(script);
			graphs.forEach((graph, i) => {
				if (Arguments.debugMode) {
					printer.printLine(`--- Function ${i} Start----\n`);
				}
				for (const bb of graph.nodes) {
					printer.print(bb as IBasicBlock, Arguments.debugMode);
				}
				if (Arguments.debugMode) {
					printer.printLine(`--- Function ${i} End----`);
				}
			});
		});

		if (Arguments.debugMode) {
			scripts.forEach(script => {
				const cfg = new CFG();
				const callGraphs = cfg.getCallGraphs(script);
				const functions = callGraphs.map(graphUtils.reduce);

			});
		}
	}
}

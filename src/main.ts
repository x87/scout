import * as utils from './utils';
import * as file from './utils/file';
import * as graphUtils from './frontend/cfg/graph-utils';
import * as loopUtils from './frontend/cfg/loop-utils';
import Log from 'utils/log';
import Arguments from 'common/arguments';
import AppError from 'common/errors';
import SimplePrinter from './utils/printer/SimplePrinter';

import Loader from 'frontend/loader';
import Parser from './frontend/parser';
import CFG from 'frontend/cfg';

import { DefinitionMap, IBasicBlock } from './common/interfaces';
import { IInstructionDefinition } from 'common/instructions';
import { LoopGraph } from './frontend/cfg/loop-utils';
import Graph from './frontend/cfg/graph';
import { eLoopType } from './common/enums';

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
			printer.printLine(`--- Structured print ---\n`);
			scripts.forEach(script => {
				const cfg = new CFG();
				const functions = cfg.getCallGraphs(script);
				functions.forEach((func, i) => {
					if (Arguments.debugMode) {
						printer.printLine(`--- Function ${i} Start----\n`);
					}
					const printGraph = (graph: Graph<IBasicBlock>) => {
						for (const bb of graph.nodes) {
							if (bb instanceof LoopGraph) {
								printer.printLine(`--- Loop ${eLoopType[bb.type]} Start----\n`);
								printGraph(bb);
								printer.printLine(`--- Loop ${eLoopType[bb.type]} End----\n`);
							} else {
								printer.print(bb as IBasicBlock, Arguments.debugMode);
							}
						}
					};
					printGraph(loopUtils.structure(func));
					if (Arguments.debugMode) {
						printer.printLine(`--- Function ${i} End----`);
					}
				});

			});
		}
	}
}

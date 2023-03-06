import * as utils from './utils';
import * as file from './utils/file';
import * as loopUtils from './frontend/cfg/loop-utils';
import * as conditionUtils from './frontend/cfg/conditions-utils';
import Log from './utils/log';
import Arguments from './common/arguments';
import AppError from './common/errors';

import Loader from './frontend/loader';
import Parser from './frontend/parser';
import CFG from './frontend/cfg';

import { DefinitionMap, IBasicBlock } from './common/interfaces';
import { IInstructionDefinition } from './common/instructions';
import {  } from './frontend/cfg/loop-utils';
import  { Graph, GraphNode, LoopGraph, IfGraph } from './frontend/cfg/graph';
import { eLoopType } from './common/enums';
import ExpressionPrinter from './utils/printer/ExpressionPrinter';

interface IDefinition extends IInstructionDefinition {
  id: string;
}

async function getDefinitions(): Promise<DefinitionMap> {
  try {
    const definitions = await file.loadJson<IDefinition[]>(
      Arguments.definitionFile
    );
    const map: DefinitionMap = new Map();
    definitions.forEach((definition) => {
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
    const printer = new ExpressionPrinter(definitionMap);
    scripts.forEach((script) => {
      const cfg = new CFG();
      const funcs = cfg.getCallGraphs(script, scripts);
      funcs.forEach((func, i) => {
        if (Arguments.debugMode) {
          printer.printLine(`--- Function ${i} Start----\n`);
        }
        for (const bb of func.nodes) {
          printer.print(bb as IBasicBlock, Arguments.debugMode);
        }
        if (Arguments.debugMode) {
          printer.printLine(`--- Function ${i} End----`);
        }
      });
    });

    if (Arguments.debugMode) {
      scripts.forEach((script) => {
        const cfg = new CFG();
        const functions = cfg.getCallGraphs(script, scripts);
        functions.forEach((func, i) => {
          if (Arguments.debugMode) {
            printer.printLine('\n');
            printer.printLine(`function () {`);
            printer.indent++;
          }
          const printGraph = (graph: Graph<GraphNode<IBasicBlock>>) => {
            for (const bb of graph.nodes) {
              if (bb instanceof LoopGraph) {
                printer.printLine(
                  `${printer.indentation}${
                    bb.type === eLoopType.POST_TESTED ? 'repeat' : 'while'
                  } {`
                );
                printer.indent++;
                printGraph(bb);
                printer.indent--;
                printer.printLine(
                  `${printer.indentation}}${
                    bb.type === eLoopType.POST_TESTED ? 'until' : ''
                  }`
                );
              } else if (bb instanceof IfGraph) {
                printer.printLine(`${printer.indentation}if`);
                printer.indent++;
                printer.print(bb.nodes[0]);
                printer.printLine(`${printer.indentation}then {`);
                printer.indent++;
                printGraph(bb.thenNode);
                printer.indent--;
                printer.printLine(`${printer.indentation}}`);
                if (bb.elseNode) {
                  printer.printLine(`${printer.indentation}else {`);
                  printer.indent++;
                  printGraph(bb.elseNode);
                  printer.indent--;
                  printer.printLine(`${printer.indentation}}`);
                }
                printer.indent--;
                printer.printLine(`${printer.indentation}}`);
              } else {
                printer.print(bb as IBasicBlock, Arguments.debugMode);
              }
            }
          };
          try {
            const loopGraph = loopUtils.structure(func);
            const ifGraph = conditionUtils.structure(loopGraph);
            printGraph(ifGraph);
          } catch (e) {
            console.log(e);
            printer.printLine(`// can't structure this function\n`);
            printer.printLine(`--- Function ${i} Start----\n`);
            for (const bb of func.nodes) {
              printer.print(bb as IBasicBlock, Arguments.debugMode);
            }
            printer.printLine(`--- Function ${i} End----`);
          }
          if (Arguments.debugMode) {
            printer.indent--;
            printer.printLine(`}`);
          }
        });
      });
    }
  }
}

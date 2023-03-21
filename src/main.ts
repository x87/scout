import Arguments from './common/arguments';
import AppError from './common/errors';
import * as conditionUtils from './frontend/cfg/conditions-utils';
import * as loopUtils from './frontend/cfg/loop-utils';
import * as utils from './utils';
import * as file from './utils/file';
import Log from './utils/log';
import CFG from './frontend/cfg';
import Loader from './frontend/loader';
import Parser from './frontend/parser';
import { eLoopType } from './common/enums';
import { IInstructionDefinition } from './common/instructions';
import { DefinitionMap, IBasicBlock } from './common/interfaces';
import {
  getOffset,
  Graph,
  GraphNode,
  IfGraph,
  LoopGraph,
} from './frontend/cfg/graph';
import ExpressionPrinter from './utils/printer/ExpressionPrinter';
import * as graphUtils from 'frontend/cfg/graph-utils';

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
  const printer = new ExpressionPrinter(definitionMap);

  scripts.forEach((script) => {
    const cfg = new CFG();
    const functions = cfg.getCallGraphs(script, scripts).sort((a, b) => {
      return getOffset(a) - getOffset(b);
    });
    functions.forEach((func, i) => {
      const offset = getOffset(func);
      const name = offset === 0 ? script.name : `${script.name}_${offset}`;
      printer.printLine(`\n:${name.toUpperCase()}`);
      printer.indent++;

      if (Arguments.printAssembly === true) {
        for (const bb of func.nodes) {
          printer.print(bb as IBasicBlock);
        }
      }

      const printGraph = (graph: Graph<GraphNode<IBasicBlock>>) => {
        for (const bb of graph.nodes) {
          if (bb instanceof LoopGraph) {
            printer.printLine('');
            switch (bb.type) {
              case eLoopType.PRE_TESTED: {
                printer.printLine(
                  `while ${printer.stringifyCondition(bb.condition)}`
                );
                printer.indent++;
                const g = graphUtils.from(bb);
                g.nodes.splice(0, 1);
                printGraph(g);
                printer.indent--;
                printer.printLine('end');
                break;
              }
              case eLoopType.POST_TESTED: {
                printer.printLine(`repeat`);
                printer.indent++;
                const g = graphUtils.from(bb);
                g.nodes.splice(g.nodes.length - 1, 1);
                printGraph(g);
                printer.indent--;
                printer.printLine(
                  `until ${printer.stringifyCondition(bb.condition)}`
                );
                break;
              }
              case eLoopType.ENDLESS:
                printer.printLine(`while true`);
                printer.indent++;
                printGraph(bb);
                printer.indent--;
                printer.printLine('end');
                break;
            }
            printer.printLine('');
          } else if (bb instanceof IfGraph) {
            printer.printLine(`if ${bb.ifNumber || ''}`);
            printer.indent++;
            printer.print(bb.nodes[0]);
            printer.indent--;
            printer.printLine(`then`);
            printer.indent++;
            printGraph(bb.thenNode);
            printer.indent--;
            if (bb.elseNode) {
              printer.printLine(`else`);
              printer.indent++;
              printGraph(bb.elseNode);
              printer.indent--;
            }
            printer.printLine(`end`);
          } else {
            bb && printer.print(bb as IBasicBlock, Arguments.debugMode);
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
          printer.print(bb as IBasicBlock);
        }
        printer.printLine(`--- Function ${i} End----`);
      }

      printer.indent--;
    });
  });
}

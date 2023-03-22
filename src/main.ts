import { GLOBAL_OPTIONS } from './common/arguments';

import * as conditionUtils from './frontend/cfg/conditions-utils';
import * as loopUtils from './frontend/cfg/loop-utils';
import CFG from './frontend/cfg';
import Loader from './frontend/loader';
import Parser from './frontend/parser';
import { eLoopType } from './common/enums';
import { IBasicBlock, IScript } from './common/interfaces';
import {
  getOffset,
  Graph,
  GraphNode,
  IfGraph,
  LoopGraph,
} from './frontend/cfg/graph';
import ExpressionPrinter from './utils/printer/ExpressionPrinter';
import * as graphUtils from 'frontend/cfg/graph-utils';
import { getDefinitions } from './definitions';

function print(
  functions: Graph<IBasicBlock>[],
  printer: ExpressionPrinter,
  script: IScript
) {
  functions.forEach((func, i) => {
    const offset = getOffset(func);
    const name = offset === 0 ? script.name : `${script.name}_${offset}`;
    printer.printLine(`\n:${name.toUpperCase()}`);
    printer.indent++;

    if (GLOBAL_OPTIONS.printAssembly === true) {
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
          bb && printer.print(bb as IBasicBlock, GLOBAL_OPTIONS.debugMode);
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
}

export async function main(inputFile: Promise<DataView>): Promise<void> {
  const loader = new Loader();
  const scriptFile = await loader.loadScript(inputFile);
  const definitionMap = await getDefinitions();
  const parser = new Parser(definitionMap);
  const scripts = await parser.parse(scriptFile);
  const printer = new ExpressionPrinter(definitionMap);

  scripts.forEach((script) => {
    const cfg = new CFG();
    const functions = cfg.getCallGraphs(script, scripts).sort((a, b) => {
      return getOffset(a) - getOffset(b);
    });
    print(functions, printer, script);
  });
}

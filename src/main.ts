import * as utils from './utils';
import * as file from './utils/file';
import * as loopUtils from './frontend/cfg/loop-utils';
import * as conditionUtils from './frontend/cfg/conditions-utils';
import Log from './utils/log';
import Arguments from './common/arguments';
import AppError from './common/errors';
import { inspect } from 'util';

import Loader from './frontend/loader';
import Parser from './frontend/parser';
import CFG from './frontend/cfg';

import { DefinitionMap, IBasicBlock } from './common/interfaces';
import { IInstructionDefinition } from './common/instructions';
import { AST } from './ast';

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
  const scripts = parser.parse(scriptFile);

  if (Arguments.printAssembly === true) {
    scripts.forEach((script, scrIndex) => {
      const cfg = new CFG();
      const ast = new AST({
        name: 'script' + scrIndex,
        body: cfg.getCallGraphs(script).map((func, i) => {
          const fnName =
            'fn_' + (func.root as IBasicBlock).instructions[0].offset;
          try {
            const loopGraph = loopUtils.structure(func);
            const ifGraph = conditionUtils.structure(loopGraph);
            return {
              type: 'function',
              name: fnName,
              body: AST.transform(ifGraph),
            };
          } catch {
            return {
              type: 'function',
              name: fnName,
              body: AST.transform(func),
            };
          }
        }),
      });
      console.log(inspect(ast, { depth: 20 }));
    });
  }
}

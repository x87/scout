import * as utils from '../index';
import {Log} from '../log';

import { DefinitionMap, IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';
import { IInstructionParamArray } from 'common/instructions';

export class SimplePrinter {
  protected definitionMap: DefinitionMap;

  constructor(definitionMap: DefinitionMap) {
    this.definitionMap = definitionMap;
  }

  printLine(line: string): void {
    Log.msg(line);
  }

  print(bb: IBasicBlock, printComments: boolean = false): void {
    let output = '';

    const append = (format: string, ...args: any[]) =>
      (output += Log.format(format, ...args));

    if (printComments) {
      append(`// BB type: %s\n`, eBasicBlockType[bb.type]);
    }
    bb.instructions.forEach((instruction, i) => {
      const id = instruction.opcode;
      if (printComments) {
        append(`/* %s */ `, utils.strPadLeft(instruction.offset.toString(), 6));
      }
      append(`%s: `, utils.opcodeToHex(id));

      if (id > 0x7fff) {
        append('NOT ');
      }
      const definition = this.definitionMap.get(instruction.opcode & 0x7fff);
      output += definition.name;
      for (const param of instruction.params) {
        if (utils.isArrayParam(param.type)) {
          const a = param.value as IInstructionParamArray;
          append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
        } else {
          append(' ' + param.value);
        }
      }
      if (i < bb.instructions.length - 1) {
        append('\n');
      }
    });
    append('\n');
    this.printLine(output);
  }
}

import SimplePrinter from './SimplePrinter';
import * as utils from '../index';
import { DefinitionMap, IBasicBlock } from 'common/interfaces';
import { IInstructionParamArray } from 'common/instructions';
import Log from '../log';

export default class ExpressionPrinter extends SimplePrinter {
  indent: number;

  constructor(definitionMap: DefinitionMap) {
    super(definitionMap);
    this.indent = 0;
  }

  get indentation(): string {
    return utils.strPadLeft('', this.indent, '\t');
  }

  printLine(line: string): void {
    Log.msg(this.indentation + line);
  }

  print(bb: IBasicBlock, printComments: boolean = false): void {
    let output = '';

    const append = (format: string, ...args: any[]) =>
      (output += Log.format(format, ...args));

    if (printComments && bb.instructions.length) {
      const offset = utils.strPadLeft(bb.instructions[0].offset.toString(), 6);
      // append(`// %s:%s\n`, offset, eBasicBlockType[bb.type]);
    }
    bb.instructions.forEach((instruction, i) => {
      const id = instruction.opcode;

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
      this.printLine(output);
      output = '';
    });

  }
}

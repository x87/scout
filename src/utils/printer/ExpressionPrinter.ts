import SimplePrinter from './SimplePrinter';
import * as utils from '../index';
import { DefinitionMap, IBasicBlock } from 'common/interfaces';
import { IInstructionParamArray } from 'common/instructions';
import Log from '../log';
import { OP_IF, OP_JF, OP_JMP } from 'frontend/cfg';
import { GLOBAL_OPTIONS } from 'common/arguments';
import { eBasicBlockType } from 'common/enums';

export default class ExpressionPrinter extends SimplePrinter {
  indent: number;

  constructor(definitionMap: DefinitionMap) {
    super(definitionMap);
    this.indent = 0;
  }

  get indentation(): string {
    return utils.strPadLeft('', this.indent * 4, ' ');
  }

  printLine(line: string): void {
    Log.msg(this.indentation + line);
  }

  print(bb: IBasicBlock, printComments: boolean = false): void {
    let output = '';

    const append = (format: string, ...args: any[]) =>
      (output += Log.format(format, ...args));

    if (bb.type === eBasicBlockType.BREAK) {
      this.printLine('break');
      return;
    }
    if (printComments && bb.instructions.length) {
      const offset = utils.strPadLeft(bb.instructions[0]?.offset.toString(), 6);
      // append(`// %s:%s\n`, offset, eBasicBlockType[bb.type]);
    }
    bb.instructions.forEach((instruction) => {
      const id = instruction.opcode;

      if (id > 0x7fff) {
        append('NOT ');
      }
      if (!GLOBAL_OPTIONS.debugMode && [OP_JF, OP_IF].includes(id)) {
        return;
      }
      if (
        !GLOBAL_OPTIONS.debugMode &&
        id === OP_JMP &&
        bb.type !== eBasicBlockType.UNSTRUCTURED
      ) {
        return;
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

  stringifyCondition(bb: IBasicBlock): string {
    this.indent++;
    const result = bb.instructions
      .map(({ opcode, params }) => {
        let output = '';

        const append = (format: string, ...args: any[]) =>
          (output += Log.format(format, ...args));

        const id = opcode;

        if (id > 0x7fff) {
          append('NOT ');
        }
        if ([OP_JF, OP_IF, OP_JMP].includes(id)) {
          return '';
        }
        const definition = this.definitionMap.get(opcode & 0x7fff);
        append(definition.name);
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          if (utils.isArrayParam(param.type)) {
            const a = param.value as IInstructionParamArray;
            append(`(%s %s %s %s)`, a.varIndex, a.offset, a.size, a.props);
          } else {
            append(' ' + param.value);
          }
        }
        return output;
      })
      .filter(Boolean)
      .join(`\n${this.indentation}`);

    this.indent--;

    return result;
  }
}

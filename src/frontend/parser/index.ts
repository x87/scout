import * as utils from 'utils';
import Log from 'utils/log';
import AppError from 'common/errors';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';

import { eParamType } from 'common/enums';
import { DefinitionMap, IScript } from 'common/interfaces';
import {
  getString8Param,
  IInstruction,
  IInstructionParam,
  IInstructionParamArray,
  InstructionMap,
} from 'common/instructions';

export const PARAM_ANY = 'any';
export const PARAM_ARGUMENTS = 'arguments';
export const PARAM_LABEL = 'label';

export default class Parser {
  private data: Buffer;
  private offset: number;
  private readonly definitionMap: DefinitionMap;
  private readonly paramTypesHandlers: any;
  private readonly paramValuesHandlers: any;

  private nonameCounter = 0;

  constructor(definitionMap: DefinitionMap) {
    this.definitionMap = definitionMap;

    this.paramValuesHandlers = {
      [eParamType.NUM8]: () => this.nextInt8(),
      [eParamType.NUM16]: () => this.nextInt16(),
      [eParamType.NUM32]: () => this.nextInt32(),
      [eParamType.FLOAT]: () => this.getFloat(),
      [eParamType.STR]: () => this.getString(this.nextUInt8()),
      [eParamType.STR8]: () => this.getString(8),
      [eParamType.STR16]: () => this.getString(16),
      [eParamType.STR128]: () => this.getString(128),
      [eParamType.GVARNUM32]: () => this.nextUInt16(),
      [eParamType.LVARNUM32]: () => this.nextUInt16(),
      [eParamType.GVARSTR8]: () => this.nextUInt16(),
      [eParamType.LVARSTR8]: () => this.nextUInt16(),
      [eParamType.GVARSTR16]: () => this.nextUInt16(),
      [eParamType.LVARSTR16]: () => this.nextUInt16(),
      [eParamType.GARRNUM32]: () => this.getArray(),
      [eParamType.LARRNUM32]: () => this.getArray(),
      [eParamType.GARRSTR8]: () => this.getArray(),
      [eParamType.LARRSTR8]: () => this.getArray(),
      [eParamType.GARRSTR16]: () => this.getArray(),
      [eParamType.LARRSTR16]: () => this.getArray(),
    };

    this.paramTypesHandlers = [...Array(256)].map((v, i) => {
      switch (i) {
        case 0:
          return () => eParamType.EOL;
        case 1:
          return () => eParamType.NUM32;
        case 2:
          return () => eParamType.GVARNUM32;
        case 3:
          return () => eParamType.LVARNUM32;
        case 4:
          return () => eParamType.NUM8;
        case 5:
          return () => eParamType.NUM16;
        case 6:
          return () => eParamType.FLOAT;
        case 7:
          if (utils.isGameSA()) {
            return () => eParamType.GARRNUM32;
          }
        case 8:
          if (utils.isGameSA()) {
            return () => eParamType.LARRNUM32;
          }
        case 9:
          if (utils.isGameSA()) {
            return () => eParamType.STR8;
          }
        case 0xa:
          if (utils.isGameSA()) {
            return () => eParamType.GVARSTR8;
          }
        case 0xb:
          if (utils.isGameSA()) {
            return () => eParamType.LVARSTR8;
          }
        case 0xc:
          if (utils.isGameSA()) {
            return () => eParamType.GARRSTR8;
          }
        case 0xd:
          if (utils.isGameSA()) {
            return () => eParamType.LARRSTR8;
          }
        case 0xe:
          if (utils.isGameSA()) {
            return () => eParamType.STR;
          }
        case 0xf:
          if (utils.isGameSA()) {
            return () => eParamType.STR16;
          }
        case 0x10:
          if (utils.isGameSA()) {
            return () => eParamType.GVARSTR16;
          }
        case 0x11:
          if (utils.isGameSA()) {
            return () => eParamType.LVARSTR16;
          }
        case 0x12:
          if (utils.isGameSA()) {
            return () => eParamType.GARRSTR16;
          }
        case 0x13:
          if (utils.isGameSA()) {
            return () => eParamType.LARRSTR16;
          }
        default:
          if (utils.isGameSA()) {
            return () => {
              this.offset--;
              return eParamType.STR128;
            };
          } else {
            return () => {
              this.offset--;
              return eParamType.STR8;
            };
          }
      }
    });
  }

  parse(scriptFile: ScriptFile): IScript[] {
    const main: IScript = {
      instructionMap: this.getInstructions(scriptFile),
      type: scriptFile.type,
      name: scriptFile.name || 'noname_' + this.nonameCounter++,
    };
    const scripts = [main];
    if (scriptFile instanceof ScriptMultifile) {
      for (const script of scriptFile.scripts) {
        scripts.push(this.parse(script)[0]);
      }
    }
    return scripts;
  }

  getInstructions(scriptFile: ScriptFile): InstructionMap {
    const map: InstructionMap = new Map();
    this.offset = 0;
    this.data = scriptFile.buffer;
    for (const instruction of this) {
      instruction.offset += scriptFile.baseOffset;
      map.set(instruction.offset, instruction);

      // todo: SCRIPT_NAME opcode
      if (instruction.opcode === 0x03a4) {
        scriptFile.name ??= getString8Param(instruction);
      }
    }
    return map;
  }

  [Symbol.iterator](): Iterator<IInstruction> {
    const self = this;
    return {
      next(): IteratorResult<IInstruction> {
        if (self.offset >= self.data.length) {
          return { value: undefined, done: true };
        }

        return {
          value: self.getInstruction(),
          done: false,
        };
      },
    };
  }

  private nextUInt8(): number {
    let result: number;
    try {
      result = this.data.readUInt8(this.offset);
      this.offset += 1;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 1);
    }
    return result;
  }

  private nextInt8(): number {
    let result: number;
    try {
      result = this.data.readInt8(this.offset);
      this.offset += 1;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 1);
    }
    return result;
  }

  private nextUInt16(): number {
    let result: number;
    try {
      result = this.data.readUInt16LE(this.offset);
      this.offset += 2;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 2);
    }
    return result;
  }

  private nextInt16(): number {
    let result: number;
    try {
      result = this.data.readInt16LE(this.offset);
      this.offset += 2;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 2);
    }
    return result;
  }

  private nextUInt32(): number {
    let result: number;
    try {
      result = this.data.readUInt32LE(this.offset);
      this.offset += 4;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 4);
    }
    return result;
  }

  private nextInt32(): number {
    let result: number;
    try {
      result = this.data.readInt32LE(this.offset);
      this.offset += 4;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 4);
    }
    return result;
  }

  private nextFloat(): number {
    let result: number;
    try {
      result = this.data.readFloatLE(this.offset);
      this.offset += 4;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, 4);
    }
    return result;
  }

  private getFloat(): number {
    if (utils.isGameGTA3()) {
      const val = this.nextInt16();
      return val / 16.0;
    }
    return this.nextFloat();
  }

  private getString(length: number): string {
    let result: string;
    try {
      result = this.data
        .toString('utf8', this.offset, this.offset + length)
        .split('\0')
        .shift();
      this.offset += length;
    } catch {
      throw Log.error(AppError.END_OF_BUFFER, length);
    }
    return result;
  }

  private getArray(): IInstructionParamArray {
    return {
      offset: this.nextUInt16(),
      varIndex: this.nextUInt16(),
      size: this.nextUInt8(),
      props: this.nextUInt8(),
    };
  }

  private getInstruction(): IInstruction {
    const offset = this.offset;
    const opcode = this.nextUInt16();
    return {
      opcode,
      offset,
      params: this.getInstructionParams(opcode),
    };
  }

  private getParamType(): eParamType {
    const dataType = this.nextUInt8();
    return this.paramTypesHandlers[dataType]();
  }

  private getInstructionParams(opcode: number): IInstructionParam[] {
    const params = [];
    const definition = this.definitionMap.get(opcode & 0x7fff);

    if (!definition || !definition.params) {
      throw Log.error(AppError.NO_PARAM, definition, this.offset);
    }

    definition.params.forEach((opcodeParam) => {
      while (true) {
        const paramType = this.getParamType();

        if (paramType === eParamType.EOL) {
          if (opcodeParam.type !== PARAM_ARGUMENTS) {
            throw Log.error(AppError.UNKNOWN_PARAM, paramType, this.offset);
          }
          return params;
        }
        params.push(this.getParam(paramType));
        if (opcodeParam.type !== PARAM_ARGUMENTS) {
          break;
        }
      }
    });

    return params;
  }

  private getParam(paramType: eParamType): IInstructionParam {
    return {
      type: paramType,
      value: this.paramValuesHandlers[paramType](),
    };
  }
}

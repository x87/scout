import { GLOBAL_OPTIONS } from 'common/arguments';
import { eGame } from 'common/enums';
import { DefinitionMap } from 'common/interfaces';
import * as file from './utils/file';
import * as utils from './utils';
import AppError from './common/errors';
import Log from './utils/log';
import { isBrowser } from 'browser-or-node';

export interface Attr {
  is_branch: boolean;
  is_segment: boolean;
  is_keyword: boolean;
  is_condition: boolean;
  is_nop: boolean;
  is_unsupported: boolean;
  is_constructor: boolean;
  is_destructor: boolean;
  is_static: boolean;
  is_overload: boolean;
}

export type Attribute = keyof Attr;

export enum PrimitiveType {
  any = 'any',
  arguments = 'arguments',
  boolean = 'bool',
  float = 'float',
  int = 'int',
  label = 'label',
  string = 'string',
  string128 = 'string128',
  gxt_key = 'gxt_key',
  zone_key = 'zone_key',
  model_any = 'model_any',
  model_char = 'model_char',
  model_object = 'model_object',
  model_vehicle = 'model_vehicle',
  int_script_id = 'script_id',
  vector3 = 'Vector3',
}

export const CommandAttributes: Attribute[] = [
  'is_branch',
  'is_condition',
  'is_constructor',
  'is_destructor',
  'is_keyword',
  'is_nop',
  'is_overload',
  'is_segment',
  'is_static',
  'is_unsupported',
];

export interface Param {
  type: string;
  name: string;
  source: string;
}

export interface Command {
  id: string;
  name: string;
  attrs?: Partial<Attr>;
  num_params: number;
  input?: Param[];
  output?: Param[];
  class?: string;
  member?: string;
  short_desc?: string;
}

export interface Extension {
  name: string;
  commands: Command[];
}

export async function getDefinitions(): Promise<DefinitionMap> {
  const definitionMap = {
    [eGame.GTA3]: 'gta3.json',
    [eGame.GTAVC]: 'vc.json',
    [eGame.GTASA]: 'sa.json',
  };
  const definitionMapSBL = {
    [eGame.GTA3]:
      'https://raw.githubusercontent.com/sannybuilder/library/master/gta3/gta3.json',
    [eGame.GTAVC]:
      'https://raw.githubusercontent.com/sannybuilder/library/master/vc/vc.json',
    [eGame.GTASA]:
      'https://raw.githubusercontent.com/sannybuilder/library/master/sa/sa.json',
  };
  const definitionFile = isBrowser
    ? definitionMapSBL[GLOBAL_OPTIONS.game]
    : definitionMap[GLOBAL_OPTIONS.game];
  try {
    let data: { extensions: Extension[] };
    if (isBrowser) {
      const response = await fetch(definitionFile);
      data = await response.json();
    } else {
      data = await file.loadJson(definitionFile);
    }

    const map: DefinitionMap = new Map();
    data.extensions.forEach((extension) => {
      extension.commands.forEach((command) => {
        const { name, input, id, output } = command;
        const params = [...(input || []), ...(output || [])].map((param) => {
          return { type: param.type };
        });
        map.set(utils.hexToOpcode(id), { name, params });
      });
    });
    return map;
  } catch {
    throw Log.error(AppError.NO_OPCODE, definitionFile);
  }
}

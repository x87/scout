import * as _ from 'lodash';
import Arguments from 'common/arguments';
import { eGame, eParamType } from 'common/enums';
import { Opcode } from 'common/interfaces';

export const isGameGTA3 = (): boolean => Arguments.game === eGame.GTA3;
export const isGameVC = (): boolean => Arguments.game === eGame.GTAVC;
export const isGameSA = (): boolean => Arguments.game === eGame.GTASA;
export const isArrayParam = (param): boolean =>
  [
    eParamType.GARRSTR8,
    eParamType.LARRSTR8,
    eParamType.GARRSTR16,
    eParamType.LARRSTR16,
    eParamType.GARRNUM32,
    eParamType.LARRNUM32
  ].includes(param);

export const getArrayIntersection = <T>(a1: T[], a2: T[]): T[] => {
  return _.intersection(a1, a2);
};

export const checkArrayIncludesArray = <T>(a1: T[], a2: T[]): boolean => {
  return getArrayIntersection(a2, a1).length === a2.length;
};

export const checkArrayIncludeItemFromArray = <T>(
  a1: T[],
  a2: T[]
): boolean => {
  return !!getArrayIntersection(a2, a1).length;
};

export const strPadLeft = (
  str: string,
  length: number,
  char: string = '0'
): string => {
  return _.padStart(str, length, char);
};

export const opcodeToHex = (opcode: Opcode): string => {
  return strPadLeft(opcode.toString(16).toUpperCase(), 4);
};

export const hexToOpcode = (id: string): Opcode => {
  return parseInt(id, 16);
};

import Arguments from 'common/arguments';
import { eGame, eParamType } from 'common/enums';
import { Opcode } from 'common/interfaces';

export const isGameGTA3 = (): boolean => Arguments.game === eGame.GTA3;
export const isGameVC = (): boolean => Arguments.game === eGame.GTAVC;
export const isGameSA = (): boolean => Arguments.game === eGame.GTASA;
export const isArrayParam = (param: eParamType): boolean =>
  [
    eParamType.GARRSTR8,
    eParamType.LARRSTR8,
    eParamType.GARRSTR16,
    eParamType.LARRSTR16,
    eParamType.GARRNUM32,
    eParamType.LARRNUM32,
  ].includes(param);

export const isEqual = <T>(a1: T[], a2: T[]): boolean => {
  return a1.length === a2.length && checkArrayIncludesArray(a1, a2);
};

export const removeFromArray = <T>(
  a1: T[],
  iteratee: (item: T) => boolean
): T[] => {
  const indexes = [];
  const removed = a1.filter((item, i) => iteratee(item) && indexes.push(i));

  for (let i = indexes.length - 1; i >= 0; i--) {
    a1.splice(indexes[i], 1);
  }
  return removed;
};

export const getArrayIntersection = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) {
    return [];
  }
  if (arrays.length === 1) {
    return arrays[0];
  }
  const others = arrays.slice(1);
  return arrays[0].filter((item) => others.every((arr) => arr.includes(item)));
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
  return str.padStart(length, char);
};

export const opcodeToHex = (opcode: Opcode): string => {
  return strPadLeft(opcode.toString(16).toUpperCase(), 4);
};

export const hexToOpcode = (id: string): Opcode => {
  return parseInt(id, 16);
};

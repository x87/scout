import Arguments from '../common/arguments';
import { eGame, eParamType } from '../common/enums';
import * as _ from 'lodash';

export const isGameGTA3 = () => Arguments.game === eGame.GTA3;
export const isGameVC = () => Arguments.game === eGame.GTAVC;
export const isGameSA = () => Arguments.game === eGame.GTASA;
export const isArrayParam = (param) => [
		eParamType.GARRSTR8,
		eParamType.LARRSTR8,
		eParamType.GARRSTR16,
		eParamType.LARRSTR16,
		eParamType.GARRNUM32,
		eParamType.LARRNUM32
	].indexOf(param) !== -1;

export const getArrayIntersection = (a1: any[], a2: any[]) => {
	return _.intersection(a1, a2);
};

export const checkArrayIncludesArray = (a1: any[], a2: any[]) => {
	return getArrayIntersection(a2, a1).length === a2.length;
};

export const checkArrayIncludeItemFromArray = (a1: any[], a2: any[]) => {
	return !!getArrayIntersection(a2, a1).length;
};

export const strPadLeft = (str: string, length: number, char: string = '0') => {
	return _.padStart(str, length, char);
};

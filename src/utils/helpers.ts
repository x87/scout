import Arguments from '../common/arguments';
import { eGame, eParamType } from '../common/enums';

export class Helpers {
	static isGameGTA3 = () => Arguments.game === eGame.GTA3;
	static isGameVC = () => Arguments.game === eGame.GTAVC;
	static isGameSA = () => Arguments.game === eGame.GTASA;
	static isArrayParam = (param) => [
		eParamType.GARRSTR8,
		eParamType.LARRSTR8,
		eParamType.GARRSTR16,
		eParamType.LARRSTR16,
		eParamType.GARRNUM32,
		eParamType.LARRNUM32
	].indexOf(param) !== -1

	static getArrayIntersection(a1: any[], a2: any[]) {
		return a1.filter(item => a2.indexOf(item) !== -1);
	}

	static checkArrayIncludesArray(a1: any[], a2: any[]) {
		return this.getArrayIntersection(a2, a1).length === a2.length;
	}

	static checkArrayIncludeItemFromArray(a1: any[], a2: any[]) {
		return !!this.getArrayIntersection(a2, a1).length;
	}

	static strPadLeft(str: string, length: number, char: string = '0') {
		return (Array(length + 1).join(char) + str).slice(-1 * length);
	}
}

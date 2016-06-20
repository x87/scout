import Arguments from '../common/arguments';
import { eGame, eParamType } from '../common/enums';

export class Helpers {
    public static isGameGTA3 = () => Arguments.game === eGame.GTA3;
    public static isGameVC = () => Arguments.game === eGame.GTAVC;
    public static isGameSA = () => Arguments.game === eGame.GTASA;
    public static isArrayParam = (param) => [
        eParamType.GARRSTR8,
        eParamType.LARRSTR8,
        eParamType.GARRSTR16,
        eParamType.LARRSTR16,
        eParamType.GARRNUM32,
        eParamType.LARRNUM32
    ].indexOf(param) !== -1;
    public static getArrayIntersection(a1: Array<any>, a2: Array<any>) {
        return a1.filter(item => a2.indexOf(item) !== -1);
    }
    public static checkArrayIncludesArray(a1: Array<any>, a2: Array<any>) {
        return this.getArrayIntersection(a2, a1).length === a2.length;
    }
    public static checkArrayIncludeItemFromArray(a1: Array<any>, a2: Array<any>) {
        return !!this.getArrayIntersection(a2, a1).length;
    }
}

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

    /**
     * Creates an array of values that present in both given arrays
     * @param {Array<any>} a1 Array 1
     * @param {Array<any>} a2 Array 2
     * @returns {Array<any>} Array including values present in both given arrays
     */
    public static getArrayIntersection(a1: Array<any>, a2: Array<any>) {
        return a1.filter(item => a2.indexOf(item) !== -1);
    }

    /**
     * Checks if Array 1 fully includes all values from Array 2
     * @param {Array<any>} a1 Array 1
     * @param {Array<any>} a2 Array 2
     * @returns {boolean} Result of checking
     */
    public static checkArrayIncludesArray(a1: Array<any>, a2: Array<any>) {
        return this.getArrayIntersection(a2, a1).length === a2.length;
    }

    /**
     * Checks if Array 1 includes any value from Array 2
     * @param {Array<any>} a1 Array 1
     * @param {Array<any>} a2 Array 2
     * @returns {boolean} Result of checking
     */
    public static checkArrayIncludeItemFromArray(a1: Array<any>, a2: Array<any>) {
        return !!this.getArrayIntersection(a2, a1).length;
    }

    /**
     * Pads a string on the left with a character to desired length
     * @param str String to pad.
     * @param length Desired length of the output string
     * @param char Character to pad with.
     * @returns {string} Output string.
     */
    public static strPadLeft(str: string, length: number, char: string = '0') {
        return (Array(length + 1).join(char) + str).slice(-1 * length);
    }
}

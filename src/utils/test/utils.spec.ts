import * as utils from 'utils';
import Arguments from 'common/arguments';
import { eGame, eParamType } from 'common/enums';

describe('utils spec' , () => {

	it('should be true if Arguments game is gta3', () => {
		Arguments.game = eGame.GTA3;
		expect(utils.isGameGTA3()).toBe(true);
		expect(utils.isGameVC()).toBe(false);
		expect(utils.isGameSA()).toBe(false);
	});

	it('should be true if Arguments game is vc', () => {
		Arguments.game = eGame.GTAVC;
		expect(utils.isGameGTA3()).toBe(false);
		expect(utils.isGameVC()).toBe(true);
		expect(utils.isGameSA()).toBe(false);
	});

	it('should be true if Arguments game is sa', () => {
		Arguments.game = eGame.GTASA;
		expect(utils.isGameGTA3()).toBe(false);
		expect(utils.isGameVC()).toBe(false);
		expect(utils.isGameSA()).toBe(true);
	});

	it('should be true for array-type opcode parameters', () => {
		expect(utils.isArrayParam(eParamType.GARRSTR8)).toBe(true);
		expect(utils.isArrayParam(eParamType.LARRSTR8)).toBe(true);
		expect(utils.isArrayParam(eParamType.GARRNUM32)).toBe(true);
		expect(utils.isArrayParam(eParamType.LARRNUM32)).toBe(true);
		expect(utils.isArrayParam(eParamType.GARRSTR16)).toBe(true);
		expect(utils.isArrayParam(eParamType.LARRSTR16)).toBe(true);
		expect(utils.isArrayParam(eParamType.EOL)).toBe(false);
	});

	it('should return non empty array for intersecting arrays', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3, 4];
		const a3 = [10, 11];
		const a4 = [];
		expect(utils.getArrayIntersection(a1, a2).length).toBeGreaterThan(0);
		expect(utils.getArrayIntersection(a1, a3).length).toBe(0);
		expect(utils.getArrayIntersection(a1, a4).length).toBe(0);
	});

	it('should return true if array is fully included in another array', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3];
		const a3 = [10, 11];
		const a4 = [];
		expect(utils.checkArrayIncludesArray(a1, a2)).toBe(true);
		expect(utils.checkArrayIncludesArray(a1, a3)).toBe(false);
		expect(utils.checkArrayIncludesArray(a1, a4)).toBe(true);
	});

	it('should return true if at least one item of array is included in another array', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3];
		const a3 = [10, 11];
		const a4 = [];
		expect(utils.checkArrayIncludeItemFromArray(a1, a2)).toBe(true);
		expect(utils.checkArrayIncludeItemFromArray(a1, a3)).toBe(false);
		expect(utils.checkArrayIncludeItemFromArray(a1, a4)).toBe(false);
	});

});

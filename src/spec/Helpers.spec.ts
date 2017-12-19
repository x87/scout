import { Helpers as helpers } from '../utils/helpers';
import Arguments from '../common/arguments';
import { eGame, eParamType } from '../common/enums';

export default function() {

	it('should be true if Arguments game is gta3', () => {
		Arguments.game = eGame.GTA3;
		expect(helpers.isGameGTA3()).toBe(true);
		expect(helpers.isGameVC()).toBe(false);
		expect(helpers.isGameSA()).toBe(false);
	});

	it('should be true if Arguments game is vc', () => {
		Arguments.game = eGame.GTAVC;
		expect(helpers.isGameGTA3()).toBe(false);
		expect(helpers.isGameVC()).toBe(true);
		expect(helpers.isGameSA()).toBe(false);
	});

	it('should be true if Arguments game is sa', () => {
		Arguments.game = eGame.GTASA;
		expect(helpers.isGameGTA3()).toBe(false);
		expect(helpers.isGameVC()).toBe(false);
		expect(helpers.isGameSA()).toBe(true);
	});

	it('should be true for array-type opcode parameters', () => {
		expect(helpers.isArrayParam(eParamType.GARRSTR8)).toBe(true);
		expect(helpers.isArrayParam(eParamType.LARRSTR8)).toBe(true);
		expect(helpers.isArrayParam(eParamType.GARRNUM32)).toBe(true);
		expect(helpers.isArrayParam(eParamType.LARRNUM32)).toBe(true);
		expect(helpers.isArrayParam(eParamType.GARRSTR16)).toBe(true);
		expect(helpers.isArrayParam(eParamType.LARRSTR16)).toBe(true);
		expect(helpers.isArrayParam(eParamType.EOL)).toBe(false);
	});

	it('should return non empty array for intersecting arrays', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3, 4];
		const a3 = [10, 11];
		const a4 = [];
		expect(helpers.getArrayIntersection(a1, a2).length).toBeGreaterThan(0);
		expect(helpers.getArrayIntersection(a1, a3).length).toBe(0);
		expect(helpers.getArrayIntersection(a1, a4).length).toBe(0);
	});

	it('should return true if array is fully included in another array', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3];
		const a3 = [10, 11];
		const a4 = [];
		expect(helpers.checkArrayIncludesArray(a1, a2)).toBe(true);
		expect(helpers.checkArrayIncludesArray(a1, a3)).toBe(false);
		expect(helpers.checkArrayIncludesArray(a1, a4)).toBe(true);
	});

	it('should return true if at least one item of array is included in another array', () => {
		const a1 = [1, 2, 3];
		const a2 = [2, 3];
		const a3 = [10, 11];
		const a4 = [];
		expect(helpers.checkArrayIncludeItemFromArray(a1, a2)).toBe(true);
		expect(helpers.checkArrayIncludeItemFromArray(a1, a3)).toBe(false);
		expect(helpers.checkArrayIncludeItemFromArray(a1, a4)).toBe(false);
	});

}

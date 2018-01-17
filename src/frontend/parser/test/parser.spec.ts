import Parser from '../';
import { IInstruction, DefinitionMap } from 'common/interfaces';
import { eParamType } from 'common/enums';

describe(Parser.name, () => {

	let opcodes: DefinitionMap;

	beforeAll(() => {
		opcodes = new Map();
		opcodes.set(1, { name: 'WAIT', params: [{type: 'any'}] });
		opcodes.set(2, { name: 'GOTO', params: [{type: 'any'}] });
	});

	afterAll(() => {
		opcodes = null;
	});

	it('should correctly parse input buffer', () => {
		const buf = Buffer.from(`0100040002000164000000`, 'hex');
		const parsed: IInstruction[] = [
			{
				opcode: 1,
				offset: 0,
				isHeader: false,
				isLeader: false,
				params: [{
					type: eParamType.NUM8,
					value: 0
				}]
			},
			{
				opcode: 2,
				offset: 4,
				isHeader: false,
				isLeader: false,
				params: [{
					type: eParamType.NUM32,
					value: 100
				}]
			}
		];
		const parser = new Parser(opcodes, buf, 0);

		for (const opcode of parser) {
			expect(opcode).toEqual(parsed.shift());
		}
		expect(true).toBe(true);
	});

});
